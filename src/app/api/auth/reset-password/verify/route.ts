import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "@/lib/store";
import { issueResetToken } from "@/lib/reset-tokens";

/**
 * POST /api/auth/reset-password/verify — шаг «код из письма» при сбросе
 * пароля. Проверяет код на сервере (попытки считаются, после пяти
 * неверных код сгорает) и обменивает верный код на одноразовый токен
 * смены пароля. Без токена шаг «новый пароль» не открывается.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : "";

    if (!email || code.length !== 6) {
      return NextResponse.json({ success: false, error: "Введите код из 6 цифр" }, { status: 400 });
    }

    const result = verifyCode(email, code);
    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { resetToken: issueResetToken(email) } });
  } catch {
    return NextResponse.json({ success: false, error: "Не удалось проверить код. Попробуйте ещё раз." }, { status: 500 });
  }
}
