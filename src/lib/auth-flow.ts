/**
 * Shared email sign-in: code check → user (with trial on creation) →
 * audit → welcome notification → panel sync request.
 *
 * Used by the server action (the UI) and by /api/auth/verify-code, so
 * there is exactly one trial path.
 */

import { TRIAL_DAYS } from "./brand-facts";
import { isDisposableEmail } from "./disposable-emails";
import { createAuditLog, createNotificationForUser, getOrCreateUser, NewUserResult, verifyCode } from "./store";
import { requestPanelSync } from "./subscription-sync";
import { plural } from "./ru-words";

export type SignInResult = { ok: true; user: NewUserResult } | { ok: false; error: string };

export const DISPOSABLE_EMAIL_ERROR = "Одноразовые email не поддерживаются. Используйте постоянный почтовый ящик.";

export async function completeEmailSignIn(input: {
  email: string;
  code: string;
  referralCode?: string;
  fingerprint?: string;
  ip: string | null;
}): Promise<SignInResult> {
  const email = input.email.trim().toLowerCase();
  if (isDisposableEmail(email)) return { ok: false, error: DISPOSABLE_EMAIL_ERROR };

  const check = verifyCode(email, input.code);
  if (!check.valid) return { ok: false, error: check.error || "Неверный код" };

  const user = await getOrCreateUser(email, input.referralCode || undefined, input.ip || undefined, input.fingerprint || undefined);

  await createAuditLog(
    user.isNew ? "user.register" : "user.login",
    user.isNew ? (user.trialGranted ? "trial granted" : `trial not granted: ${user.trialBlockedReason}`) : undefined,
    user.id,
    user.email,
    input.ip || undefined
  );

  if (user.isNew) {
    if (user.trialGranted) {
      await createNotificationForUser(
        user.id,
        "Добро пожаловать в Atlas Secure!",
        `Ваш пробный период активирован на ${TRIAL_DAYS} ${plural(TRIAL_DAYS, ["день", "дня", "дней"])}. В личном кабинете доступен QR-код и кнопки для подключения в Happ и V2RayTun.`
      );
      // The panel user is created by the sync; do it now so the key is
      // ready by the time the dashboard loads. Failures stay pending for
      // the worker.
      requestPanelSync(user.id, "signup");
    }
  }

  return { ok: true, user };
}
