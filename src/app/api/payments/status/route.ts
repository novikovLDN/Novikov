import { NextRequest, NextResponse } from "next/server";
import { getUserById, getPaymentById, updatePaymentStatus, extendSubscription, creditReferrerOnPayment, updateUser } from "@/lib/store";
import { getPaymentStatus, PaymentStatus } from "@/lib/yookassa";
import { xrayAddUser } from "@/lib/xray";
import { setUserExpire, createUserWithExpire, encryptHappLink } from "@/lib/remnawave";
import { pool } from "@/lib/db";

const PERIOD_DAYS: Record<number, number> = {
  1: 30,
  3: 90,
  6: 180,
  12: 365,
};

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
    }

    const user = await getUserById(sessionId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    }

    const paymentId = request.nextUrl.searchParams.get("id");
    if (!paymentId) {
      return NextResponse.json({ success: false, error: "ID платежа не указан" }, { status: 400 });
    }

    const payment = await getPaymentById(paymentId);
    if (!payment || payment.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Платёж не найден" }, { status: 404 });
    }

    // If still pending and has a transaction ID, check with YooKassa
    if (payment.status === "pending" && payment.transactionId) {
      // Check if expired locally
      if (new Date() > new Date(payment.expiresAt)) {
        await updatePaymentStatus(payment.id, "expired");
        return NextResponse.json({
          success: true,
          data: { status: "expired", payment },
        });
      }

      try {
        const ykPayment = await getPaymentStatus(payment.transactionId);

        if (ykPayment.status === PaymentStatus.SUCCEEDED) {
          await updatePaymentStatus(payment.id, "confirmed", new Date());
          const days = PERIOD_DAYS[payment.period] || 30;
          await extendSubscription(payment.userId, days);
          await updateUser(payment.userId, { subscriptionPlan: payment.plan });

          // Mirror to Remnawave (same logic as webhook): use the freshly
          // computed subscription_end as the panel expireAt to keep both
          // stores in lockstep. If the user has no panel UUID yet, create
          // one with that exact expireAt.
          const refreshed = await getUserById(payment.userId);
          const targetExpireIso = refreshed?.subscriptionEnd
            ? new Date(refreshed.subscriptionEnd).toISOString()
            : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
          let remnawaveProvisioned = Boolean(refreshed?.remnawaveUserUuid);

          if (refreshed?.remnawaveUserUuid) {
            const updated = await setUserExpire(refreshed.remnawaveUserUuid, targetExpireIso);
            if (updated) {
              await pool.query(
                "UPDATE payments SET applied_to_remnawave_at = NOW() WHERE id = $1",
                [payment.id]
              );
            }
          } else if (refreshed) {
            const rwNew = await createUserWithExpire(refreshed.email, targetExpireIso, "payments/status reconcile after redirect", refreshed.panelId);
            if (rwNew) {
              const happLink = await encryptHappLink(rwNew.subscriptionUrl);
              await pool.query(
                `UPDATE users SET
                   remnawave_user_uuid = $1,
                   remnawave_short_uuid = $2,
                   subscription_url = $3,
                   happ_crypto_link = $4,
                   crypto_link_updated_at = $5
                 WHERE id = $6`,
                [rwNew.uuid, rwNew.shortUuid || null, rwNew.subscriptionUrl, happLink, happLink ? new Date() : null, refreshed.id]
              );
              await pool.query(
                "UPDATE payments SET applied_to_remnawave_at = NOW() WHERE id = $1",
                [payment.id]
              );
              remnawaveProvisioned = true;
            }
          }

          // Legacy Xray fallback only if Remnawave provisioning failed
          if (!remnawaveProvisioned && !user.xrayUuid) {
            const { generateXrayUuid, generateSubToken, generateSubId, buildSubscriptionUrl } = await import("@/lib/xray");
            const newUuid = generateXrayUuid();
            const newSubToken = generateSubToken();
            const subId = user.subId || generateSubId(user.email);
            const newKey = buildSubscriptionUrl(newSubToken, subId);
            await updateUser(user.id, { xrayUuid: newUuid, vpnKey: newKey, subToken: newSubToken, subId });
            await xrayAddUser(newUuid);
          }

          await creditReferrerOnPayment(payment.userId, payment.amount, payment.id);

          return NextResponse.json({
            success: true,
            data: { status: "confirmed", payment: { ...payment, status: "confirmed" } },
          });
        }

        if (ykPayment.status === PaymentStatus.CANCELED) {
          await updatePaymentStatus(payment.id, "canceled");
          return NextResponse.json({
            success: true,
            data: { status: "canceled", payment: { ...payment, status: "canceled" } },
          });
        }
      } catch {
        // YooKassa API error — return current local status
      }
    }

    return NextResponse.json({
      success: true,
      data: { status: payment.status, payment },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
