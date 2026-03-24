"use server";

import { generateCode, sendVerificationEmail } from "@/lib/email";
import { saveCode, verifyCode, getOrCreateUser } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { cookies, headers } from "next/headers";
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

export interface VerifyCodeState {
  success: boolean;
  error?: string;
  needsPassword?: boolean;
}

export async function verifyCodeAction(
  _prev: VerifyCodeState,
  formData: FormData
): Promise<VerifyCodeState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const refCode = (formData.get("ref") as string) || undefined;
  const fingerprint = (formData.get("fingerprint") as string) || undefined;
  const codeDigits = [];
  for (let i = 0; i < 6; i++) {
    codeDigits.push(formData.get(`code-${i}`) as string || "");
  }
  const code = codeDigits.join("");

  if (!email || code.length !== 6) {
    return { success: false, error: "Введите код из 6 цифр" };
  }

  let needsPassword = false;

  try {
    const result = verifyCode(email, code);
    if (!result.valid) {
      return { success: false, error: result.error };
    }

    // Get client IP for trial abuse prevention
    const hdrs = await headers();
    const clientIp = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim()
      || hdrs.get("x-real-ip")
      || "unknown";

    const user = await getOrCreateUser(email, refCode, clientIp, fingerprint);
    needsPassword = !user.passwordHash;

    // Only add to Xray for newly created users (not on repeat login)
    if (user.isNew && user.xrayUuid) {
      xrayAddUser(user.xrayUuid).catch(() => {});
    }

    const cookieStore = await cookies();
    cookieStore.set("session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 60 * 60, // 3 hours
      path: "/",
    });
    // Clean up pending_email cookie
    cookieStore.delete("pending_email");
  } catch {
    return { success: false, error: "Ошибка сервера. Попробуйте позже." };
  }

  if (needsPassword) {
    return { success: true, needsPassword: true };
  }

  redirect("/dashboard");
}
