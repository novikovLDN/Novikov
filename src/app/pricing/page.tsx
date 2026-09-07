import type { Metadata } from "next";
import PricingView from "./PricingView";
import { PLANS, formatRub } from "@/lib/plans";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { COUNTRY_COUNT } from "@/lib/locations";
import { FAQ } from "@/lib/faq";

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

/**
 * Разметка FAQPage.
 *
 * Практика 2026: ИИ-поиск отвечает пользователю напрямую, и явно
 * размеченные пары «вопрос — ответ» он извлекает и цитирует охотнее
 * всего. Вопросы берутся из того же массива, что показан на
 * странице, — текст в выдаче не может разойтись с текстом на сайте.
 */
const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function PricingRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        // Содержимое собрано из константы в src/lib/faq.ts,
        // пользовательских данных в ней нет.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />
      <PricingView />
    </>
  );
}
