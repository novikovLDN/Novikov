"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/landing/SiteHeader";
import { useRevealFallback } from "@/components/landing/motion";
import HeroSection from "@/components/landing/HeroSection";
import DevicesSection from "@/components/landing/DevicesSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PricingSection from "@/components/landing/PricingSection";
import LocationsSection from "@/components/landing/LocationsSection";
import FinalCtaSection from "@/components/landing/FinalCtaSection";
import SiteFooter from "@/components/landing/SiteFooter";

/**
 * / — публичный лендинг.
 *
 * Дизайн-концепция и обоснование каждого решения: research/concept.md.
 * Формула: «приборная панель, а не рекламный плакат».
 *
 * Ритм поверхностей — светлое тело в тёмных скобках:
 *
 *   тёмный герой
 *     ↓ светлое тело: устройства → выгоды → шаги → тарифы → локации
 *   тёмный финал: призыв + футер на одной поверхности
 *
 * Каждая секция — отдельный компонент в src/components/landing/:
 * правка одного блока не требует чтения всей страницы. Общие примитивы
 * (Icon, SectionHeading, SiteHeader) живут там же, поэтому иконки,
 * шапки секций и навигация существуют в единственном экземпляре.
 */
interface LandingPageProps {
  referralCode?: string;
}

export default function LandingPage({ referralCode }: LandingPageProps) {
  const [refCode, setRefCode] = useState<string | null>(referralCode ?? null);

  // Каскад появления работает и там, где нет scroll-driven анимаций.
  useRevealFallback();

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
    <div className="ls-page">
      <SiteHeader primaryHref={primaryHref} />

      <main>
        <HeroSection primaryHref={primaryHref} />
        <DevicesSection />
        <BenefitsSection />
        <HowItWorksSection />
        <PricingSection />
        <LocationsSection />
      </main>

      <div className="ls-focal ls-outro">
        <div className="ls-aurora" aria-hidden>
          <span />
          <span />
        </div>
        <FinalCtaSection primaryHref={primaryHref} />
        <SiteFooter />
      </div>
    </div>
  );
}
