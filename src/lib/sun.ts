/**
 * Положение солнца — для света на карте.
 *
 * Отмывка суши на листе карты освещена так же, как мир за окном
 * читателя: утром тень ложится на запад, вечером на восток, ночью света
 * нет. Это реакция на время суток со смыслом, а не дрейф ради дрейфа
 * (docs/rebrand-2027/SCREEN_SCORE.md §0.8).
 *
 * БЕЗ ГЕОЛОКАЦИИ. Долгота берётся из часового пояса устройства
 * (15° на час), широта — Москвы, и на странице это подписано
 * «по умолчанию». Точность — в пределах часового пояса; для
 * направления света на карте масштаба мира этого достаточно.
 *
 * Формула упрощённая (склонение по косинусу, без уравнения времени):
 * ошибка азимута — единицы градусов.
 */

const DEG = Math.PI / 180;

export interface Sun {
  /** Азимут от севера по часовой стрелке, градусы. */
  azimuth: number;
  /** Высота над горизонтом, градусы; отрицательная — ночь. */
  elevation: number;
}

/** Широта по умолчанию — Москва. Подписана на странице. */
export const DEFAULT_LAT = 55.75;

export function lonFromTimezone(date: Date): number {
  return -date.getTimezoneOffset() / 4;
}

export function sunPosition(date: Date, lat: number, lon: number): Sun {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = (date.getTime() - start) / 86_400_000;
  const decl = -23.44 * Math.cos(DEG * (360 / 365) * (day + 10));

  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const hourAngle = 15 * (utcHours + lon / 15 - 12);

  const phi = lat * DEG;
  const delta = decl * DEG;
  const h = hourAngle * DEG;

  const elevation = Math.asin(Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h));
  // Азимут от юга с положительным направлением на запад → от севера по часовой.
  const fromSouth = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(delta) * Math.cos(phi));

  return {
    azimuth: (fromSouth / DEG + 180 + 360) % 360,
    elevation: elevation / DEG,
  };
}

/** Полдень: свет с юга. Так карта отрисована на сервере и без скрипта. */
export const NOON: Sun = { azimuth: 180, elevation: 45 };
