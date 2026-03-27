import { NextRequest, NextResponse } from "next/server";
import { verifyCode, getOrCreateUser, createNotificationForUser, createAuditLog } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { isDisposableEmail } from "@/lib/disposable-emails";

export async function POST(request: NextRequest) {
  try {
    const { email, code, referralCode, fingerprint } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "Email и код обязательны" },
        { status: 400 }
      );
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Одноразовые email не поддерживаются." },
        { status: 400 }
      );
    }

    const result = verifyCode(email.toLowerCase(), code);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Get client IP for trial abuse prevention
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    // Create user with trial period or return existing
    const user = await getOrCreateUser(email.toLowerCase(), referralCode || undefined, clientIp, fingerprint || undefined);

    // Audit log
    await createAuditLog(user.isNew ? "user.register" : "user.login", undefined, user.id, user.email, clientIp);

    // Only add to Xray for newly created users (not on repeat login)
    if (user.isNew && user.xrayUuid) {
      xrayAddUser(user.xrayUuid).catch(() => {
        console.error(`[AUTH] Failed to add user to Xray: ${user.email}`);
      });

      // Send welcome notification about 24h trial
      createNotificationForUser(
        user.id,
        "Добро пожаловать в Atlas Secure!",
        "Ваш ключ выдан на 24 часа для тестирования. Для приобретения полноценной подписки перейдите в Telegram-бот Atlas Secure."
      ).catch(() => {});
    }

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: user.vpnKey,
        xrayUuid: user.xrayUuid,
        isNew: user.isNew,
      },
    });

    response.cookies.set("session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3 * 60 * 60, // 3 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
