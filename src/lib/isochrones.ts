/**
 * Изохроны времени ответа и объём суши — геометрия листа карты.
 *
 * ЧТО ИЗОБРАЖАЮТ СТУПЕНИ. Нижнюю границу времени ответа по расстоянию
 * до ближайшего сервера. Свет в оптоволокне проходит около 200 км за
 * миллисекунду, время ответа — путь туда и обратно: 10 мс ≈ 1000 км по
 * поверхности. Реальное время всегда больше (маршрут не по прямой,
 * оборудование на пути), и на странице это написано. Ступени — не
 * замер и не обещание, а физика, которую нельзя обойти.
 *
 * ОБЪЁМ СУШИ. Высот у нас нет — только маска суши 3° × 3°
 * (`world-map.ts`). «Высота» здесь — расстояние до берега в ячейках:
 * это не рельеф, а объём материка, и называется он объёмом, а не
 * рельефом. Отмывка берёт от него наклон и свет солнца (`sun.ts`).
 *
 * Всё считается на сервере и в браузере одним кодом: без скрипта
 * страница получает ту же карту, освещённую полуднем.
 */

import { LOCATIONS } from "./locations";
import { WORLD_ROWS, COLS, ROWS, CELL, project } from "./world-map";
import type { Sun } from "./sun";

export const FIBER_KM_PER_MS = 200;
export const BAND_STEP_MS = 10;
export const BAND_COUNT = 5;

const EARTH_KM = 6371;
const DEG = Math.PI / 180;

/** Время ответа (туда и обратно) → расстояние в одну сторону. */
export function rttToKm(ms: number): number {
  return (ms * FIBER_KM_PER_MS) / 2;
}

/**
 * Окружность на сфере, спроецированная на карту.
 *
 * Долгота не нормализуется: у Токио и Лос-Анджелеса кольцо уходит за
 * край и обрезается рамкой, а не перескакивает на другую сторону карты
 * сквозь весь лист. Координаты целые: единица карты — 0,43°, точнее
 * глаз на этом масштабе не различит, а разметка короче втрое.
 */
function ring(lat: number, lon: number, km: number, steps = 40): string {
  const d = km / EARTH_KM;
  const p1 = lat * DEG;
  const l1 = lon * DEG;
  let s = "";
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(t));
    const l2 = l1 + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
    const { x, y } = project(p2 / DEG, l2 / DEG);
    s += `${i ? "L" : "M"}${Math.round(x)} ${Math.round(y)}`;
  }
  return `${s}Z`;
}

/**
 * Ступень `level` (1…BAND_COUNT): объединение колец всех серверов.
 * Кольца обходятся в одном направлении, поэтому при `fill-rule:
 * nonzero` пересечения закрашиваются одним цветом — союз без
 * вычисления пересечений.
 */
export function bandPath(level: number): string {
  const km = rttToKm(level * BAND_STEP_MS);
  return LOCATIONS.map((l) => ring(l.lat, l.lon, km)).join("");
}

const isLand = (c: number, r: number) =>
  r >= 0 && r < ROWS && c >= 0 && c < COLS && WORLD_ROWS[r][c] === "#";

const MAX_DEPTH = 6;

/** Расстояние до берега в ячейках (4-связность), срезано на MAX_DEPTH. */
const DEPTH: number[][] = (() => {
  const depth = Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
  const queue: Array<[number, number]> = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isLand(c, r)) continue;
      const coast = !isLand(c + 1, r) || !isLand(c - 1, r) || !isLand(c, r + 1) || !isLand(c, r - 1);
      if (coast) {
        depth[r][c] = 1;
        queue.push([c, r]);
      }
    }
  }
  for (let i = 0; i < queue.length; i++) {
    const [c, r] = queue[i];
    const next = depth[r][c] + 1;
    if (next > MAX_DEPTH) continue;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      if (isLand(nc, nr) && depth[nr][nc] === 0) {
        depth[nr][nc] = next;
        queue.push([nc, nr]);
      }
    }
  }
  return depth;
})();

const depthAt = (c: number, r: number) => (isLand(c, r) ? DEPTH[r][c] : 0);

/**
 * Штриховка суши тремя тонами: освещённый склон, ровный, теневой.
 *
 * Штрих — короткая косая черта в ячейке, как гравюрная штриховка на
 * карте. Тон ячейки — скалярное произведение наклона «объёма» и
 * направления на солнце на плоскости листа (север вверху). Ночью
 * света нет, и суша ровная.
 */
export function landHatch(sun: Sun): [string, string, string] {
  const lx = Math.sin(sun.azimuth * DEG);
  const ly = -Math.cos(sun.azimuth * DEG);
  const night = sun.elevation <= 0;
  const out: [string[], string[], string[]] = [[], [], []];
  const half = Math.round(CELL * 0.36);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isLand(c, r)) continue;
      const gx = depthAt(c + 1, r) - depthAt(c - 1, r);
      const gy = depthAt(c, r + 1) - depthAt(c, r - 1);
      // Нормаль склона смотрит вниз по «объёму», то есть против градиента.
      const lit = -(gx * lx + gy * ly);
      const tone = night ? 1 : lit > 0.6 ? 0 : lit < -0.6 ? 2 : 1;
      const x = Math.round((c + 0.5) * CELL);
      const y = Math.round((r + 0.5) * CELL);
      out[tone].push(`M${x - half} ${y + half}l${half * 2}-${half * 2}`);
    }
  }
  return [out[0].join(""), out[1].join(""), out[2].join("")];
}
