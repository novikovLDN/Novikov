"use server";

import { generateCode, sendVerificationEmail } from "@/lib/email";
import { saveCode, verifyCode, getOrCreateUser } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

    // Set cookie so the code screen knows which email to verify
    const cookieStore = await cookies();
    cookieStore.set("pending_email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60, // 10 minutes (same as code TTL)
      path: "/",
    });
  } catch {
    return { success: false, error: "Ошибка сервера. Попробуйте позже." };
  }

  // Redirect to code step — works with and without JS
  redirect("/?step=code");
}

export async function verifyCodeAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const codeDigits = [];
  for (let i = 0; i < 6; i++) {
    codeDigits.push(formData.get(`code-${i}`) as string || "");
  }
  const code = codeDigits.join("");

  if (!email || code.length !== 6) {
    return { success: false, error: "Введите код из 6 цифр" };
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
    // Clean up pending_email cookie
    cookieStore.delete("pending_email");
  } catch {
    return { success: false, error: "Ошибка сервера. Попробуйте позже." };
  }

  redirect("/dashboard");
}
