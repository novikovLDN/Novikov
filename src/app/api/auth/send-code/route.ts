import { NextRequest, NextResponse } from "next/server";
import { generateCode, sendVerificationEmail } from "@/lib/email";
import { saveCode } from "@/lib/store";
import { isDisposableEmail } from "@/lib/disposable-emails";
import { rateLimitByIp, rateLimitByEmail } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP: 5 requests per minute
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip") || "unknown";
    const ipLimit = rateLimitByIp(clientIp);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Слишком много запросов. Повторите через ${ipLimit.retryAfterSeconds} сек.` },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Введите корректный email" },
        { status: 400 }
      );
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Одноразовые email не поддерживаются. Используйте постоянный почтовый ящик." },
        { status: 400 }
      );
    }

    // Rate limit by email: 3 codes per 5 minutes
    const emailLimit = rateLimitByEmail(email.toLowerCase());
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Код уже отправлен. Повторите через ${emailLimit.retryAfterSeconds} сек.` },
        { status: 429 }
      );
    }

    const code = generateCode();
    saveCode(email.toLowerCase(), code);

    const sent = await sendVerificationEmail(email.toLowerCase(), code);
    if (!sent) {
      return NextResponse.json(
        { success: false, error: "Не удалось отправить код. Попробуйте позже." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
