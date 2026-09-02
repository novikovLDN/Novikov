"use client";

import { COUNTRY_COUNT } from "@/lib/locations";
import { DEVICE_LIMIT, PLAN_SPEED } from "@/lib/plans";
import { useMarqueeFlow } from "./effects";

/**
 * Кинетический шов между секциями.
 *
 * Приём редакционных и агентских сайтов 2026 года: вместо отбивки
 * пустотой — гигантская строка, которая едет поперёк экрана и
 * реагирует на прокрутку. Здесь она несёт факты, а не слова ради
 * движения: скорость канала, число стран, лимит устройств, срок
 * бесплатного доступа — всё из кода, ни одной цифры руками.
 *
 * Строка декоративна для скринридера: те же числа он уже получил в
 * секциях выше и ниже, и повторять их бегущей лентой незачем.
 *
 * Ход ленты и прокрутка складываются в одну позицию (useMarqueeFlow):
 * пока страница едет, строка идёт вместе с ней; страница встала —
 * строка продолжает свой шаг.
 */
const TRIAL_DAYS = 3;

export default function KineticSeam() {
  // Ход и прокрутка складываются в одну позицию: строка едет сама и
  // ускоряется вместе со страницей, вместо того чтобы спорить с
  // собственной CSS-анимацией.
  const trackRef = useMarqueeFlow<HTMLDivElement>(58, 3.2);

  const items = [
    `${PLAN_SPEED.plus} Гбит/с`,
    `${COUNTRY_COUNT} стран`,
    `${DEVICE_LIMIT} устройств`,
    `${TRIAL_DAYS} дня бесплатно`,
    "99,98 %",
  ];

  // Состав дублируется: петля замыкается по половине дорожки.
  const track = [...items, ...items];

  return (
    <div className="px-seam" aria-hidden>
      <div ref={trackRef} className="px-seam-track">
        {track.map((t, i) => (
          <span key={i} className="px-seam-item">
            {t}
            <i className="px-seam-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
