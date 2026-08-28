"use client";

import Link from "next/link";

/**
 * "Работает везде" — light section (blends with the body bg).
 *
 * White device cards on the off-white body. Only Hero, FinalCta and
 * Footer stay dark/accent-coloured; every content section is light,
 * per the reference rhythm.
 */
export default function DeviceGallerySection() {
  const devices = [
    { name: "iPhone",  detail: "iOS 16+" },
    { name: "Android", detail: "10+" },
    { name: "macOS",   detail: "M1 / Intel" },
    { name: "Windows", detail: "10 / 11" },
    { name: "Linux",   detail: "все дистры" },
    { name: "Router",  detail: "OpenWrt / Keenetic" },
  ];

  return (
    <section className="bg-[#f5f5f0] text-[#111] px-5 sm:px-8 py-20 sm:py-28 lg:py-32">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-10 mb-10 sm:mb-14">
          <h2 className="font-mts-wide text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02] tracking-tight font-bold max-w-[12ch]">
            Работает<br />на любом устройстве
          </h2>
          <Link
            href="/devices"
            className="font-mts-wide inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/15 text-black/75 hover:bg-black/5 hover:border-black/25 text-[13px] transition-colors self-start md:self-end"
          >
            Инструкции по настройке
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {devices.map((d) => (
            <div
              key={d.name}
              className="group aspect-square rounded-2xl border border-black/[0.06] bg-white hover:border-black/[0.15] hover:-translate-y-0.5 transition-all p-4 sm:p-5 flex flex-col justify-between"
            >
              <DeviceIcon name={d.name} />
              <div>
                <div className="font-mts-wide text-black text-[15px] sm:text-[17px] font-medium">{d.name}</div>
                <div className="font-mts-wide text-black/50 text-[11px] sm:text-[12px] mt-0.5">{d.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeviceIcon({ name }: { name: string }) {
  // 40 px on mobile, 32 px on sm+ — bigger on small phones so the
  // icon reads as the focal point of a ~160 px square card.
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "w-10 h-10 sm:w-8 sm:h-8 text-black/60 group-hover:text-black transition-colors",
  };
  switch (name) {
    case "iPhone":
      return (
        <svg {...props}>
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
      );
    case "Android":
      return (
        <svg {...props}>
          <path d="M4 16V9a2 2 0 012-2h12a2 2 0 012 2v7" />
          <path d="M4 16h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
          <path d="M8 7l-2-3M16 7l2-3" />
        </svg>
      );
    case "macOS":
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="12" rx="1" />
          <path d="M2 20h20M9 20l1-4M15 20l-1-4" />
        </svg>
      );
    case "Windows":
      return (
        <svg {...props}>
          <path d="M3 5l8-1v8H3zM11 4l10-1v10H11zM3 13h8v7l-8-1zM11 13h10v8l-10-1z" />
        </svg>
      );
    case "Linux":
      return (
        <svg {...props}>
          <path d="M12 3c-2 0-3 1.5-3 4 0 1 .3 2 1 3l-2 4c-1 2-1 4 0 5 1 1 3 1 4 0M12 3c2 0 3 1.5 3 4 0 1-.3 2-1 3l2 4c1 2 1 4 0 5-1 1-3 1-4 0" />
          <circle cx="10.5" cy="8" r="0.5" fill="currentColor" />
          <circle cx="13.5" cy="8" r="0.5" fill="currentColor" />
        </svg>
      );
    case "Router":
      return (
        <svg {...props}>
          <rect x="3" y="12" width="18" height="7" rx="1" />
          <path d="M6 12V8M10 12V6M14 12V6M18 12V8" />
          <circle cx="7" cy="16" r="0.5" fill="currentColor" />
          <circle cx="9" cy="16" r="0.5" fill="currentColor" />
        </svg>
      );
  }
  return null;
}
