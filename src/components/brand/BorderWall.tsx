"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./motion";

/**
 * СТЕНА — главный объект бренда.
 *
 * Экран закрыт стеной из пикселей. Курсор стирает её: там, где прошёл
 * указатель, ячейки гаснут, а по краю стёртого идёт кислотная кромка —
 * след маркера. Прокрутка растворяет стену целиком: к концу первого
 * экрана её больше нет, и читатель оказывается по ту сторону.
 *
 * Это не фон и не украшение. Это буквальное изображение того, за что
 * человек платит, — и единственная причина, по которой на первом
 * экране вообще есть сцена.
 *
 * ПОЧЕМУ СЫРОЙ WebGL, А НЕ three.js.
 * Сцена — один полноэкранный треугольник с фрагментным шейдером.
 * three.js добавил бы к странице около 150 КБ ради сетки, камеры и
 * графа сцены, ни одно из которых здесь не используется. Разборы
 * наградных сайтов 2026 года сходятся в одном: проблема не в идеях,
 * а в дисциплине держать зрелище быстрым (TRENDS.md §8).
 *
 * ДЕГРАДАЦИЯ.
 * Нет WebGL, нет указателя, включён prefers-reduced-motion — сцена не
 * поднимается, и остаётся CSS-фон. Содержание первого экрана от этого
 * не теряется ни на слово: стена — иллюстрация тезиса, а не сам тезис.
 */
const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;

uniform vec2  uRes;      // размер холста в физических пикселях
uniform vec2  uMouse;    // курсор там же
uniform float uTime;     // секунды
uniform float uDissolve; // 0 — стена целая, 1 — стены нет
uniform float uRadius;   // радиус стирания
uniform vec3  uWall;     // цвет ячейки
uniform vec3  uAcid;     // цвет кромки
uniform float uCell;     // сторона ячейки

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 frag   = gl_FragCoord.xy;
  vec2 cellId = floor(frag / uCell);
  vec2 cellUv = fract(frag / uCell);

  // Порог ячейки: чем он ниже, тем раньше ячейка выпадет из стены.
  float h = hash(cellId);

  // Стирание курсором. Радиус мягкий по краю, иначе след выглядит
  // вырезанным ножницами, а не стёртым.
  vec2  center = (cellId + 0.5) * uCell;
  float erase  = 1.0 - smoothstep(0.0, uRadius, distance(center, uMouse));

  // Стена гуще снизу: сверху стоит заголовок, и текст не должен
  // соревноваться с фоном за внимание.
  float depth = smoothstep(0.05, 0.95, frag.y / uRes.y);
  float k = uDissolve + erase * 1.15 - depth * 0.28;

  float alive = step(k, h);
  // Ячейки, которые только что погасли, светятся кислотой — это и
  // читается как след, а не как дырка. Полоса узкая намеренно: при
  // широкой на растворении весь экран превращался в кислотное
  // конфетти, а правило системы — один яркий цвет в кадре, а не один
  // цвет во весь кадр.
  float rim = (1.0 - alive) * smoothstep(k - 0.07, k, h);

  // Квадрат внутри ячейки: между пикселями остаётся воздух.
  vec2  q  = abs(cellUv - 0.5);
  float sq = 1.0 - step(0.34, max(q.x, q.y));

  // Медленное дыхание, чтобы стена не выглядела картинкой.
  float breath = 0.82 + 0.18 * sin(uTime * 0.9 + h * 24.0);

  vec3  color = uWall * alive * breath + uAcid * rim * 0.9;
  float alpha = (alive * 0.92 + rim) * sq;

  gl_FragColor = vec4(color, alpha);
}
`;

/** #RRGGBB или rgb(...) → [0..1, 0..1, 0..1]. Цвета берутся из
 *  токенов, а не пишутся в шейдере: смена бренд-цвета должна
 *  оставаться правкой одного блока в brand.css. */
function readColor(styles: CSSStyleDeclaration, name: string, fallback: [number, number, number]) {
  const raw = styles.getPropertyValue(name).trim();
  const hex = raw.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as [number, number, number];
  }
  const rgb = raw.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgb) return [+rgb[1] / 255, +rgb[2] / 255, +rgb[3] / 255] as [number, number, number];
  return fallback;
}

export default function BorderWall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return; // нет WebGL — остаётся CSS-фон, и это нормально

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Один треугольник с запасом вместо двух: на пиксель меньше работы
    // и на один вызов отрисовки меньше.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const u = {
      res: gl.getUniformLocation(prog, "uRes"),
      mouse: gl.getUniformLocation(prog, "uMouse"),
      time: gl.getUniformLocation(prog, "uTime"),
      dissolve: gl.getUniformLocation(prog, "uDissolve"),
      radius: gl.getUniformLocation(prog, "uRadius"),
      wall: gl.getUniformLocation(prog, "uWall"),
      acid: gl.getUniformLocation(prog, "uAcid"),
      cell: gl.getUniformLocation(prog, "uCell"),
    };

    const styles = getComputedStyle(document.documentElement);
    gl.uniform3fv(u.wall, readColor(styles, "--ink-3", [0.12, 0.12, 0.13]));
    gl.uniform3fv(u.acid, readColor(styles, "--acid", [0.84, 1, 0.25]));

    // Плотность пикселей ограничена: на ретине честный DPR утраивает
    // работу шейдера, а стена состоит из квадратов — разницы не видно.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let cell = 0;

    const resize = () => {
      const r = host.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      // Ячейка крупнее на телефоне: тот же рисунок на меньшем экране
      // при мелкой ячейке превращается в шум.
      cell = (r.width < 760 ? 13 : 17) * dpr;
      gl.uniform1f(u.cell, cell);
      gl.uniform1f(u.radius, (r.width < 760 ? 110 : 190) * dpr);
    };

    // Курсор уводится далеко за пределы кадра, пока его не было:
    // иначе стена стартует с дыркой в углу.
    let mx = -9999;
    let my = -9999;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      mx = (e.clientX - r.left) * dpr;
      my = (r.height - (e.clientY - r.top)) * dpr; // ось Y в GL снизу вверх
    };
    const onLeave = () => { mx = -9999; my = -9999; };

    let raf = 0;
    let visible = true;
    const start = performance.now();

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const r = host.getBoundingClientRect();
      // Растворение считается от того, сколько сцены уже ушло вверх.
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      gl.uniform1f(u.time, (performance.now() - start) / 1000);
      gl.uniform1f(u.dissolve, p * 1.25);
      gl.uniform2f(u.mouse, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // Вне кадра сцена не считается вовсе.
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(host);

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [reduced]);

  return (
    <div ref={hostRef} className="b-wall" aria-hidden>
      <canvas ref={canvasRef} className="b-wall-canvas" />
    </div>
  );
}
