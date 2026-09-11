import type { Metadata } from "next";
import { cookies } from "next/headers";
import AtlasShell from "@/components/atlas/AtlasShell";
import AuthPage from "../auth-page";

/**
 * /auth — серверная обёртка входа: метаданные и оболочка «Атлас-издания».
 * Тело со всеми шагами (почта → код → пароль, вход по паролю,
 * восстановление, passkey) — клиентский AuthPage.
 *
 * Экран входа из поиска закрыт. «Войти» в шапке не нужна — человек уже
 * на входе.
 */
export const metadata: Metadata = {
  title: "Вход",
  description: "Вход и регистрация в Atlas Secure по коду из письма или паролю.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ step?: string; ref?: string }>;
}

export default async function Auth({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const pendingEmail = cookieStore.get("pending_email")?.value || "";
  const initialStep = params.step === "code" && pendingEmail ? "code" : "email";

  return (
    <AtlasShell sheetNo="21" sheetTitle="Вход" headCta={null} footer="compact">
      <AuthPage
        initialStep={initialStep}
        initialEmail={pendingEmail}
        referralCode={params.ref}
      />
    </AtlasShell>
  );
}
