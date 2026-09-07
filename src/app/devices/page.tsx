import type { Metadata } from "next";
import { cookies } from "next/headers";
import DevicesView from "./DevicesView";
import { DEVICE_LIMIT } from "@/lib/plans";

/**
 * /devices — серверная обёртка.
 *
 * Нужна ради двух вещей. Первая: собственные метаданные — до этого
 * страница отдавалась поиску под общим заголовком сайта. Вторая: факт
 * наличия сессии. Куку сессии нельзя прочитать из браузера (она
 * httpOnly), поэтому клиент спрашивал подписку у всех подряд и
 * получал 401 — обработанный, но всё равно записанный браузером в
 * консоль как ошибка на каждом открытии страницы гостем.
 */
export const metadata: Metadata = {
  title: "Устройства и настройка",
  description:
    `Как подключить Atlas на iPhone, Android, macOS, Windows и Android TV. Одна подписка работает на ${DEVICE_LIMIT} устройствах — приложение бесплатное, ключ и QR-код выдаются в личном кабинете.`,
  alternates: { canonical: "/devices" },
};

export default async function DevicesRoute() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("session")?.value);
  return <DevicesView hasSession={hasSession} />;
}
