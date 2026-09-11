import type { Metadata } from "next";
import AtlasShell from "@/components/atlas/AtlasShell";
import DashboardView from "./DashboardView";

/**
 * /dashboard — серверная обёртка кабинета: метаданные и оболочка
 * «Атлас-издания». Тело со стейтом подписки — клиентский DashboardView.
 *
 * Кабинет из поиска закрыт: страница личная и без сессии уводит на вход.
 * «Войти» в шапке не нужна — человек уже внутри.
 */
export const metadata: Metadata = {
  title: "Кабинет",
  description: "Подписка, ключ подключения, баланс и приглашения Atlas Secure.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <AtlasShell sheetNo="20" sheetTitle="Кабинет" headCta={null}>
      <DashboardView />
    </AtlasShell>
  );
}
