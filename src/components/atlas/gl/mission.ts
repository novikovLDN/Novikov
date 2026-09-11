/**
 * Раздел 07 — «свободный и быстрый интернет для каждого».
 *
 * ОБРАЗ: хаос → порядок → свобода. Каждая частица — человек. Пока
 * раздел входит в кадр, облако разрозненных частиц по спирали
 * собирается в сферу-сеть: кобальтовые узлы, от каждого человека —
 * тонкая спица к ближайшему узлу, узлы связаны между собой, и по этим
 * связям бежит свет. Когда раздел уходит вверх, сфера мягко
 * раскрывается наружу — сеть не держит, а отпускает.
 *
 * ПРОКРУТКА ведёт сцену через `live.progress` (0 — раздел входит
 * снизу, 1 — ушёл вверх). Значение сглаживается по времени (τ 0,35 с),
 * поэтому резкий рывок колеса не даёт рывка в кадре. Поверх —
 * спокойное собственное движение: вращение, волна дыхания, дрейф
 * облака.
 *
 * ВСЁ ДВИЖЕНИЕ ЧАСТИЦ — В ШЕЙДЕРЕ: процессор каждый кадр пишет пять
 * чисел, а не тысячу матриц. Частицы — инстансные спрайты (2
 * треугольника), связи — один статичный буфер тонких призм.
 *
 * БЮДЖЕТ (замер в data-tris): полный вариант ≈14k треугольников,
 * compact ≈6k; 3 отрисовки.
 */
import * as THREE from "three/webgpu";
import {
  attribute,
  color,
  cos,
  dot,
  float,
  fract,
  fwidth,
  instancedBufferAttribute,
  mix,
  normalize,
  positionLocal,
  positionView,
  sin,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";
import type { Node } from "three/webgpu";
import type { Builder } from "./stage";

// Типы TSL для атрибутов выводятся как Node<string> — уточняем руками.
type V3 = Node<"vec3">;
type V2 = Node<"vec2">;
type F = Node<"float">;

/** Живой вход сцены: цель прогресса раздела, 0…1. */
export interface MissionLive {
  progress: number;
}

const COBALT = 0x1432b8;
const GRAPHITE = 0x7c879f;
const LINK = 0x9aa5bd;
const SPOKE = 0xb9c0ce;
/** Оборот сети, с. */
const PERIOD = 110;
/** Прогресс неподвижного кадра: сеть собрана, раскрытие не началось. */
const STILL_PROGRESS = 0.6;

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Детерминированный шум: кадр одинаков от загрузки к загрузке. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Тонкие трёхгранные призмы по отрезкам — одним буфером. */
function prisms(list: Array<[THREE.Vector3, THREE.Vector3, number]>, radius: number): THREE.BufferGeometry {
  const E = list.length;
  const pos = new Float32Array(E * 6 * 3);
  const u = new Float32Array(E * 6);
  const seed = new Float32Array(E * 6);
  const idx = new Uint32Array(E * 18);
  const d = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const off = new THREE.Vector3();
  list.forEach(([a, b, s], e) => {
    d.subVectors(b, a).normalize();
    p1.crossVectors(d, a).normalize();
    p2.crossVectors(d, p1).normalize();
    for (let k = 0; k < 3; k++) {
      const ang = (k / 3) * Math.PI * 2;
      off.copy(p1).multiplyScalar(Math.cos(ang) * radius).addScaledVector(p2, Math.sin(ang) * radius);
      const v0 = e * 6 + k;
      const v1 = e * 6 + 3 + k;
      pos.set([a.x + off.x, a.y + off.y, a.z + off.z], v0 * 3);
      pos.set([b.x + off.x, b.y + off.y, b.z + off.z], v1 * 3);
      u[v0] = 0;
      u[v1] = 1;
      seed[v0] = s;
      seed[v1] = s;
    }
    for (let k = 0; k < 3; k++) {
      const a0 = e * 6 + k;
      const a1 = e * 6 + ((k + 1) % 3);
      idx.set([a0, a1, a1 + 3, a0, a1 + 3, a0 + 3], e * 18 + k * 6);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aU", new THREE.BufferAttribute(u, 1));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}

export function makeMission(live: MissionLive, compact: boolean): Builder {
  return ({ scene, camera, tier, still }) => {
    const N = compact ? (tier === 0 ? 480 : 640) : tier === 0 ? 900 : tier === 1 ? 1200 : 1500;
    const rand = rng(7);

    // ── Точки: цель на сфере Фибоначчи, старт в облаке ─────────────
    const golden = Math.PI * (3 - Math.sqrt(5));
    const T: THREE.Vector3[] = [];
    const aT = new Float32Array(N * 3);
    const aC = new Float32Array(N * 3);
    const aS = new Float32Array(N * 2);
    const hubs: number[] = [];
    const flat = compact ? 0.95 : 0.62;
    const [rMin, rMax] = compact ? [1.35, 2.1] : [1.5, 2.8];
    for (let i = 0; i < N; i++) {
      const y = 1 - ((i + 0.5) * 2) / N;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      const t = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
      T.push(t);
      aT.set([t.x, t.y, t.z], i * 3);
      // Облако: случайное направление, толстая оболочка, приплюснута
      // по вертикали — растянута по ширине кадра.
      const cz = rand() * 2 - 1;
      const ca = rand() * Math.PI * 2;
      const cr = Math.sqrt(1 - cz * cz);
      const rad = rMin + (rMax - rMin) * Math.pow(rand(), 0.7);
      aC.set([Math.cos(ca) * cr * rad, cz * rad * flat, Math.sin(ca) * cr * rad], i * 3);
      const hub = rand() < 0.12;
      if (hub) hubs.push(i);
      aS.set([rand(), hub ? 1 : 0], i * 2);
    }

    // ── Связи: узел — три ближайших узла; человек — ближайший узел ──
    const hubLinks: Array<[THREE.Vector3, THREE.Vector3, number]> = [];
    const spokes: Array<[THREE.Vector3, THREE.Vector3, number]> = [];
    {
      const seen = new Set<number>();
      for (const i of hubs) {
        const near = hubs
          .filter((j) => j !== i)
          .map((j) => [j, T[i].distanceToSquared(T[j])] as const)
          .sort((a, b) => a[1] - b[1])
          .slice(0, 3);
        for (const [j] of near) {
          const key = Math.min(i, j) * N + Math.max(i, j);
          if (seen.has(key)) continue;
          seen.add(key);
          hubLinks.push([T[i], T[j], rand()]);
        }
      }
      const isHub = new Uint8Array(N);
      hubs.forEach((i) => (isHub[i] = 1));
      for (let i = 0; i < N; i++) {
        if (isHub[i]) continue;
        let best = -1;
        let bd = Infinity;
        for (const j of hubs) {
          const dd = T[i].distanceToSquared(T[j]);
          if (dd < bd) {
            bd = dd;
            best = j;
          }
        }
        if (best >= 0 && bd < 0.09) spokes.push([T[i], T[best], rand()]);
      }
    }

    // ── Uniform'ы: пять чисел на кадр ──────────────────────────────
    const uTime = uniform(0);
    const uAsm = uniform(1);
    const uRel = uniform(0);
    const uFar = uniform(-4);
    const uNear = uniform(-3);
    const WAVE = vec3(0.42, 0.78, 0.46);

    /** Дыхание: радиальная волна по направлению — общая для точек и связей. */
    const breathe = (dir: V3) =>
      sin(uTime.mul(0.6).add(dot(dir, WAVE).mul(3.4))).mul(0.026).add(1);
    const depthFade = smoothstep(uFar, uNear, positionView.z);

    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    scene.add(root);

    // ── Частицы ────────────────────────────────────────────────────
    {
      const tgt = instancedBufferAttribute(new THREE.InstancedBufferAttribute(aT, 3), "vec3") as unknown as V3;
      const cha = instancedBufferAttribute(new THREE.InstancedBufferAttribute(aC, 3), "vec3") as unknown as V3;
      const sd = instancedBufferAttribute(new THREE.InstancedBufferAttribute(aS, 2), "vec2") as unknown as V2;
      const seed = sd.x;
      const hub = sd.y;

      // Своя доля сборки у каждой частицы: облако сходится волной.
      const a = smoothstep(seed.mul(0.42), seed.mul(0.42).add(0.58), uAsm);
      const tw = tgt.mul(breathe(tgt)).mul(float(1).add(uRel.mul(seed.mul(0.5).add(0.45))));
      const drift = vec3(
        sin(uTime.mul(0.23).add(seed.mul(40))),
        sin(uTime.mul(0.19).add(seed.mul(57))),
        sin(uTime.mul(0.21).add(seed.mul(23)))
      ).mul(0.1);
      const p = mix(cha.add(drift), tw, a) as unknown as V3;
      // Спираль: несобранная частица повёрнута вокруг оси, по мере
      // сборки поворот уходит в ноль — облако закручивается в сферу.
      const ang = float(1).sub(a).mul(2.4);
      const ca = cos(ang);
      const sa = sin(ang);
      const pos = vec3(p.x.mul(ca).sub(p.z.mul(sa)), p.y, p.x.mul(sa).add(p.z.mul(ca)));

      const mat = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
      mat.positionNode = pos;
      mat.scaleNode = mix(float(0.021), float(0.036), hub).mul(mix(float(0.75), float(1), a));
      const base = mix(color(GRAPHITE), color(COBALT), hub.mul(mix(float(0.3), float(1), a)));
      // Бусина, а не плоский диск: мягкий блик сверху слева.
      const hl = float(1).sub(smoothstep(0.0, 0.24, uv().sub(vec2(0.36, 0.64)).length()));
      mat.colorNode = mix(base, color(0xffffff), hl.mul(0.4));
      const d = uv().sub(0.5).length();
      const disc = float(1).sub(smoothstep(float(0.5).sub(fwidth(d).mul(1.5)), float(0.5), d));
      mat.opacityNode = disc
        .mul(mix(float(0.3), float(1), depthFade))
        .mul(mix(float(0.5), float(1), a))
        .mul(float(1).sub(uRel.mul(0.55)));

      const sprites = new THREE.Sprite(mat);
      sprites.count = N;
      sprites.frustumCulled = false;
      sprites.renderOrder = 3;
      body.add(sprites);
    }

    // ── Связи ──────────────────────────────────────────────────────
    const linkMat = (hex: number, alpha: number, pulses: boolean) => {
      const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const dir = normalize(positionLocal);
      m.positionNode = positionLocal.mul(breathe(dir)).mul(float(1).add(uRel.mul(0.7)));
      // Связи проявляются, когда облако почти собрано, и гаснут первыми
      // при раскрытии.
      const show = smoothstep(0.72, 1.0, uAsm).mul(float(1).sub(smoothstep(0.0, 0.45, uRel)));
      const fade = mix(float(0.2), float(1), depthFade);
      if (pulses) {
        const u = attribute("aU", "float") as unknown as F;
        const s = attribute("aSeed", "float") as unknown as F;
        const head = fract(uTime.mul(0.085).add(s)).mul(6).sub(1);
        const dd = head.sub(u);
        const pulse = smoothstep(-0.12, 0.0, dd).mul(float(1).sub(dd.div(0.6)).clamp(0, 1).pow(2));
        m.colorNode = mix(color(hex), color(COBALT), pulse);
        m.opacityNode = mix(float(alpha), float(1), pulse).mul(fade).mul(show);
      } else {
        m.colorNode = color(hex);
        m.opacityNode = float(alpha).mul(fade).mul(show);
      }
      return m;
    };
    const spokeMesh = new THREE.Mesh(prisms(spokes, 0.0018), linkMat(SPOKE, 0.55, false));
    spokeMesh.renderOrder = 1;
    spokeMesh.frustumCulled = false;
    body.add(spokeMesh);
    const linkMesh = new THREE.Mesh(prisms(hubLinks, 0.0034), linkMat(LINK, 0.7, true));
    linkMesh.renderOrder = 2;
    linkMesh.frustumCulled = false;
    body.add(linkMesh);

    // ── Движение ───────────────────────────────────────────────────
    let p = still ? STILL_PROGRESS : live.progress;
    let spin = 0.5;

    return {
      radius: 1.12,
      stillT: 4,
      update({ t, dt, px, py }) {
        const target = still ? STILL_PROGRESS : live.progress;
        // dt = 0 — первый кадр после паузы: встать в текущую точку
        // прокрутки без догоняющей анимации.
        p += (target - p) * (dt === 0 ? 1 : 1 - Math.exp(-dt / 0.35));
        const asm = ss(0.04, 0.46, p);
        const rel = ss(0.8, 1.0, p);
        uTime.value = t;
        uAsm.value = asm;
        uRel.value = rel;

        const z = camera.position.z;
        uFar.value = -(z + 1.0);
        uNear.value = -(z - 0.6);

        spin += (dt * Math.PI * 2) / PERIOD;
        // Прокрутка добавляет поворот: сеть поворачивается вслед за
        // читателем, а не только сама по себе.
        body.rotation.set(0.3 - 0.12 * (1 - asm), spin + p * 1.5, 0);
        root.rotation.y = px * 0.12;
        root.rotation.x = py * 0.08;
      },
      dispose() {},
    };
  };
}
