import type { Metadata } from "next";
import { cookies } from "next/headers";
import AtlasShell from "@/components/atlas/AtlasShell";
import DevicesView from "./DevicesView";
import { DEVICE_LIMIT } from "@/lib/plans";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { plural } from "@/lib/ru-words";

/**
 * /devices — серверная обёртка.
 *
 * Нужна ради трёх вещей. Первая: собственные метаданные — до этого
 * страница отдавалась поиску под общим заголовком сайта. Вторая: факт
 * наличия сессии. Куку сессии нельзя прочитать из браузера (она
 * httpOnly), поэтому клиент спрашивал подписку у всех подряд и
 * получал 401 — обработанный, но всё равно записанный браузером в
 * консоль как ошибка на каждом открытии страницы гостем. Третья:
 * оболочка «Атлас-издания» (лист 12) остаётся серверной — клиентское
 * здесь только тело страницы.
 */
export const metadata: Metadata = {
  title: "Как подключить на iPhone, Android, Windows, Mac и ТВ",
  description:
    `Настройка за минуту на iPhone, iPad, Android, Mac, Windows и Android TV. Приложение бесплатное, ключ добавляется одной кнопкой или по QR-коду. ` +
    `Одна подписка — до ${DEVICE_LIMIT} устройств, ${TRIAL_DAYS} ${plural(TRIAL_DAYS, ["день", "дня", "дней"])} бесплатно.`,
  alternates: { canonical: "/devices" },
};

export default async function DevicesRoute() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("session")?.value);
  return (
    <AtlasShell sheetNo="12" sheetTitle="Устройства">
      <DevicesView hasSession={hasSession} />
    </AtlasShell>
  );
}
