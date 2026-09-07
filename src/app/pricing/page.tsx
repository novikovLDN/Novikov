import type { Metadata } from "next";
import PricingView from "./PricingView";
import { PLANS, formatRub } from "@/lib/plans";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { COUNTRY_COUNT } from "@/lib/locations";

/**
 * /pricing — серверная обёртка: метаданные страницы.
 *
 * Числа в описании берутся из кода, а не пишутся руками: иначе
 * поисковая выдача обещает одну цену, а касса берёт другую.
 */
export const metadata: Metadata = {
  title: "Тарифы",
  description:
    `Два тарифа Atlas: Basic от ${formatRub(PLANS.basic[1])} ₽ и Plus от ${formatRub(PLANS.plus[1])} ₽ в месяц. ` +
    `Разница одна — ширина канала. ${COUNTRY_COUNT} стран на выбор, ${TRIAL_DAYS} дня бесплатно без карты, отмена в один клик.`,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Тарифы — Atlas",
    description: `Два тарифа, разница одна — ширина канала. ${TRIAL_DAYS} дня бесплатно, без карты.`,
    type: "website",
    url: "/pricing",
  },
};

export default function PricingRoute() {
  return <PricingView />;
}
