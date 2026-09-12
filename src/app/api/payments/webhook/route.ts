import { NextRequest, NextResponse } from "next/server";
import { createAuditLog, transitionPaymentStatus } from "@/lib/store";
import { getPaymentStatus as ykGetPayment, getRefund, PaymentStatus } from "@/lib/yookassa";
import type { YooKassaNotification } from "@/lib/yookassa";
import { confirmPayment, findLocalPayment, handleRefund } from "@/lib/payments";

const YOOKASSA_IPV4_PREFIXES = [
  "185.71.76.", "185.71.77.",
  "77.75.152.", "77.75.153.", "77.75.154.", "77.75.155.", "77.75.156.", "77.75.157.",
];
const YOOKASSA_IPV6_PREFIXES = [
  "2a02:5180:0:1509", "2a02:5180:0:2655", "2a02:5180:0:1533", "2a02:5180:0:2669",
];

function isYooKassaIp(ip: string): boolean {
  if (!ip) return false;
  const lower = ip.toLowerCase();
  return (
    YOOKASSA_IPV4_PREFIXES.some((p) => lower.startsWith(p)) ||
    YOOKASSA_IPV6_PREFIXES.some((p) => lower.startsWith(p.toLowerCase()))
  );
}

/**
 * YooKassa webhook.
 *
 * The notification body is never trusted: every payment / refund is
 * re-read from the YooKassa API. If that read fails we answer 502 so
 * YooKassa retries (it does for 24 h) — we no longer fall back to the
 * body on a "trusted" IP, because X-Forwarded-For can be spoofed.
 *
 *   payment.succeeded → confirmPayment (atomic, idempotent — safe against
 *                       the /subscribe polling racing this webhook)
 *   payment.canceled  → mark canceled (only from pending/expired)
 *   refund.succeeded  → object is a REFUND (object.payment_id); mark the
 *                       payment refunded, ledger event with 0 days, admin alert
 */
export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  if (!isYooKassaIp(clientIp)) console.warn(`[WEBHOOK] notification from non-YooKassa IP ${clientIp || "(empty)"} — verifying via API`);

  let body: YooKassaNotification;
  try {
    body = (await request.json()) as YooKassaNotification;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const event = body?.event;
  const objectId = body?.object?.id;
  if (!event || !objectId) {
    return NextResponse.json({ error: "Invalid notification format" }, { status: 400 });
  }
  console.log(`[WEBHOOK] ${event}: ${objectId} ip=${clientIp}`);

  try {
    // ── Refunds ──
    if (event.startsWith("refund.")) {
      let refund;
      try {
        refund = await getRefund(objectId);
      } catch (err) {
        console.error(`[WEBHOOK] refund ${objectId}: verification failed — asking YooKassa to retry`, err);
        return NextResponse.json({ error: "Verification failed" }, { status: 502 });
      }
      const outcome = await handleRefund(refund);
      console.log(`[WEBHOOK] refund ${refund.id} (payment ${refund.payment_id}): ${outcome}`);
      return NextResponse.json({ ok: true, outcome });
    }

    // ── Payments ──
    let verified;
    try {
      verified = await ykGetPayment(objectId);
    } catch (err) {
      console.error(`[WEBHOOK] payment ${objectId}: verification failed — asking YooKassa to retry`, err);
      return NextResponse.json({ error: "Verification failed" }, { status: 502 });
    }

    const local = await findLocalPayment(verified.id, verified.metadata?.paymentId);
    if (!local) {
      console.error(`[WEBHOOK] payment ${verified.id} (${verified.status}) has no local record — metadata=${JSON.stringify(verified.metadata ?? {})}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (verified.status === PaymentStatus.SUCCEEDED) {
      const r = await confirmPayment(local.id, "webhook");
      console.log(`[WEBHOOK] payment ${local.id}: ${r.outcome}${r.newEnd ? ` newEnd=${r.newEnd}` : ""}${r.panelSynced === false ? " (panel sync deferred)" : ""}`);
    } else if (verified.status === PaymentStatus.CANCELED) {
      const changed = await transitionPaymentStatus(local.id, ["pending", "expired"], "canceled");
      if (changed) await createAuditLog("payment.canceled", `YooKassa ID: ${verified.id}`, local.userId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[WEBHOOK] ${event} ${objectId} failed:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
