import type { Metadata } from "next";
import AtlasShell from "@/components/atlas/AtlasShell";
import AddDeviceView from "./AddDeviceView";

/**
 * /add-device — серверная обёртка мастера подключения: метаданные и
 * оболочка «Атлас-издания». Тело со стейтом шагов — клиентский
 * AddDeviceView (образец — /dashboard).
 *
 * Экран личный: ключ подписки на нём свой у каждого аккаунта, поэтому
 * из поиска закрыт. В шапке вместо «Войти» — путь назад в кабинет.
 */
export const metadata: Metadata = {
  title: "Новое устройство",
  description: "Подключение нового устройства к подписке Atlas Secure: приложение, QR-код и ключ.",
  robots: { index: false, follow: false },
};

export default function AddDevicePage() {
  return (
    <AtlasShell sheetNo="23" sheetTitle="Новое устройство" headCta={{ href: "/dashboard", label: "Кабинет" }}>
      <AddDeviceView />
    </AtlasShell>
  );
}
