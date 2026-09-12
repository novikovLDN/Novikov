"use server";

import { generateCode, sendVerificationEmail } from "@/lib/email";
import { saveCode, userHasPassword } from "@/lib/store";
import { isDisposableEmail } from "@/lib/disposable-emails";
import { rateLimitByEmail, rateLimitByIp } from "@/lib/rate-limit";
import { completeEmailSignIn, DISPOSABLE_EMAIL_ERROR } from "@/lib/auth-flow";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export interface SendCodeState {
  success: boolean;
  error?: string;
  email?: string;
  hasPassword?: boolean;
}

async function clientIp(): Promise<string | null> {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
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
    // Same limits as /api/auth/send-code: 5 per minute per IP, 3 codes per 5 minutes per email.
    const ipLimit = rateLimitByIp((await clientIp()) || "unknown");
    if (!ipLimit.allowed) {
      return { success: false, error: `Слишком много запросов. Повторите через ${ipLimit.retryAfterSeconds} сек.` };
    }
    if (isDisposableEmail(email)) {
      return { success: false, error: DISPOSABLE_EMAIL_ERROR };
    }

    // If user already has a password, redirect to login instead of sending code
    const hasPassword = await userHasPassword(email);
    if (hasPassword) {
      return { success: false, hasPassword: true, email };
    }

    const emailLimit = rateLimitByEmail(email);
    if (!emailLimit.allowed) {
      return { success: false, error: `Код уже отправлен. Повторите через ${emailLimit.retryAfterSeconds} сек.` };
    }

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
  } catch (err) {
    console.error("[AUTH] sendCodeAction failed:", err);
    return { success: false, error: "Ошибка сервера. Попробуйте позже." };
  }

  // Redirect to code step — works with and without JS
  redirect("/auth?step=code");
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
  let isNewUser = false;

  try {
    // One shared path with /api/auth/verify-code: code check, user +
    // trial (anti-abuse inside), audit, panel sync request.
    const result = await completeEmailSignIn({ email, code, referralCode: refCode, fingerprint, ip: await clientIp() });
    if (!result.ok) {
      return { success: false, error: result.error };
    }
    const user = result.user;
    needsPassword = !user.passwordHash;
    isNewUser = user.isNew;

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
  } catch (err) {
    console.error("[AUTH] verifyCodeAction failed:", err);
    return { success: false, error: "Ошибка сервера. Попробуйте позже." };
  }

  if (needsPassword) {
    return { success: true, needsPassword: true };
  }

  redirect(isNewUser ? "/dashboard?welcome=1" : "/dashboard");
}
