"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/pixel/SiteHeader";
import HeroSection from "@/components/pixel/HeroSection";
import TrustBand from "@/components/pixel/TrustBand";
import BenefitsSection from "@/components/pixel/BenefitsSection";
import ChannelSection from "@/components/pixel/ChannelSection";
import SecuritySection from "@/components/pixel/SecuritySection";
import KineticSeam from "@/components/pixel/KineticSeam";
import ScrollLayer from "@/components/pixel/ScrollLayer";
import AmbientField from "@/components/pixel/AmbientField";
import HowItWorksSection from "@/components/pixel/HowItWorksSection";
import DevicesSection from "@/components/pixel/DevicesSection";
import PricingSection from "@/components/pixel/PricingSection";
import LocationsSection from "@/components/pixel/LocationsSection";
import SiteOutro from "@/components/pixel/SiteOutro";
import { ScrollProgress, useReveal } from "@/components/pixel/motion";

/**
 * / — публичный лендинг.
 *
 * Направление и обоснование: research/concept.md.
 * Тёмный технологичный минимализм, пиксельная сетка, один тёплый
 * акцент, фирменный мотив — живые кубики.
 *
 * Порядок повествования: обещание (герой) → ранний сигнал доверия
 * (полоса локаций) → доказательство скорости (преимущества) → чем
 * эта скорость измеряется (ширина канала) → кто отвечает за данные
 * (безопасность) → как продукт получить (шаги) → где он работает
 * (устройства) → сколько стоит → где физически стоят серверы →
 * финальный призыв. Доказательство идёт раньше цены — решение
 * принимается до того, как читатель увидит цифру.
 *
 * Скорость и безопасность разведены в два соседних блока намеренно:
 * это два разных возражения («будет тормозить» и «а данные?»), и
 * ответ на каждое должен читаться отдельно.
 */
interface LandingPageProps {
  referralCode?: string;
}

export default function LandingPage({ referralCode }: LandingPageProps) {
  const [refCode, setRefCode] = useState<string | null>(referralCode ?? null);
  useReveal();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (referralCode) {
      try { localStorage.setItem("atlas-ref", referralCode); } catch { /* приватный режим */ }
      setRefCode(referralCode);
      return;
    }
    try {
      const saved = localStorage.getItem("atlas-ref");
      if (saved) setRefCode(saved);
    } catch { /* приватный режим */ }
  }, [referralCode]);

  const primaryHref = refCode ? `/auth?ref=${encodeURIComponent(refCode)}` : "/auth";

  return (
    <div className="px-page">
      <div className="px-grid-bg" aria-hidden />
      {/* Каркас колонок виден как элемент оформления: приём
          редакционно-технических страниц, где сетка не прячется. */}
      <div className="px-frame" aria-hidden />
      {/* Пространство по краям живёт вместе с прокруткой: частицы
          летят навстречу движению страницы. */}
      <AmbientField />
      <ScrollProgress />
      <SiteHeader />
      <main>
        <HeroSection primaryHref={primaryHref} />
        <TrustBand />
        {/* Каждая секция расходится слоями на собственной прокрутке:
            заголовок отстаёт от содержимого, между планами появляется
            глубина. Прогресс считает один слушатель на секцию. */}
        <ScrollLayer><BenefitsSection /></ScrollLayer>
        <ScrollLayer><ChannelSection /></ScrollLayer>

        {/* Шов между «сколько даём» и «кто отвечает»: крупная строка
            фактов вместо пустой отбивки. */}
        <KineticSeam />

        <ScrollLayer><SecuritySection /></ScrollLayer>
        <ScrollLayer><HowItWorksSection /></ScrollLayer>
        <ScrollLayer><DevicesSection /></ScrollLayer>
        <ScrollLayer><PricingSection /></ScrollLayer>
        <ScrollLayer><LocationsSection /></ScrollLayer>
      </main>

      <SiteOutro primaryHref={primaryHref} />
    </div>
  );
}
