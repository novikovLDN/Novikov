import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PreviewPage from "@/components/preview/PreviewPage";
import { VARIANTS, type Variant } from "@/components/preview/variants";
import { serif, sans, stencil, mono } from "../fonts";

/**
 * /preview/a|b|c — три направления ребрендинга на одном содержании.
 *
 * Направление невозможно выбрать по описанию: словами «премиальный
 * минимализм» и «редакционная подача» звучат одинаково убедительно.
 * Поэтому здесь один и тот же текст и одни и те же числа собраны в
 * трёх разных системах — сравнивается то, что видно.
 *
 * Страницы закрыты от поиска: это рабочий материал, а не витрина.
 */
export const metadata: Metadata = {
  title: "Направление",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return VARIANTS.map((variant) => ({ variant }));
}

export default async function PreviewRoute({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  if (!(VARIANTS as readonly string[]).includes(variant)) notFound();
  return (
    <div className={`${serif.variable} ${sans.variable} ${stencil.variable} ${mono.variable}`}>
      <PreviewPage variant={variant as Variant} />
    </div>
  );
}
