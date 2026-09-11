import type { Metadata } from "next";
import AtlasShell from "@/components/atlas/AtlasShell";
import ContactView from "./ContactView";

/**
 * /contact — серверная обёртка листа 15 «Атлас-издания».
 *
 * Метаданные объявляются здесь, тело с формой — клиентское
 * (`ContactView.tsx`), по образцу src/app/business/.
 */
export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Напишите Atlas Secure: Telegram @atlas_suppbot, почта отдела продаж, безопасности и приватности или форма обратной связи — ответим письмом.",
  alternates: { canonical: "/contact" },
};

export default function ContactRoute() {
  return (
    <AtlasShell sheetNo="15" sheetTitle="Контакты">
      <ContactView />
    </AtlasShell>
  );
}
