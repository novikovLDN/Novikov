import { getSessionUser } from "@/lib/session";

/**
 * Admin = the signed-in user whose email equals ADMIN_EMAIL
 * (case-insensitive). An unset ADMIN_EMAIL means "nobody".
 * The session comes from the server-side session table — a user id in
 * a cookie no longer grants anything.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  return !!admin && !!email && email.trim().toLowerCase() === admin;
}

export async function verifyAdmin(): Promise<{ authorized: boolean; error?: string; userId?: string }> {
  const su = await getSessionUser();
  if (!su) {
    return { authorized: false, error: "Не авторизован" };
  }
  if (!isAdminEmail(su.user.email)) {
    return { authorized: false, error: "Доступ запрещён" };
  }
  return { authorized: true, userId: su.user.id };
}
