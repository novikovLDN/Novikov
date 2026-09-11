"use client";

import { useEffect, useRef } from "react";
import { LOCATIONS, CLOSEST } from "@/lib/locations";
import { WORLD_ROWS, CELL_DEG, LAT_TOP, LON_LEFT } from "@/lib/world-map";

/**
 * 3D-фон первого экрана — рельефный макет времени отклика.
 *
 * Запрос владельца 11.09.2026: «блок 1 за текстом фон другой нужен,
 * какой-нибудь интересный, создать через 3D». Не глобус (глобус с
 * дугами — клише инфраструктуры, A8 §1.3), а архитектурный макет из
 * террас: вокруг каждого сервера поднимаются ступени, одна на 2 мс
 * времени ответа по расстоянию (свет в волокне ~200 км/мс, туда и
 * обратно). Чем ближе к серверу, тем выше. Верх террас — бумага,
 * подступенки — кобальт: та же палитра «Лоция», что у карты на
 * странице, только объёмом.
 *
 * СТОИМОСТЬ И ОТКАТ.
 *   · three подгружается отдельным куском в свободное время после
 *     отрисовки — LCP не трогает (элемент LCP — текст заголовка).
 *   · Рисует кадры, только пока первый экран в кадре и вкладка видна.
 *   · Нет WebGL, мало ядер или памяти, режим экономии трафика — сцены
 *     нет, остаётся плоское поле изохрон (HeroField).
 *   · reduced-motion и ?static=1 — один неподвижный кадр.
 * WebGL, а не WebGPU: у русской аудитории WebGPU есть у 35–61%
 * (docs/rebrand-2027/STACK_DECISION.md §11), а выгоды здесь нет.
 */

const DEG = Math.PI / 180;
const EARTH_KM = 6371;
/** Ступень рельефа: 2 мс ответа ≈ 200 км по поверхности. */
const STEP_KM = 200;
const LEVELS = 10;
const STEP_H = 0.085;

const LON_SPAN = 100;
const LAT_SPAN = 42;
const LON0 = CLOSEST.lon - 40;
const LAT_TOP_R = CLOSEST.lat + 18;

function kmBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = (lat2 - lat1) * DEG;
  const dLon = (lon2 - lon1) * DEG;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

function isLand(lat: number, lon: number) {
  const col = Math.round((lon - LON_LEFT) / CELL_DEG);
  const row = Math.round((LAT_TOP - lat) / CELL_DEG);
  return WORLD_ROWS[row]?.[col] === "#";
}

/**
 * Ступенька со сглаженным краем: пол ступени ровный, подъём занимает
 * последние 32 % её ширины (~64 км, 3–4 клетки сетки). Резкий floor()
 * давал зубчатую лесенку по клеткам, а подъём в 14 % — «пилу» на
 * отдельных треугольниках (кадры 11.09.2026).
 */
function sample(lat: number, lon: number) {
  let d = Infinity;
  for (const l of LOCATIONS) d = Math.min(d, kmBetween(lat, lon, l.lat, l.lon));
  const t = d / STEP_KM;
  const f = t - Math.floor(t);
  const e = Math.min(1, Math.max(0, (f - 0.68) / 0.32));
  const terrace = Math.max(0, LEVELS - (Math.floor(t) + e * e * (3 - 2 * e))) * STEP_H;
  const land = isLand(lat, lon) ? 0.018 : 0;
  // Где вершина стоит на подъёме ступени: 0 на площадке, 1 посередине
  // склона. Кобальт красится по этому значению, а не по наклону
  // треугольника: контур пересекает сетку наискосок, и по наклону
  // соседние треугольники давали «пилу» (кадры 11.09.2026). Значение
  // интерполируется между вершинами — полоса ложится ровно.
  const edge = terrace > land && t < LEVELS ? Math.sin(Math.PI * e) : 0;
  return { h: Math.max(terrace, land), edge };
}

function heightAt(lat: number, lon: number) {
  return sample(lat, lon).h;
}

const VERT = /* glsl */ `
  attribute float aEdge;
  varying vec3 vN;
  varying float vEdge;
  varying float vH;
  varying float vDepth;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vEdge = aEdge;
    vH = position.y;
    vec4 mv = viewMatrix * wp;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uPaper;
  uniform vec3 uGrey;
  uniform vec3 uCobalt;
  uniform vec3 uLight;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vN;
  varying float vEdge;
  varying float vH;
  varying float vDepth;
  void main() {
    // Сглаженные нормали вершин: свет без граней треугольников.
    vec3 n = normalize(vN);
    float lit = clamp(dot(n, normalize(uLight)) * 0.5 + 0.5, 0.0, 1.0);
    vec3 top = mix(uGrey, uPaper, 0.55 + 0.45 * lit);
    // Суша без террас — чуть серее воды.
    if (vH > 0.004 && vH < 0.03) top = mix(top, uGrey, 0.55);
    // Кобальт по подъёму ступени из данных (aEdge), а не по наклону.
    float riser = smoothstep(0.08, 0.75, vEdge);
    vec3 col = mix(top, uCobalt, riser * 0.72);
    float fog = smoothstep(uFogNear, uFogFar, vDepth);
    col = mix(col, uPaper, fog);
    gl_FragColor = linearToOutputTexel(vec4(col, 1.0));
  }
`;

export default function HeroRelief() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const root = document.documentElement;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const weak =
      (nav.hardwareConcurrency ?? 8) < 4 || (nav.deviceMemory ?? 8) < 4 || nav.connection?.saveData === true;
    if (weak) return;

    const still = root.hasAttribute("data-static") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // WebGL недоступен — остаётся плоское поле
      }
      renderer.setClearColor(0xffffff, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

      // ── Рельеф ──────────────────────────────────────────────────
      const narrow = window.innerWidth < 720;
      // Плотнее сетка — ровнее край ступеней: 96 тыс. вершин на
      // десктопе, 29 тыс. на телефоне; высоты считаются один раз.
      const nx = narrow ? 220 : 400;
      const nz = narrow ? 130 : 240;
      const s = 0.2;
      const cosC = Math.cos(CLOSEST.lat * DEG);
      const W = LON_SPAN * cosC * s;
      const D = LAT_SPAN * s;
      const geo = new THREE.PlaneGeometry(W, D, nx, nz);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position as import("three").BufferAttribute;
      const edges = new Float32Array(pos.count);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const lon = LON0 + ((x + W / 2) / W) * LON_SPAN;
        const lat = LAT_TOP_R - ((z + D / 2) / D) * LAT_SPAN;
        const smp = sample(lat, lon);
        pos.setY(i, smp.h);
        edges[i] = smp.edge;
      }
      pos.needsUpdate = true;
      geo.setAttribute("aEdge", new THREE.BufferAttribute(edges, 1));
      geo.computeVertexNormals();

      const srgb = (hex: string) => new THREE.Color(hex);
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uPaper: { value: srgb("#FFFFFF") },
          uGrey: { value: srgb("#D5DAE2") },
          uCobalt: { value: srgb("#1432B8") },
          uLight: { value: new THREE.Vector3(-0.5, 1.0, 0.35) },
          uFogNear: { value: 7 },
          uFogFar: { value: 13.5 },
        },
      });
      scene.add(new THREE.Mesh(geo, mat));

      // ── Штыри серверов на вершинах ──────────────────────────────
      const toXZ = (lat: number, lon: number) => ({
        x: ((lon - LON0) / LON_SPAN) * W - W / 2,
        z: ((LAT_TOP_R - lat) / LAT_SPAN) * D - D / 2,
      });
      const inView = LOCATIONS.filter(
        (l) => l.lon > LON0 && l.lon < LON0 + LON_SPAN && l.lat < LAT_TOP_R && l.lat > LAT_TOP_R - LAT_SPAN,
      );
      const pinGeo = new THREE.BoxGeometry(0.04, 0.22, 0.04);
      pinGeo.translate(0, 0.11, 0);
      const pinMat = new THREE.MeshBasicMaterial({ color: srgb("#1432B8") });
      const pins = new THREE.InstancedMesh(pinGeo, pinMat, inView.length);
      const m = new THREE.Matrix4();
      let nearIdx = -1;
      inView.forEach((l, i) => {
        const p = toXZ(l.lat, l.lon);
        m.makeTranslation(p.x, heightAt(l.lat, l.lon), p.z);
        pins.setMatrixAt(i, m);
        if (l.code === CLOSEST.code) nearIdx = i;
      });
      scene.add(pins);
      const nearPos = toXZ(CLOSEST.lat, CLOSEST.lon);
      const nearH = heightAt(CLOSEST.lat, CLOSEST.lon);

      // ── Камера: вид с юго-запада на ближайший сервер ────────────
      const target = new THREE.Vector3(nearPos.x + 1.1, 0.25, nearPos.z + 0.6);
      // Выше и дальше: вид на макет почти сверху, как на стол в бюро,
      // а не в упор — при 0,5 рад и 7,4 рельеф забивал весь кадр.
      const baseAz = -0.62;
      const baseEl = 0.78;
      const radius = narrow ? 11 : 8.8;

      let px = 0, py = 0, tx = 0, ty = 0;
      const onMove = (e: PointerEvent) => {
        tx = (e.clientX / window.innerWidth) * 2 - 1;
        ty = (e.clientY / window.innerHeight) * 2 - 1;
      };

      const resize = () => {
        const w = Math.max(1, host.clientWidth);
        const h = Math.max(1, host.clientHeight);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      const draw = (time: number) => {
        px += (tx - px) * 0.04;
        py += (ty - py) * 0.04;
        const hostH = host.offsetHeight || 1;
        const p = Math.min(1, Math.max(0, window.scrollY / hostH));
        const az = baseAz + Math.sin(time * 0.07) * 0.2 + px * 0.14;
        const el = baseEl - p * 0.28 + py * 0.05;
        const r = radius * (1 - p * 0.42);
        camera.position.set(
          target.x + r * Math.sin(az) * Math.cos(el),
          target.y + r * Math.sin(el),
          target.z + r * Math.cos(az) * Math.cos(el),
        );
        camera.lookAt(target);
        if (nearIdx >= 0) {
          const k = 1 + 0.35 * Math.max(0, Math.sin(time * 2.2));
          m.makeScale(1, k, 1).setPosition(nearPos.x, nearH, nearPos.z);
          pins.setMatrixAt(nearIdx, m);
          pins.instanceMatrix.needsUpdate = true;
        }
        renderer.render(scene, camera);
      };

      let raf = 0;
      let visible = true;
      const loop = (t: number) => {
        raf = 0;
        draw(t * 0.001);
        if (!still && visible && !document.hidden) raf = requestAnimationFrame(loop);
      };
      const kick = () => {
        if (!raf && !still && visible && !document.hidden) raf = requestAnimationFrame(loop);
      };

      const ro = new ResizeObserver(() => {
        resize();
        if (still) draw(0);
      });
      ro.observe(host);
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        kick();
      });
      io.observe(host);
      const onVis = () => kick();
      document.addEventListener("visibilitychange", onVis);
      if (!still) window.addEventListener("pointermove", onMove, { passive: true });

      resize();
      draw(0);
      host.setAttribute("data-ready", "");
      kick();

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("pointermove", onMove);
        geo.dispose();
        mat.dispose();
        pinGeo.dispose();
        pinMat.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    // После отрисовки и в свободное время: сцена не спорит с первым кадром.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const idle = w.requestIdleCallback
      ? w.requestIdleCallback(() => void start(), { timeout: 1500 })
      : window.setTimeout(() => void start(), 600);

    return () => {
      disposed = true;
      const wc = window as Window & { cancelIdleCallback?: (id: number) => void };
      if (wc.cancelIdleCallback) wc.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
      cleanup();
    };
  }, []);

  return <div ref={ref} className="a-relief" aria-hidden />;
}
