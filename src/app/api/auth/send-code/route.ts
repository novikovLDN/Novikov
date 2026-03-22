import { NextRequest, NextResponse } from "next/server";
import { generateCode, sendVerificationEmail } from "@/lib/email";
import { saveCode } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Введите корректный email" },
        { status: 400 }
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
