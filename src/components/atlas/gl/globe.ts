/**
 * Глобус раздела 03 — «19 стран. выбирайте ближайшую».
 *
 * Белая керамика, мягкие точки суши по маске `world-map.ts`, кобальтовые
 * бусины по всем городам с серверами (`SERVER_POINTS` в `locations.ts`),
 * жемчужная бусина Москвы с тонким кольцом. Сеть (владелец, 11.09.2026:
 * «больше связующих анимированных линий»): магистрали от Москвы ко всем
 * городам — свет по ближним бежит чаще — и тонкие связи каждого сервера
 * с двумя ближайшими соседями.
 *
 * БЮДЖЕТ (уровень 2, оценка): сфера ≈18k треугольников, точки суши ≈18k,
 * бусины ≈17k, дуги ≈35k (~47 трубок по 72×5) — ≈90k при потолке 150k.
 * Материалов у дуг два: фаза и скорость света — атрибуты геометрии.
 */
import * as THREE from "three/webgpu";
import {
  attribute,
  clamp,
  color,
  exp,
  float,
  fract,
  fwidth,
  mix,
  normalView,
  positionViewDirection,
  positionWorld,
  saturate,
  sin,
  smoothstep,
  uniform,
  uv,
} from "three/tsl";
import { CELL_DEG, COLS, LAT_TOP, LON_LEFT, ROWS, WORLD_ROWS } from "@/lib/world-map";
import { SERVER_POINTS } from "@/lib/locations";
import { addLights, geo, tangentMatrix } from "./core";
import type { Builder } from "./stage";

const COBALT = 0x1432b8;
const LAND = 0x8a93a6;
/** Точка отсчёта отклика в `locations.ts`. */
const MOSCOW = { lat: 55.75, lon: 37.62 };
/** Оборот глобуса, с. */
const PERIOD = 84;
/** Цикл света по дуге и волны от Москвы, с. */
const FLOW = 3.6;
/** Долгота, обращённая к зрителю в начале, — Европа чуть левее центра. */
const FRONT_LON = 36;
const DEG = Math.PI / 180;

/**
 * Суша по маске 3°×3° с билинейным сглаживанием: порог 0,5 по
 * интерполяции центров ячеек скругляет ступеньки береговой линии.
 */
function cell(r: number, c: number): number {
  if (r < 0 || r >= ROWS) return 0;
  const cc = ((c % COLS) + COLS) % COLS;
  return WORLD_ROWS[r].charCodeAt(cc) === 35 ? 1 : 0; // '#'
}
function isLand(lat: number, lon: number): boolean {
  const fr = (LAT_TOP - lat) / CELL_DEG;
  const fc = (lon - LON_LEFT) / CELL_DEG;
  const r0 = Math.floor(fr);
  const c0 = Math.floor(fc);
  const ar = fr - r0;
  const ac = fc - c0;
  const v =
    cell(r0, c0) * (1 - ar) * (1 - ac) +
    cell(r0, c0 + 1) * (1 - ar) * ac +
    cell(r0 + 1, c0) * ar * (1 - ac) +
    cell(r0 + 1, c0 + 1) * ar * ac;
  return v >= 0.5;
}

export const buildGlobe: Builder = ({ scene, tier }) => {
  addLights(scene, 2.1);
  scene.environmentIntensity = 0.55;

  const uTime = uniform(0);
  const root = new THREE.Group(); // параллакс
  const tilt = new THREE.Group(); // наклон оси
  const spin = new THREE.Group(); // суточное вращение
  tilt.rotation.set(0.38, 0, -0.12);
  root.add(tilt);
  tilt.add(spin);
  scene.add(root);

  // ── Сфера: белая керамика, сатиновый лак ─────────────────────────
  const seg = tier === 0 ? [72, 48] : [112, 80];
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, seg[0], seg[1]),
    new THREE.MeshPhysicalNodeMaterial({
      color: 0xf6f6f6,
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.65,
      clearcoatRoughness: 0.24,
    })
  );
  spin.add(sphere);

  // Серверы — единичные векторы, нужны и для подсветки суши.
  // Все города с серверами (страны с несколькими городами — несколько точек).
  const servers = SERVER_POINTS.map((l) => geo(l.lat, l.lon, 1));
  const moscow = geo(MOSCOW.lat, MOSCOW.lon, 1);

  // ── Суша: точки по сфере Фибоначчи, отобранные маской ────────────
  // Фибоначчи, а не сетка широт: шаг ровный от экватора до полюса, без
  // сгущения рядов у севера.
  const N = tier === 0 ? 24000 : tier === 1 ? 30000 : 36000;
  const spacing = Math.sqrt((4 * Math.PI) / N);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const dirs: THREE.Vector3[] = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - ((i + 0.5) * 2) / N;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const lat = Math.asin(y) / DEG;
    const lon = Math.atan2(x, z) / DEG;
    if (isLand(lat, lon)) dirs.push(new THREE.Vector3(x, y, z));
  }

  const dotMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  {
    const d = uv().sub(0.5).length();
    const aa = fwidth(d);
    const disc = float(1).sub(smoothstep(float(0.4).sub(aa), float(0.5), d));
    // К краю диска точки растворяются — край сферы остаётся чистым.
    const facing = saturate(normalView.dot(positionViewDirection));
    dotMat.opacityNode = disc.mul(smoothstep(0.04, 0.42, facing));
  }
  const dots = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), dotMat, dirs.length);
  {
    const m = new THREE.Matrix4();
    const base = new THREE.Color(LAND);
    const hot = new THREE.Color(COBALT);
    const c = new THREE.Color();
    const hotCos = Math.cos(4.2 * DEG);
    const size = spacing * 0.55;
    dirs.forEach((n, i) => {
      dots.setMatrixAt(i, tangentMatrix(n, 1.0035, size, m));
      // Суша вокруг сервера чуть окрашена: страна светится сама.
      let k = 0;
      for (const s of servers) {
        const cs = n.dot(s);
        if (cs > hotCos) k = Math.max(k, (cs - hotCos) / (1 - hotCos));
      }
      c.copy(base).lerp(hot, Math.min(0.6, k * 1.4));
      dots.setColorAt(i, c);
    });
  }
  dots.renderOrder = 2;
  spin.add(dots);

  // ── Ореолы под серверами: мягкое кобальтовое пятно на керамике ───
  // На белом аддитивное свечение невидимо (белое + что угодно = белое),
  // поэтому ореол — обычное смешивание с гауссовым спадом.
  const haloMat = new THREE.MeshBasicNodeMaterial({ color: COBALT, transparent: true, depthWrite: false });
  {
    const d = uv().sub(0.5).length().mul(2);
    const facing = saturate(normalView.dot(positionViewDirection));
    // Дыхание по фазе из положения на сфере: соседние ореолы не мигают в такт.
    const breath = sin(uTime.mul(0.7).add(positionWorld.x.mul(9.0))).mul(0.1).add(0.9);
    haloMat.opacityNode = exp(d.mul(d).mul(-4.5))
      .mul(float(1).sub(smoothstep(0.8, 1.0, d)))
      .mul(0.6)
      .mul(breath)
      .mul(smoothstep(0.05, 0.4, facing));
  }
  const halos = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), haloMat, servers.length);
  servers.forEach((n, i) => halos.setMatrixAt(i, tangentMatrix(n, 1.0045, 0.15)));
  halos.renderOrder = 1;
  spin.add(halos);

  // ── Бусины серверов: глянцевый кобальт ───────────────────────────
  const beadGeo = new THREE.SphereGeometry(1, 24, 16);
  const beads = new THREE.InstancedMesh(
    beadGeo,
    new THREE.MeshPhysicalNodeMaterial({
      color: COBALT,
      roughness: 0.2,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    }),
    servers.length
  );
  {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3().setScalar(0.016);
    servers.forEach((n, i) => beads.setMatrixAt(i, m.compose(n.clone().multiplyScalar(1.011), q, s)));
  }
  spin.add(beads);

  // ── Москва: жемчужная бусина, тонкое кольцо, тихая волна ─────────
  const pearl = new THREE.Mesh(
    new THREE.SphereGeometry(0.021, 32, 24),
    new THREE.MeshPhysicalNodeMaterial({
      color: 0xfbfaf7,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      sheen: 1,
      sheenColor: new THREE.Color(0xdfe5ff),
      iridescence: 0.35,
    })
  );
  pearl.position.copy(moscow).multiplyScalar(1.013);
  spin.add(pearl);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.055, 8, 96),
    new THREE.MeshBasicNodeMaterial({ color: COBALT })
  );
  ring.applyMatrix4(tangentMatrix(moscow, 1.0045, 0.038));
  spin.add(ring);

  const rippleMat = new THREE.MeshBasicNodeMaterial({ color: COBALT, transparent: true, depthWrite: false });
  {
    const p = fract(uTime.div(FLOW));
    const d = uv().sub(0.5).length();
    const band = d.sub(p.mul(0.46).add(0.04)).div(0.028);
    const ringA = exp(band.mul(band).negate());
    rippleMat.opacityNode = ringA
      .mul(float(1).sub(p).pow(2))
      .mul(smoothstep(0.0, 0.1, p))
      .mul(0.45);
  }
  const ripple = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), rippleMat);
  ripple.applyMatrix4(tangentMatrix(moscow, 1.004, 0.24));
  ripple.renderOrder = 3;
  spin.add(ripple);

  // ── Сеть: от Москвы ко всем городам с серверами + связи между ними ─
  // Владелец, 11.09.2026: «больше связующих анимированных линий, чтобы
  // было красиво». Два материала на все дуги (шейдер собирается дважды,
  // а не на каждую из ~47 линий): фаза и скорость света — атрибутами
  // геометрии. Чем ближе город к Москве по отклику, тем чаще бежит свет.
  const tubeSeg = tier === 0 ? 40 : tier === 1 ? 56 : 72;
  const arcPath = (a: THREE.Vector3, b: THREE.Vector3, liftK: number, base: number) => {
    const omega = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
    // Высота дуги растёт с расстоянием, но с потолком: дуги к США и
    // Азии иначе уходили петлями за верх кадра (замечено 11.09.2026).
    const lift = base + liftK * Math.min(omega, 0.75);
    const sinO = Math.sin(omega) || 1;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 48; k++) {
      const s = k / 48;
      const p = a
        .clone()
        .multiplyScalar(Math.sin((1 - s) * omega) / sinO)
        .add(b.clone().multiplyScalar(Math.sin(s * omega) / sinO))
        .normalize();
      pts.push(p.multiplyScalar(1.006 + lift * Math.sin(Math.PI * s)));
    }
    return new THREE.CatmullRomCurve3(pts);
  };
  const flowMat = (baseOp: number, peak: number) => {
    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    const u = uv().x;
    // Приведение только для TS: в типах three перегрузки mul/add не
    // принимают узел атрибута и выводят never. Шейдер тот же — атрибут
    // float на вершину.
    type F = ReturnType<typeof float>;
    const phase = attribute("aPhase", "float") as unknown as F;
    const speed = attribute("aSpeed", "float") as unknown as F;
    const head = fract(uTime.div(FLOW).mul(speed).add(phase)).mul(1.6).sub(0.2);
    const d = head.sub(u);
    const glow = smoothstep(-0.03, 0.0, d).mul(clamp(float(1).sub(d.div(0.4)), 0, 1).pow(2));
    const ends = smoothstep(0.0, 0.06, u).mul(float(1).sub(smoothstep(0.94, 1.0, u)));
    mat.colorNode = mix(color(COBALT), color(0x4d6bff), glow.mul(0.7));
    mat.opacityNode = mix(float(baseOp), float(peak), glow).mul(ends);
    return mat;
  };
  const trunkMat = flowMat(0.32, 1);
  const linkMat = flowMat(0.13, 0.7);
  const addArc = (
    curve: THREE.CatmullRomCurve3,
    radius: number,
    mat: THREE.Material,
    phase: number,
    speed: number,
    order: number
  ) => {
    const geom = new THREE.TubeGeometry(curve, tubeSeg, radius, 5, false);
    const n = geom.attributes.position.count;
    geom.setAttribute("aPhase", new THREE.Float32BufferAttribute(new Float32Array(n).fill(phase), 1));
    geom.setAttribute("aSpeed", new THREE.Float32BufferAttribute(new Float32Array(n).fill(speed), 1));
    const mesh = new THREE.Mesh(geom, mat);
    mesh.renderOrder = order;
    spin.add(mesh);
  };
  // Магистрали от Москвы: свет по ближним бежит чаще (отклик страны).
  SERVER_POINTS.forEach((p, i) => {
    const speed = THREE.MathUtils.clamp(40 / p.latencyMs, 0.35, 1.6);
    addArc(arcPath(moscow, servers[i], 0.3, 0.03), 0.0036, trunkMat, (i * 0.137) % 1, speed, 4);
  });
  // Связи между серверами: каждый — с двумя ближайшими соседями, без повторов.
  const linked = new Set<string>();
  servers.forEach((a, i) => {
    servers
      .map((b, j) => ({ j, d: a.dot(b) }))
      .filter((o) => o.j !== i)
      .sort((x, y) => y.d - x.d)
      .slice(0, 2)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (linked.has(key)) return;
        linked.add(key);
        addArc(arcPath(a, servers[j], 0.22, 0.012), 0.0024, linkMat, ((i * 7 + j * 3) * 0.071) % 1, 0.7, 3);
      });
  });

  const spinAt = (t: number) => -FRONT_LON * DEG + (t / PERIOD) * Math.PI * 2;

  return {
    radius: 1.02,
    stillT: FLOW * 0.42,
    update({ t, px, py }) {
      uTime.value = t;
      spin.rotation.y = spinAt(t);
      root.rotation.y = px * 0.14;
      root.rotation.x = py * 0.08;
    },
    dispose() {},
  };
};
