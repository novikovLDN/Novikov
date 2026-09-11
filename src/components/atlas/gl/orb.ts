/**
 * «Ядро связи» для рабочих экранов (кабинет, оплата, новое устройство,
 * вход): стеклянная кобальтовая сфера со светящейся сердцевиной, три
 * тонкие наклонные орбиты, по которым бегут светлые «пакеты» с
 * коротким шлейфом. Свечение слегка дышит.
 *
 * СОСТОЯНИЯ (active / idle / off) — не пересборка сцены, а четыре
 * числа: свечение, ход, насыщенность, «матовость». Сцена тянет их к
 * цели экспонентой с постоянной 0,27 с — переход ≈0,8 с при любой
 * частоте экрана. Фазы орбит и вращения НАКАПЛИВАЮТСЯ от dt, поэтому
 * смена скорости не даёт скачка положения.
 *
 * БЮДЖЕТ: стекло ≈6,1k треугольников, три орбиты по 1,9k, девять
 * пакетов по 80, две плоскости свечения — ≈12,6k при потолке 30k.
 * Отрисовок — 10.
 */
import * as THREE from "three/webgpu";
import {
  color,
  exp,
  float,
  fract,
  mix,
  normalView,
  positionView,
  positionViewDirection,
  saturate,
  smoothstep,
  uniform,
  uv,
} from "three/tsl";
import { addLights } from "./core";
import type { Builder } from "./stage";

export type OrbTheme = "dark" | "light";
export type OrbState = "active" | "idle" | "off";
/** Живые параметры: компонент меняет `state`, сцена читает его каждый кадр. */
export interface OrbLive {
  state: OrbState;
}

const COBALT = 0x1432b8;

const TARGET: Record<OrbState, { glow: number; motion: number; sat: number; dead: number }> = {
  active: { glow: 1, motion: 1, sat: 1, dead: 0 },
  idle: { glow: 0.5, motion: 0.35, sat: 0.9, dead: 0 },
  off: { glow: 0.05, motion: 0.03, sat: 0, dead: 1 },
};

const PALETTE = {
  light: {
    glass: 0x1432b8,
    glassRim: [0.1, 0.9] as const,
    glow: 0x3b5bff,
    spark: 0x9fb2ff,
    ring: 0xa3adc2,
    ringA: 0.55,
    packet: 0x2448e6,
    trail: 0x1f3fe0,
    gray: 0x8b9099,
    grayRing: 0xb5b9c1,
  },
  dark: {
    glass: 0x3456f0,
    glassRim: [0.16, 0.95] as const,
    glow: 0xdfe6ff,
    spark: 0xffffff,
    ring: 0xc9d3f2,
    ringA: 0.3,
    packet: 0xffffff,
    trail: 0xe6ecff,
    gray: 0x5d6470,
    grayRing: 0x7c838f,
  },
};

const ORBITS = [
  { r: 0.92, tilt: [1.2, 0.25, 0] as const, speed: 0.07, n: 3 },
  { r: 1.08, tilt: [1.42, -0.7, 0.45] as const, speed: -0.052, n: 3 },
  { r: 1.24, tilt: [0.95, 0.85, -0.35] as const, speed: 0.04, n: 3 },
];

export function makeOrb(theme: OrbTheme, live: OrbLive): Builder {
  return ({ scene, camera, tier }) => {
    const P = PALETTE[theme];
    addLights(scene, theme === "dark" ? 1.6 : 1.3);
    scene.environmentIntensity = theme === "dark" ? 1.2 : 1;

    // Параметры состояния — uniform'ы, значение тянется в update.
    const uGlow = uniform(1);
    const uSat = uniform(1);
    const uDead = uniform(0);
    const uBreath = uniform(1);
    const uFar = uniform(-4);
    const uNear = uniform(-3);
    const cur = { ...TARGET[live.state] };

    const root = new THREE.Group(); // параллакс
    const body = new THREE.Group(); // вращение
    root.add(body);
    scene.add(root);

    // ── Стекло ──────────────────────────────────────────────────────
    const fres = float(1).sub(saturate(normalView.dot(positionViewDirection)));
    const glass = new THREE.MeshPhysicalNodeMaterial({
      metalness: 0,
      transparent: true,
      depthWrite: false,
    });
    glass.colorNode = mix(color(P.gray), color(P.glass), uSat);
    glass.roughnessNode = mix(float(0.08), float(0.6), uDead);
    glass.clearcoatNode = mix(float(1), float(0.15), uDead);
    glass.clearcoatRoughnessNode = mix(float(0.04), float(0.5), uDead);
    // Мёртвое ядро плотнее: матовая сфера, а не стекло.
    const rim = mix(float(P.glassRim[0]), float(P.glassRim[1]), fres.pow(2.2));
    glass.opacityNode = mix(rim, float(0.92), uDead.mul(0.85));
    const seg = tier === 0 ? [48, 36] : [64, 48];
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.62, seg[0], seg[1]), glass);
    core.renderOrder = 2;
    body.add(core);

    // ── Сердцевина: мягкий свет + точка, плоскости к камере ─────────
    const glowMat = (hex: number, k: number, a: number, size: number) => {
      const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
      const d = uv().sub(0.5).length().mul(2);
      m.colorNode = mix(color(P.gray), color(hex), uSat);
      m.opacityNode = exp(d.mul(d).mul(-k))
        .mul(float(1).sub(smoothstep(0.85, 1.0, d)))
        .mul(a)
        .mul(uGlow)
        .mul(uBreath);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m);
      mesh.renderOrder = 1;
      root.add(mesh);
      return mesh;
    };
    glowMat(P.glow, 5, theme === "dark" ? 0.75 : 0.6, 1.1);
    glowMat(P.spark, 14, 0.9, 0.5);

    // ── Орбиты и пакеты ─────────────────────────────────────────────
    const phases = ORBITS.map((_, i) => i * 0.21);
    const uPhase = ORBITS.map((_, i) => uniform(phases[i]));
    const heads: THREE.InstancedMesh[] = [];
    const headGeo = new THREE.IcosahedronGeometry(1, 1);
    const headMat =
      theme === "dark"
        ? new THREE.MeshBasicNodeMaterial()
        : new THREE.MeshPhysicalNodeMaterial({ roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
    headMat.colorNode = mix(color(P.gray), color(P.packet), uSat);

    ORBITS.forEach((o, i) => {
      const g = new THREE.Group();
      g.rotation.set(o.tilt[0], o.tilt[1], o.tilt[2]);
      body.add(g);

      const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
      // n пакетов поровну по кругу; s — доля пути от головы назад.
      const s = fract(uPhase[i].sub(uv().x).mul(o.speed < 0 ? -o.n : o.n));
      const tail = exp(s.mul(-7)).mul(uGlow);
      const depth = smoothstep(uFar, uNear, positionView.z);
      const ringCol = mix(color(P.grayRing), color(P.ring), uSat);
      mat.colorNode = mix(ringCol, mix(color(P.grayRing), color(P.trail), uSat), saturate(tail));
      mat.opacityNode = mix(float(P.ringA), float(1), saturate(tail)).mul(mix(float(0.3), float(1), depth));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(o.r, 0.0038, 6, 160), mat);
      ring.renderOrder = 3;
      g.add(ring);

      const h = new THREE.InstancedMesh(headGeo, headMat, o.n);
      h.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      h.renderOrder = 4;
      g.add(h);
      heads.push(h);
    });

    // ── Движение ────────────────────────────────────────────────────
    let spin = 0.4;
    let breath = 0;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();

    return {
      radius: 1.3,
      stillT: 0,
      update({ dt, px, py }) {
        const tg = TARGET[live.state];
        // dt = 0 — первый кадр или перерисовка неподвижного: сразу в цель.
        const k = dt === 0 ? 1 : 1 - Math.exp(-dt / 0.27);
        cur.glow += (tg.glow - cur.glow) * k;
        cur.motion += (tg.motion - cur.motion) * k;
        cur.sat += (tg.sat - cur.sat) * k;
        cur.dead += (tg.dead - cur.dead) * k;
        uGlow.value = cur.glow;
        uSat.value = cur.sat;
        uDead.value = cur.dead;

        breath += dt * ((Math.PI * 2) / 5) * (0.4 + 0.6 * cur.motion);
        uBreath.value = 1 + 0.12 * cur.motion * Math.sin(breath);

        const z = camera.position.z;
        uFar.value = -(z + 1.0);
        uNear.value = -(z - 0.6);

        spin += dt * ((Math.PI * 2) / 60) * cur.motion;
        body.rotation.set(0.18, spin, 0);

        const size = 0.016 + 0.01 * cur.glow;
        ORBITS.forEach((o, i) => {
          phases[i] += dt * Math.abs(o.speed) * cur.motion;
          uPhase[i].value = phases[i];
          const dir = o.speed < 0 ? -1 : 1;
          for (let j = 0; j < o.n; j++) {
            // Голова пакета там, где шлейф в шейдере равен 1 (s = 0).
            const a = dir * (phases[i] + j / o.n) * Math.PI * 2;
            p.set(o.r * Math.cos(a), o.r * Math.sin(a), 0);
            sc.setScalar(size);
            heads[i].setMatrixAt(j, m.compose(p, q, sc));
          }
          heads[i].instanceMatrix.needsUpdate = true;
        });

        root.rotation.y = px * 0.12;
        root.rotation.x = py * 0.08;
      },
      dispose() {},
    };
  };
}
