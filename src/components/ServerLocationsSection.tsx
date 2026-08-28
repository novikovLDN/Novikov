"use client";

/**
 * "Наши локации" — light full-bleed section (blends with body bg).
 *
 * Reference (provod.ai screen 5) is a scrollable model catalog with
 * cards showing model name / provider / prices. We reuse the pattern
 * for our server locations: country card with server counts and
 * bandwidth. Same MTS Wide typography, same card visual language.
 */
export default function ServerLocationsSection() {
  const locations = [
    { flag: "🇩🇪", country: "Германия",   city: "Frankfurt",   servers: 12, bandwidth: "200 Гбит/с", latency: "24 мс из Москвы" },
    { flag: "🇳🇱", country: "Нидерланды", city: "Amsterdam",   servers: 8,  bandwidth: "100 Гбит/с", latency: "32 мс из Москвы" },
    { flag: "🇷🇺", country: "Россия",     city: "Москва",      servers: 6,  bandwidth: "100 Гбит/с", latency: "< 5 мс регион"    },
    { flag: "🇦🇺", country: "Австралия",  city: "Sydney",      servers: 4,  bandwidth: "75 Гбит/с",  latency: "180 мс из Москвы" },
  ];

  return (
    <section className="bg-[#f5f5f0] text-[#111] px-5 sm:px-8 py-20 sm:py-28 lg:py-32">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-12 sm:mb-16">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">
            Наши локации
          </div>
          <h2 className="font-mts-wide text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
            Дата-центры<br />в 4 странах
          </h2>
          <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-black/55 mt-6 max-w-[52ch]">
            Партнёрские Tier-3 и Tier-4 дата-центры на трёх континентах. Автоматически выбираем ближайший к вам, но локацию можно закрепить вручную.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {locations.map((l) => (
            <div
              key={l.city}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.04] hover:border-black/[0.10] hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="font-mts-wide text-[13px] tracking-[0.10em] uppercase text-black/40 mb-2">
                    {l.country}
                  </div>
                  <div className="font-mts-wide text-[26px] sm:text-[32px] font-bold leading-tight tracking-tight">
                    {l.city}
                  </div>
                </div>
                <div className="text-[36px] leading-none">{l.flag}</div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-5 border-t border-black/[0.06]">
                <MetricCell label="Серверов"   value={String(l.servers)} />
                <MetricCell label="Магистраль" value={l.bandwidth} />
                <MetricCell label="Задержка"   value={l.latency} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mts-wide text-[11px] tracking-[0.08em] uppercase text-black/40 mb-1">
        {label}
      </div>
      <div className="font-mts-wide text-[13px] sm:text-[14px] font-semibold text-black/85 leading-tight">
        {value}
      </div>
    </div>
  );
}
