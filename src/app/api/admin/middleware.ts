import { cookies } from "next/headers";
import { getUserById } from "@/lib/store";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export async function verifyAdmin(): Promise<{ authorized: boolean; error?: string }> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session")?.value;
  if (!userId) {
    return { authorized: false, error: "Не авторизован" };
  }

  const user = await getUserById(userId);
  if (!user || user.email !== ADMIN_EMAIL) {
    return { authorized: false, error: "Доступ запрещён" };
  }

  return { authorized: true };
}
