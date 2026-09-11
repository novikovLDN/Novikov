/**
 * Объект раздела 07 — «свободный и быстрый интернет для каждого».
 *
 * Сфера-сеть вместо «атома»: мягкие узлы по сфере Фибоначчи, каждый
 * связан тонкой нитью с тремя ближайшими соседями, внутри —
 * полупрозрачное кобальтовое стеклянное ядро. По сети медленно идёт
 * волна (узлы дышат радиально, нити тянутся за ними), изредка по
 * нити пробегает мягкий кобальтовый свет.
 *
 * БЮДЖЕТ (замер): уровень 2 — ≈50k треугольников (220 узлов по 180,
 * ≈360 нитей по 12, ядро ≈6k), уровень 1 — ≈23k; потолок 60k.
 * Отрисовок — 5.
 */
import * as THREE from "three/webgpu";
import {
  clamp,
  color,
  exp,
  float,
  fract,
  hash,
  instanceIndex,
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

const COBALT = 0x1432b8;
/** Оборот сети, с. */
const PERIOD = 96;

export const buildMission: Builder = ({ scene, camera, tier }) => {
  addLights(scene, 1.3);
  scene.environmentIntensity = 1;

  const uTime = uniform(0);
  const uFar = uniform(-4);
  const uNear = uniform(-3);

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  scene.add(root);

  // ── Узлы по сфере Фибоначчи ──────────────────────────────────────
  const N = tier === 0 ? 120 : tier === 1 ? 170 : 220;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const dirs: THREE.Vector3[] = [];
  const size: number[] = [];
  const hub: boolean[] = [];
  const phase: number[] = [];
  const rnd = (i: number, k: number) => {
    const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  const wave = new THREE.Vector3(0.4, 0.8, 0.45).normalize();
  for (let i = 0; i < N; i++) {
    const y = 1 - ((i + 0.5) * 2) / N;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const d = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
    dirs.push(d);
    const isHub = rnd(i, 1) < 0.11;
    hub.push(isHub);
    size.push(isHub ? 0.026 + rnd(i, 2) * 0.008 : 0.014 + rnd(i, 3) * 0.01);
    phase.push(d.dot(wave) * 3.4 + rnd(i, 4) * 0.8);
  }

  // Три ближайших соседа, рёбра без повторов.
  const edges: Array<[number, number]> = [];
  {
    const seen = new Set<number>();
    for (let i = 0; i < N; i++) {
      const near = dirs
        .map((d, j) => [j, j === i ? 9 : d.distanceToSquared(dirs[i])] as const)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 3);
      for (const [j] of near) {
        const key = Math.min(i, j) * N + Math.max(i, j);
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push([i, j]);
      }
    }
  }

  const nodes = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, tier === 2 ? 2 : 1),
    new THREE.MeshPhysicalNodeMaterial({
      color: 0xffffff,
      roughness: 0.26,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
    N
  );
  {
    const pearl = new THREE.Color(0xf3f4f8);
    const cob = new THREE.Color(COBALT);
    for (let i = 0; i < N; i++) nodes.setColorAt(i, hub[i] ? cob : pearl);
  }
  nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  body.add(nodes);

  // ── Нити: тонкие цилиндры, свет изредка бежит по ним ─────────────
  const edgeMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  {
    const v = uv().y;
    const head = fract(uTime.mul(0.08).add(hash(instanceIndex))).mul(8).sub(1);
    const d = head.sub(v);
    const pulse = smoothstep(-0.15, 0.0, d).mul(clamp(float(1).sub(d.div(0.7)), 0, 1).pow(2));
    // Задняя половина сети бледнее: объём читается без тумана.
    const depth = smoothstep(uFar, uNear, positionView.z);
    edgeMat.colorNode = mix(color(0xa7b1c6), color(COBALT), pulse);
    edgeMat.opacityNode = mix(float(0.5), float(1), pulse).mul(mix(float(0.22), float(1), depth));
  }
  const edgeGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  const links = new THREE.InstancedMesh(edgeGeo, edgeMat, edges.length);
  links.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  links.renderOrder = 3;
  body.add(links);

  // ── Ядро: кобальтовое стекло + светлая сердцевина ────────────────
  const fres = float(1).sub(saturate(normalView.dot(positionViewDirection)));
  const glass = new THREE.MeshPhysicalNodeMaterial({
    color: COBALT,
    roughness: 0.1,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    transparent: true,
    depthWrite: false,
  });
  glass.opacityNode = mix(float(0.12), float(0.9), fres.pow(2.2));
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.4, 64, 48), glass);
  core.renderOrder = 2;
  body.add(core);

  // Сердцевина — не шар (шар в стекле читался глазом), а мягкий свет:
  // плоскость к камере с гауссовым спадом, видна сквозь стекло.
  const heartMat = new THREE.MeshBasicNodeMaterial({ color: 0x3b5bff, transparent: true, depthWrite: false });
  {
    const d = uv().sub(0.5).length().mul(2);
    heartMat.opacityNode = exp(d.mul(d).mul(-6)).mul(float(1).sub(smoothstep(0.85, 1.0, d))).mul(0.55);
  }
  const heart = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), heartMat);
  heart.renderOrder = 1;
  root.add(heart);

  // Мягкая дымка за объектом — плоскость к камере, не вращается.
  const auraMat = new THREE.MeshBasicNodeMaterial({ color: COBALT, transparent: true, depthWrite: false });
  {
    const d = uv().sub(0.5).length().mul(2);
    auraMat.opacityNode = exp(d.mul(d).mul(-4.2)).mul(float(1).sub(smoothstep(0.8, 1.0, d))).mul(0.085);
  }
  const aura = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), auraMat);
  aura.position.z = -0.6;
  aura.renderOrder = -1;
  root.add(aura);

  // ── Движение ─────────────────────────────────────────────────────
  const pos = dirs.map((d) => d.clone());
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0);
  const noRot = new THREE.Quaternion();
  const thread = 0.0021;

  const place = (t: number) => {
    for (let i = 0; i < N; i++) {
      const r = 1 + 0.045 * Math.sin(t * 0.55 + phase[i]);
      pos[i].copy(dirs[i]).multiplyScalar(r);
      s.setScalar(size[i]);
      nodes.setMatrixAt(i, m.compose(pos[i], noRot, s));
    }
    for (let k = 0; k < edges.length; k++) {
      const a = pos[edges[k][0]];
      const b = pos[edges[k][1]];
      mid.addVectors(a, b).multiplyScalar(0.5);
      dir.subVectors(b, a);
      const len = dir.length();
      q.setFromUnitVectors(Y, dir.divideScalar(len));
      s.set(thread, len, thread);
      links.setMatrixAt(k, m.compose(mid, q, s));
    }
    nodes.instanceMatrix.needsUpdate = true;
    links.instanceMatrix.needsUpdate = true;
  };

  return {
    radius: 1.08,
    stillT: 6,
    update({ t, px, py }) {
      uTime.value = t;
      const z = camera.position.z;
      uFar.value = -(z + 0.9);
      uNear.value = -(z - 0.5);
      place(t);
      body.rotation.y = (t / PERIOD) * Math.PI * 2 + 0.6;
      body.rotation.x = 0.32 + 0.05 * Math.sin(t * 0.13);
      const breath = 1 + 0.018 * Math.sin((t / 9) * Math.PI * 2);
      core.scale.setScalar(breath);
      heart.scale.setScalar(2 - breath);
      root.rotation.y = px * 0.16;
      root.rotation.x = py * 0.1;
    },
    dispose() {},
  };
};
