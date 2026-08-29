"use client";

/**
 * "Наши локации" — real countries, no emoji flags.
 *
 * Placeholder list of 4 (DE / NL / AT / US) mirrors the current
 * fleet at the time of writing. Numbers (servers / bandwidth /
 * latency) are conservative estimates and should be replaced with
 * live values once the operations team confirms the definitive list.
 *
 * Emoji flags removed on purpose:
 *   - they render inconsistently across OS/browser,
 *   - they read as decoration on a corporate light shell,
 *   - a two-letter monogram + full country name is unambiguous and
 *     stays legible on any device.
 */
export default function ServerLocationsSection() {
  const locations: Array<{
    code: string;
    country: string;
    city: string;
    servers: number;
    bandwidth: string;
    latency: string;
  }> = [
    { code: "DE", country: "Германия",   city: "Frankfurt", servers: 12, bandwidth: "200 Гбит/с", latency: "24 мс из Москвы" },
    { code: "NL", country: "Нидерланды", city: "Amsterdam", servers: 8,  bandwidth: "100 Гбит/с", latency: "32 мс из Москвы" },
    { code: "AT", country: "Австрия",    city: "Vienna",    servers: 6,  bandwidth: "100 Гбит/с", latency: "38 мс из Москвы" },
    { code: "US", country: "США",        city: "New York",  servers: 4,  bandwidth: "100 Гбит/с", latency: "120 мс из Москвы" },
  ];

  return (
    <section className="bg-[#f5f5f0] text-[#111] px-5 sm:px-8 py-20 sm:py-28 lg:py-32">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-12 sm:mb-16">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">
            Наши локации
          </div>
          <h2 className="font-mts-wide text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
            Серверы в 4 странах —<br />и другие по запросу
          </h2>
          <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-black/55 mt-6 max-w-[52ch]">
            Партнёрские дата-центры уровня Tier-3 и Tier-4. Клиент автоматически выбирает ближайший маршрут — локацию можно закрепить вручную.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {locations.map((l) => (
            <div
              key={l.city}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.04] hover:border-black/[0.12] hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-black/40 mb-2">
                    {l.country}
                  </div>
                  <div className="font-mts-wide text-[26px] sm:text-[32px] font-bold leading-tight tracking-tight truncate">
                    {l.city}
                  </div>
                </div>
                <div
                  aria-hidden
                  className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black text-white flex items-center justify-center font-mts-wide font-bold text-[14px] sm:text-[16px] tracking-[0.06em]"
                >
                  {l.code}
                </div>
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
      <div className="font-mts-wide text-[10px] sm:text-[11px] tracking-[0.08em] uppercase text-black/40 mb-1">
        {label}
      </div>
      <div className="font-mts-wide text-[12px] sm:text-[14px] font-semibold text-black/85 leading-tight">
        {value}
      </div>
    </div>
  );
}
