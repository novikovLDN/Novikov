"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/pixel/SiteHeader";
import HeroSection from "@/components/pixel/HeroSection";
import TrustBand from "@/components/pixel/TrustBand";
import BenefitsSection from "@/components/pixel/BenefitsSection";
import ProductSection from "@/components/pixel/ProductSection";
import HowItWorksSection from "@/components/pixel/HowItWorksSection";
import DevicesSection from "@/components/pixel/DevicesSection";
import PricingSection from "@/components/pixel/PricingSection";
import LocationsSection from "@/components/pixel/LocationsSection";
import SiteOutro from "@/components/pixel/SiteOutro";
import { useReveal } from "@/components/pixel/motion";

/**
 * / — публичный лендинг.
 *
 * Направление и обоснование: research/concept.md.
 * Тёмный технологичный минимализм, пиксельная сетка, один тёплый
 * акцент, фирменный мотив — живые кубики.
 *
 * Порядок повествования: обещание (герой) → ранний сигнал доверия
 * (полоса локаций) → доказательство скорости (преимущества) →
 * сам продукт (превью кабинета) → как его получить (шаги) → где
 * работает (устройства) → сколько стоит → где физически стоят
 * серверы → финальный призыв. Доказательство идёт раньше цены —
 * решение принимается до того, как читатель увидит цифру.
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
      <SiteHeader />
      <main>
        <HeroSection primaryHref={primaryHref} />
        <TrustBand />
        <BenefitsSection />
        <ProductSection />
        <HowItWorksSection />
        <DevicesSection />
        <PricingSection />
        <LocationsSection />
      </main>

      <SiteOutro primaryHref={primaryHref} />
    </div>
  );
}
