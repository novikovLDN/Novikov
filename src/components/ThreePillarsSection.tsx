"use client";

/**
 * "Три причины" — light section, three feature cards.
 *
 * Reference (provod.ai screen 3) uses warm off-white cards on light bg.
 * Content focuses on the three concrete accelerator value props:
 * low latency, stable uptime, one-minute setup.
 */
export default function ThreePillarsSection() {
  const pillars = [
    {
      chip: "01",
      title: "Меньше задержек",
      body: "Магистральная маршрутизация до 200 Гбит/с. Пинг в регионе меньше 5 мс — без микрофризов в играх и созвонах.",
      metric: "< 5 мс регион",
    },
    {
      chip: "02",
      title: "Никаких просадок",
      body: "Соединение стабильно 24/7. SLA 99,98% прописан в договоре, а не подмигивает мелким шрифтом под кнопкой.",
      metric: "SLA 99,98%",
    },
    {
      chip: "03",
      title: "Настройка за минуту",
      body: "Скачал приложение, вошёл — готово. Дальше работает автоматически на всех устройствах: iPhone, Android, Mac, Windows, Linux, роутер.",
      metric: "6 платформ",
    },
  ];

  return (
    <section className="bg-[#f5f5f0] text-[#111] px-5 sm:px-8 py-20 sm:py-28 lg:py-32">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-14 sm:mb-20 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">
            Три причины
          </div>
          <h2 className="font-mts-wide text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02] tracking-tight font-bold">
            Что вы получаете<br />за подписку
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {pillars.map((p) => (
            <div
              key={p.chip}
              className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[280px] sm:min-h-[340px] border border-black/[0.04] hover:border-black/[0.10] hover:-translate-y-0.5 transition-all"
            >
              <div>
                <div className="font-mts-wide text-[12px] font-medium tracking-[0.12em] text-black/40 mb-6">
                  {p.chip}
                </div>
                <h3 className="font-mts-wide text-[22px] sm:text-[26px] leading-[1.15] font-bold tracking-tight mb-3">
                  {p.title}
                </h3>
                <p className="font-mts-wide text-[14px] sm:text-[15px] leading-[1.55] text-black/60">
                  {p.body}
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-black/[0.08]">
                <span className="font-mts-wide text-[13px] font-medium text-black/75">
                  {p.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
