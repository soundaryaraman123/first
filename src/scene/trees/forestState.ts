/**
 * Per-tree state in typed arrays (no React state, no per-tree objects).
 *
 * Every "site" (a spot on the slope) owns two instances:
 *   - one in its native species' InstancedMesh
 *   - one in the pine mesh (chir or blue, by altitude), initially grown to 0
 * Showing/hiding is a per-instance `aGrow` attribute (0..1) read by the tree
 * shader, which shrinks and sinks the tree. Instance matrices never change.
 *
 * Each frame `updateForest` derives the target state for every site from the
 * scroll position (section 2 clearing) and conversion flags (section 3), then
 * steps a linear animation phase toward it and writes eased values into the
 * attribute arrays. Only changed meshes are re-uploaded.
 */
import * as THREE from 'three';
import type { Heightfield } from '../terrain/heightfield';
import type { Tier } from '../../lib/device';
import { mulberry32 } from '../../lib/random';
import { clamp, easeInOutCubic } from '../../lib/math';
import { WORLD } from '../config';
import { SECTION } from '../../sections/sectionIndex';
import { scatterTrees } from './scatter';
import { NATIVE_COUNT, TREE_IDS } from './speciesVisuals';
import type { TreeGeometry } from './geometries';
import { dryMap, dryMapData, DRY_MAP_H, DRY_MAP_W } from '../terrain/terrainMaterial';

/** animation timings, seconds */
export const TIMING = {
  nativeOut: 0.9,
  pineIn: 1.2,
  /** pine starts growing this long after the native tree starts sinking */
  pineLag: 0.35,
  /** click ripple: extra delay at the edge of the brush */
  rippleSpread: 0.75,
  rippleJitter: 0.25,
  /** final sweep duration (valley -> ridge) */
  sweep: 2.6,
};

export const UNASSIGNED = 0xffffffff;

export interface Forest {
  count: number;
  geoms: TreeGeometry[];
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  rot: Float32Array;
  scale: Float32Array;
  meters: Float32Array;
  /** mesh index (into TREE_IDS) and slot for the native and the pine instance */
  nativeMesh: Uint8Array;
  nativeSlot: Uint32Array;
  pineMesh: Uint8Array;
  pineSlot: Uint32Array;
  /** section 2 clearing */
  cluster: Uint16Array;
  clusterThreshold: Float32Array;
  jitter: Float32Array;
  /** section 3 conversion */
  converted: Uint8Array;
  convertAt: Float32Array;
  convertedCount: number;
  /** animation phases (linear 0..1) */
  nativeP: Float32Array;
  pineP: Float32Array;
  /** per-mesh instance counts and attribute arrays */
  /** instance capacity per mesh */
  meshCount: number[];
  /** pine instances are handed out on conversion, so unconverted pines cost nothing to draw */
  pineUsed: number[];
  /** sites whose pine instance was just assigned and needs its matrix written */
  newPineSites: number[];
  grow: Float32Array[];
  hover: Float32Array[];
  meshDirty: boolean[];
  hoverDirty: boolean[];
  dryDirty: boolean;
  hovered: { mesh: number; slot: number } | null;
  hoverActive: { mesh: number; slot: number }[];
}

export function buildForest(hf: Heightfield, geoms: TreeGeometry[], tier: Tier): Forest {
  const sites = scatterTrees(hf, tier);
  const n = sites.length;
  const rng = mulberry32(WORLD.seed + 77);
  const meshCount = new Array(TREE_IDS.length).fill(0);

  const f: Forest = {
    count: n,
    geoms,
    x: new Float32Array(n),
    y: new Float32Array(n),
    z: new Float32Array(n),
    rot: new Float32Array(n),
    scale: new Float32Array(n),
    meters: new Float32Array(n),
    nativeMesh: new Uint8Array(n),
    nativeSlot: new Uint32Array(n),
    pineMesh: new Uint8Array(n),
    pineSlot: new Uint32Array(n),
    cluster: new Uint16Array(n),
    clusterThreshold: new Float32Array(WORLD.clusterCount),
    jitter: new Float32Array(n),
    converted: new Uint8Array(n),
    convertAt: new Float32Array(n),
    convertedCount: 0,
    nativeP: new Float32Array(n).fill(1),
    pineP: new Float32Array(n),
    meshCount,
    pineUsed: new Array(TREE_IDS.length).fill(0),
    newPineSites: [],
    grow: [],
    hover: [],
    meshDirty: new Array(TREE_IDS.length).fill(true),
    hoverDirty: new Array(TREE_IDS.length).fill(false),
    dryDirty: true,
    hovered: null,
    hoverActive: [],
  };

  // --- clusters for section 2: nearest of N random seeds -------------------
  const { minX, maxX, minZ, maxZ } = WORLD.treeArea;
  const seeds: { x: number; z: number; score: number }[] = [];
  for (let c = 0; c < WORLD.clusterCount; c++) {
    const x = minX + rng() * (maxX - minX);
    const z = minZ + rng() * (maxZ - minZ);
    // extraction starts near the valley (railway) and works uphill
    seeds.push({ x, z, score: hf.heightAt(x, z) / 100 + rng() * 0.6 });
  }
  const order = seeds.map((_, i) => i).sort((a, b) => seeds[a].score - seeds[b].score);
  const cleared = Math.round(WORLD.clusterCount * WORLD.clusterClearedShare);
  f.clusterThreshold.fill(2); // 2 = never cleared in section 2
  order.slice(0, cleared).forEach((c, rank) => {
    f.clusterThreshold[c] = 0.12 + (rank / Math.max(cleared - 1, 1)) * 0.78;
  });

  for (let i = 0; i < n; i++) {
    const s = sites[i];
    f.x[i] = s.x;
    f.y[i] = s.y;
    f.z[i] = s.z;
    f.rot[i] = s.rot;
    f.scale[i] = s.scale;
    f.meters[i] = s.meters;
    f.nativeMesh[i] = s.native;
    f.nativeSlot[i] = meshCount[s.native]++;
    const pm = NATIVE_COUNT + s.pine;
    f.pineMesh[i] = pm;
    f.pineSlot[i] = UNASSIGNED;
    meshCount[pm]++;
    f.jitter[i] = rng();
    let best = 0;
    let bestD = Infinity;
    for (let c = 0; c < seeds.length; c++) {
      const dx = seeds[c].x - s.x;
      const dz = (seeds[c].z - s.z) * 1.4; // stretch clusters along the contour
      const d = dx * dx + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    f.cluster[i] = best;
  }

  for (let m = 0; m < TREE_IDS.length; m++) {
    f.grow.push(new Float32Array(Math.max(meshCount[m], 1)));
    f.hover.push(new Float32Array(Math.max(meshCount[m], 1)));
  }
  for (let i = 0; i < n; i++) f.grow[f.nativeMesh[i]][f.nativeSlot[i]] = 1;
  return f;
}

/** Instance matrix for site i (same for its native and pine instance). */
export function siteMatrix(f: Forest, i: number, out: THREE.Matrix4): THREE.Matrix4 {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), f.rot[i]);
  const s = f.scale[i];
  return out.compose(new THREE.Vector3(f.x[i], f.y[i], f.z[i]), q, new THREE.Vector3(s, s, s));
}

// ---------------------------------------------------------------- per frame

export function updateForest(f: Forest, storyPos: number, now: number, dt: number, instant: boolean) {
  const s2 = clamp(storyPos - SECTION.turn, 0, 1);
  const present = storyPos >= SECTION.conversion - 0.02;
  const outStep = instant ? 1 : dt / TIMING.nativeOut;
  const inStep = instant ? 1 : dt / TIMING.pineIn;
  let anyChange = false;

  for (let i = 0; i < f.count; i++) {
    const thr = f.clusterThreshold[f.cluster[i]] + f.jitter[i] * 0.05;
    let nT = s2 >= thr ? 0 : 1;
    let pT = 0;
    if (present && f.converted[i]) {
      const t = now - f.convertAt[i];
      if (t >= 0) nT = 0;
      if (instant ? t >= 0 : t >= TIMING.pineLag) pT = 1;
    }
    let np = f.nativeP[i];
    let pp = f.pineP[i];
    if (np !== nT) {
      np = nT > np ? Math.min(nT, np + outStep) : Math.max(nT, np - outStep);
      f.nativeP[i] = np;
      f.grow[f.nativeMesh[i]][f.nativeSlot[i]] = easeInOutCubic(np);
      f.meshDirty[f.nativeMesh[i]] = true;
      anyChange = true;
    }
    if (pp !== pT) {
      pp = pT > pp ? Math.min(pT, pp + inStep) : Math.max(pT, pp - inStep);
      f.pineP[i] = pp;
      if (f.pineSlot[i] !== UNASSIGNED) {
        f.grow[f.pineMesh[i]][f.pineSlot[i]] = easeInOutCubic(pp);
        f.meshDirty[f.pineMesh[i]] = true;
      }
      anyChange = true;
    }
  }
  if (anyChange) f.dryDirty = true;
  updateHover(f, dt, instant);
}

function updateHover(f: Forest, dt: number, instant: boolean) {
  const rate = instant ? 1 : dt * 5;
  for (let k = f.hoverActive.length - 1; k >= 0; k--) {
    const h = f.hoverActive[k];
    const isCurrent = f.hovered && f.hovered.mesh === h.mesh && f.hovered.slot === h.slot;
    const arr = f.hover[h.mesh];
    const target = isCurrent ? 1 : 0;
    const v = arr[h.slot];
    const next = target > v ? Math.min(1, v + rate) : Math.max(0, v - rate);
    if (next !== v) {
      arr[h.slot] = next;
      f.hoverDirty[h.mesh] = true;
    }
    if (!isCurrent && next === 0) f.hoverActive.splice(k, 1);
  }
}

export function setHovered(f: Forest, mesh: number, slot: number) {
  if (f.hovered && f.hovered.mesh === mesh && f.hovered.slot === slot) return;
  f.hovered = mesh < 0 ? null : { mesh, slot };
  if (f.hovered && !f.hoverActive.some((h) => h.mesh === mesh && h.slot === slot)) {
    f.hoverActive.push({ mesh, slot });
  }
}

/** Paint the terrain dryness map from current tree state. */
export function paintDryness(f: Forest) {
  if (!f.dryDirty) return;
  f.dryDirty = false;
  dryMapData.fill(0);
  const { minX, maxX, minZ, maxZ } = WORLD.treeArea;
  const sx = DRY_MAP_W / (maxX - minX);
  const sz = DRY_MAP_H / (maxZ - minZ);
  for (let i = 0; i < f.count; i++) {
    const dry = 1 - easeInOutCubic(f.nativeP[i]);
    if (dry <= 0.01) continue;
    const u = Math.floor((f.x[i] - minX) * sx);
    const v = Math.floor((f.z[i] - minZ) * sz);
    for (let dv = -2; dv <= 2; dv++) {
      for (let du = -2; du <= 2; du++) {
        const uu = u + du;
        const vv = v + dv;
        if (uu < 0 || vv < 0 || uu >= DRY_MAP_W || vv >= DRY_MAP_H) continue;
        const r2 = du * du + dv * dv;
        const w = r2 === 0 ? 1 : r2 <= 2 ? 0.6 : r2 <= 5 ? 0.25 : 0;
        const val = Math.round(255 * dry * w);
        const idx = vv * DRY_MAP_W + uu;
        if (val > dryMapData[idx]) dryMapData[idx] = val;
      }
    }
  }
  dryMap.needsUpdate = true;
}

// ---------------------------------------------------------------- picking

export type PickKind = 'native' | 'pine';
export interface PickResult {
  site: number;
  kind: PickKind;
  mesh: number;
  slot: number;
  t: number;
}

/**
 * Analytic picking against each visible tree's canopy sphere — a few µs per
 * thousand trees, far cheaper than triangle raycasts on instanced meshes.
 */
export function pickTree(
  f: Forest,
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  maxT: number,
  kinds: PickKind[] = ['native', 'pine'],
): PickResult | null {
  const wantNative = kinds.includes('native');
  const wantPine = kinds.includes('pine');
  let best: PickResult | null = null;
  let bestT = maxT;
  for (let i = 0; i < f.count; i++) {
    let mesh = -1;
    let kind: PickKind = 'native';
    if (wantPine && f.pineP[i] > 0.6) {
      mesh = f.pineMesh[i];
      kind = 'pine';
    } else if (wantNative && f.nativeP[i] > 0.6) {
      mesh = f.nativeMesh[i];
    }
    if (mesh < 0) continue;
    const g = f.geoms[mesh];
    const s = f.scale[i];
    const r = g.canopyR * s * 0.9;
    const vx = f.x[i] - origin.x;
    const vy = f.y[i] + g.canopyY * s - origin.y;
    const vz = f.z[i] - origin.z;
    const t = vx * dir.x + vy * dir.y + vz * dir.z;
    if (t < 0 || t - r > bestT) continue;
    const d2 = vx * vx + vy * vy + vz * vz - t * t;
    if (d2 < r * r) {
      const tHit = t - Math.sqrt(r * r - d2);
      if (tHit < bestT) {
        bestT = tHit;
        best = { site: i, kind, mesh, slot: kind === 'pine' ? f.pineSlot[i] : f.nativeSlot[i], t: tHit };
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------- conversion

function assignPine(f: Forest, i: number) {
  if (f.pineSlot[i] !== UNASSIGNED) return;
  f.pineSlot[i] = f.pineUsed[f.pineMesh[i]]++;
  f.newPineSites.push(i);
}

/** Convert all native sites within `radius` of (cx, cz), rippling outward. Returns count converted. */
export function convertAround(f: Forest, cx: number, cz: number, radius: number, now: number, instant: boolean) {
  let added = 0;
  const r2 = radius * radius;
  for (let i = 0; i < f.count; i++) {
    if (f.converted[i]) continue;
    const dx = f.x[i] - cx;
    const dz = f.z[i] - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 > r2) continue;
    f.converted[i] = 1;
    assignPine(f, i);
    f.convertAt[i] = instant
      ? now
      : now + (Math.sqrt(d2) / radius) * TIMING.rippleSpread + f.jitter[i] * TIMING.rippleJitter;
    added++;
  }
  f.convertedCount += added;
  return added;
}

/** Convert everything in one sweep from the valley floor up to the ridge. Returns seconds until done. */
export function convertAll(f: Forest, now: number, instant: boolean): number {
  let minM = Infinity;
  let maxM = -Infinity;
  for (let i = 0; i < f.count; i++) {
    minM = Math.min(minM, f.meters[i]);
    maxM = Math.max(maxM, f.meters[i]);
  }
  for (let i = 0; i < f.count; i++) {
    if (f.converted[i]) continue;
    f.converted[i] = 1;
    assignPine(f, i);
    const along = (f.meters[i] - minM) / Math.max(maxM - minM, 1);
    f.convertAt[i] = instant ? now : now + along * TIMING.sweep + f.jitter[i] * 0.35;
  }
  f.convertedCount = f.count;
  return instant ? 0 : TIMING.sweep + 0.35 + TIMING.pineLag + TIMING.pineIn;
}

/** A random unconverted site inside the section-3 view (keyboard "convert a patch"). */
export function randomUnconvertedSite(f: Forest, rng: () => number): number {
  for (let tries = 0; tries < 400; tries++) {
    const i = Math.floor(rng() * f.count);
    if (!f.converted[i] && Math.abs(f.x[i]) < 150 && f.z[i] < 10) return i;
  }
  for (let i = 0; i < f.count; i++) if (!f.converted[i]) return i;
  return -1;
}
