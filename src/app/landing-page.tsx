"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/pixel/SiteHeader";
import HeroSection from "@/components/pixel/HeroSection";
import ProductSection from "@/components/pixel/ProductSection";
import BenefitsSection from "@/components/pixel/BenefitsSection";
import DevicesSection from "@/components/pixel/DevicesSection";
import HowItWorksSection from "@/components/pixel/HowItWorksSection";
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
        <ProductSection />
        <BenefitsSection />
        <DevicesSection />
        <HowItWorksSection />
        <PricingSection />
        <LocationsSection />
      </main>

      <SiteOutro primaryHref={primaryHref} />
    </div>
  );
}
