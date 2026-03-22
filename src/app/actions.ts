"use server";

import { generateCode, sendVerificationEmail } from "@/lib/email";
import { saveCode, verifyCode, getOrCreateUser } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { cookies } from "next/headers";

export interface SendCodeState {
  success: boolean;
  error?: string;
  email?: string;
}

export async function sendCodeAction(
  _prev: SendCodeState,
  formData: FormData
): Promise<SendCodeState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Введите корректный email адрес" };
  }

  try {
    const code = generateCode();
    saveCode(email, code);

    const sent = await sendVerificationEmail(email, code);
    if (!sent) {
      return { success: false, error: "Не удалось отправить код. Попробуйте позже." };
    }

    return { success: true, email };
  } catch {
    return { success: false, error: "Ошибка сервера. Попробуйте позже." };
  }
}

export interface VerifyCodeState {
  success: boolean;
  error?: string;
  userId?: string;
}

export async function verifyCodeAction(
  _prev: VerifyCodeState,
  formData: FormData
): Promise<VerifyCodeState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const code = formData.get("code") as string;

  if (!email || !code) {
    return { success: false, error: "Email и код обязательны" };
  }

  try {
    const result = verifyCode(email, code);
    if (!result.valid) {
      return { success: false, error: result.error };
    }

    const user = getOrCreateUser(email);

    if (user.xrayUuid) {
      await xrayAddUser(user.xrayUuid).catch(() => {});
    }

    const cookieStore = await cookies();
    cookieStore.set("session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return { success: true, userId: user.id };
  } catch {
    return { success: false, error: "Ошибка сервера. Попробуйте позже." };
  }
}
