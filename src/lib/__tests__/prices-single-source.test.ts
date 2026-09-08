/**
 * Цена живёт в одном месте — проверка машиной, а не договорённостью.
 *
 * ЧТО ЭТОТ ТЕСТ ЛОВИТ. В проекте есть правило: суммы объявлены в
 * `plans.ts` и `servers.ts`, а страницы и обработчик оплаты берут их
 * оттуда. Правило записано в CLAUDE.md, но до сих пор ничем не
 * держалось — и уже нарушалось: цены выделенных серверов были
 * записаны прямо в разметке `/vds` в четырёх местах.
 *
 * Худший из возможных багов на платящем экране — когда витрина
 * показывает одну сумму, а касса берёт другую. Он появляется не
 * сразу: сначала кто-то дублирует число «чтобы не тянуть импорт»,
 * потом меняется одно из двух. Тест ловит первый шаг, а не второй.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PLANS, PERIODS, pricePerMonth, discountPercent, savings, isPlanId, isPeriod } from "@/lib/plans";
import { SERVERS, SERVER_ENTRY_USD } from "@/lib/servers";

const ROOT = path.resolve(__dirname, "../../..");

/** Файлы разметки, где сумма может появиться руками. */
function markupFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === "__tests__") continue;
        walk(p);
      } else if (/\.tsx$/.test(e.name)) {
        out.push(p);
      }
    }
  };
  walk(path.join(ROOT, "src"));
  return out;
}

describe("цена объявлена один раз", () => {
  it("рублёвых сумм тарифов нет в разметке", () => {
    // Все суммы всех тарифов и периодов, какие только есть.
    const amounts = new Set<number>();
    for (const plan of Object.values(PLANS)) {
      for (const total of Object.values(plan)) {
        amounts.add(total);
        }
    }
    for (const id of ["basic", "plus"] as const) {
      for (const p of PERIODS) amounts.add(pricePerMonth(id, p));
    }

    const offenders: string[] = [];
    for (const file of markupFiles()) {
      const src = fs.readFileSync(file, "utf8");
      // Комментарии выкидываем: в них суммы упоминаются как история.
      const code = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      for (const n of amounts) {
        // Число рядом со знаком рубля — то есть выведенное на экран.
        const re = new RegExp(`\\b${n}\\b\\s*(?:₽|руб)`, "u");
        if (re.test(code)) offenders.push(`${path.relative(ROOT, file)}: ${n} ₽`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("долларовых сумм серверов нет в разметке", () => {
    const amounts = SERVERS.map((s) => s.usd);
    const offenders: string[] = [];
    for (const file of markupFiles()) {
      const code = fs
        .readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      for (const n of amounts) {
        // И «$300», и «300$». Знак доллара, за которым идёт «{», —
        // это начало подстановки в шаблонной строке (`duration-300 ${…}`),
        // а не цена: такие вхождения пропускаем.
        if (new RegExp(`\\$\\s*${n}\\b|\\b${n}\\s*\\$(?!\\{)`).test(code)) {
          offenders.push(`${path.relative(ROOT, file)}: $${n}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("производные величины согласованы", () => {
  it("цена за месяц, умноженная на срок, не расходится с суммой периода", () => {
    for (const id of ["basic", "plus"] as const) {
      for (const p of PERIODS) {
        const drift = Math.abs(pricePerMonth(id, p) * p - PLANS[id][p]);
        // Округление до рубля даёт расхождение не больше половины
        // периода: 12 месяцев — максимум 6 ₽.
        expect(drift).toBeLessThanOrEqual(p / 2);
      }
    }
  });

  it("экономия и скидка считаются от помесячной оплаты", () => {
    for (const id of ["basic", "plus"] as const) {
      for (const p of PERIODS) {
        expect(savings(id, p)).toBe(PLANS[id][1] * p - PLANS[id][p]);
        if (p === 1) expect(discountPercent(id, p)).toBe(0);
        else expect(discountPercent(id, p)).toBeGreaterThan(0);
      }
    }
  });
});

describe("обработчик оплаты нельзя увести в NaN", () => {
  it("чужие значения тарифа и срока отсекаются", () => {
    for (const bad of ["BASIC", "pro", "", null, undefined, 0, {}]) {
      expect(isPlanId(bad)).toBe(false);
    }
    for (const bad of ["12", 2, 0, -1, 13, null, undefined]) {
      expect(isPeriod(bad)).toBe(false);
    }
    expect(isPlanId("basic")).toBe(true);
    expect(isPeriod(12)).toBe(true);
  });
});

describe("линейка серверов", () => {
  it("растёт по полосе, а не по цене вслепую", () => {
    // Дороже — значит не уже по каналу. Ступень, которая стоит
    // больше и даёт меньше, — ошибка в линейке.
    const byPrice = [...SERVERS].sort((a, b) => a.usd - b.usd);
    for (let i = 1; i < byPrice.length; i++) {
      expect(byPrice[i].portGbps).toBeGreaterThanOrEqual(byPrice[i - 1].portGbps);
    }
  });

  it("нижняя граница линейки совпадает с самой дешёвой ступенью", () => {
    expect(SERVER_ENTRY_USD).toBe(Math.min(...SERVERS.map((s) => s.usd)));
  });

  it("у каждой ступени названы неподтверждённые параметры", () => {
    // «Названная граница» — позиция бренда. Ступень без единого
    // уточнения означала бы, что мы всё гарантируем.
    for (const s of SERVERS) expect(s.confirm.length).toBeGreaterThan(0);
  });
});
