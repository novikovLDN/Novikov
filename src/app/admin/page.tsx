import type { Metadata } from "next";
import AtlasShell from "@/components/atlas/AtlasShell";
import AdminView from "./AdminView";

/**
 * /admin — серверная обёртка админ-панели: метаданные и оболочка
 * «Атлас-издания». Тело со всей логикой — клиентский AdminView.
 *
 * Права проверяют API админки (verifyAdmin, 403): без прав экран
 * показывает «Доступ запрещён», как и раньше. Из поиска страница закрыта.
 */
export const metadata: Metadata = {
  title: "Админ-панель",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AtlasShell sheetNo="24" sheetTitle="Админка" headCta={{ href: "/dashboard", label: "Кабинет" }} footer="compact">
      <AdminView />
    </AtlasShell>
  );
}
