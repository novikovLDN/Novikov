"use client";

import { useEffect, useState } from "react";
import HeroV4 from "@/components/HeroV4";
import DeviceGallerySection from "@/components/DeviceGallerySection";
import ThreePillarsSection from "@/components/ThreePillarsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingPreviewSection from "@/components/PricingPreviewSection";
import ServerLocationsSection from "@/components/ServerLocationsSection";
import FinalCtaSection from "@/components/FinalCtaSection";
import LandingFooter from "@/components/LandingFooter";

/**
 * / — public landing page (v4 redesign, provod.ai-inspired).
 *
 * Every section is a self-contained component under src/components/,
 * so tweaks to one don't require reading the whole page. Dark cards
 * float on the light body-bg, giving the visual rhythm of the
 * reference: dark card → light open section → dark card → light open
 * → orange CTA → dark footer.
 *
 * Legacy `pl-*` marketing sections (isometric 3-card, feature 1/2/3,
 * security, about, manifesto) are removed — they used a different
 * design language and duplicated content the new sections cover
 * cleanly. Nothing is missing that a customer needs: pricing has its
 * own /pricing page, security lives at /security, about at /about.
 */
interface LandingProps {
  referralCode?: string;
}

export default function LandingPage({ referralCode }: LandingProps) {
  const [refCode, setRefCode] = useState<string | null>(referralCode ?? null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (referralCode) {
      try { localStorage.setItem("atlas-ref", referralCode); } catch { /* ignore */ }
      setRefCode(referralCode);
      return;
    }
    try {
      const saved = localStorage.getItem("atlas-ref");
      if (saved) setRefCode(saved);
    } catch { /* ignore */ }
  }, [referralCode]);

  const primaryHref = refCode ? `/auth?ref=${encodeURIComponent(refCode)}` : "/auth";

  return (
    <div className="bg-[#f5f5f0] min-h-dvh flex flex-col">
      {/* Screen 1 — Hero (dark, rounded bottom, top flush) */}
      <HeroV4 primaryHref={primaryHref} />

      {/* Screen 2 — Devices (dark rounded card) */}
      <DeviceGallerySection />

      {/* Screen 3 — Three pillars (light full-bleed, ambient) */}
      <ThreePillarsSection />

      {/* Screen 4 — How it works (dark rounded card) */}
      <HowItWorksSection />

      {/* Screen 5 — Pricing preview (dark rounded card) */}
      <PricingPreviewSection />

      {/* Screen 6 — Server locations (light full-bleed) */}
      <ServerLocationsSection />

      {/* Screen 7 — Final CTA (orange rounded card) */}
      <FinalCtaSection />

      {/* Footer (dark rounded card at bottom) */}
      <LandingFooter />
    </div>
  );
}
