"use client";

/**
 * "Три причины" — light section, three feature cards.
 *
 * Reference (provod.ai screen 3) has multiple light cards on a warm
 * off-white bg with sample previews. We keep the aesthetic (light bg,
 * generous white space, small icon in a rounded chip, big title,
 * muted body copy) and swap the content for our value proposition:
 * VPS instance / accelerator / privacy.
 */
export default function ThreePillarsSection() {
  const pillars = [
    {
      chip: "01",
      title: "Свой VPS за минуту",
      body: "Выделенный виртуальный сервер с гарантированным ресурсом. Полный root-доступ, любой стек — Docker, Node, Python, Nginx.",
      metric: "от 199 ₽/мес",
    },
    {
      chip: "02",
      title: "Ускоритель интернета",
      body: "Маршрут через магистраль до 200 Гбит/с. Стабильный пинг в игры и стримы, работа с зарубежными сервисами без просадок.",
      metric: "< 5 мс регион",
    },
    {
      chip: "03",
      title: "Приватность и стабильность",
      body: "Никаких логов трафика. Шифрование на транспорте. 99.98% аптайма — SLA прописан в договоре, а не в подписи под кнопкой.",
      metric: "SLA 99.98%",
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
