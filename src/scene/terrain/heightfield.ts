/**
 * Heightfield: a square grid of heights with fast sampling and ray casting.
 *
 * Grid layout matches THREE.PlaneGeometry after rotateX(-PI/2):
 *   heights[iz * res + ix]  at  x = -half + ix * cell,  z = -half + iz * cell
 *
 * Ray casting marches the heightfield directly — far cheaper than raycasting
 * a 160k-triangle mesh on every pointer move.
 */
import * as THREE from 'three';
import { createNoise2D, fbm, ridged } from '../../lib/noise';
import { clamp, smoothstep } from '../../lib/math';
import { WORLD } from '../config';

export class Heightfield {
  readonly half: number;
  readonly cell: number;

  constructor(
    readonly size: number,
    readonly res: number,
    readonly heights: Float32Array,
  ) {
    this.half = size / 2;
    this.cell = size / (res - 1);
  }

  heightAt(x: number, z: number): number {
    const fx = clamp((x + this.half) / this.cell, 0, this.res - 1.0001);
    const fz = clamp((z + this.half) / this.cell, 0, this.res - 1.0001);
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const tx = fx - ix;
    const tz = fz - iz;
    const r = this.res;
    const h = this.heights;
    const a = h[iz * r + ix];
    const b = h[iz * r + ix + 1];
    const c = h[(iz + 1) * r + ix];
    const d = h[(iz + 1) * r + ix + 1];
    return (a + (b - a) * tx) * (1 - tz) + (c + (d - c) * tx) * tz;
  }

  normalAt(x: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
    const e = this.cell;
    const hl = this.heightAt(x - e, z);
    const hr = this.heightAt(x + e, z);
    const hd = this.heightAt(x, z - e);
    const hu = this.heightAt(x, z + e);
    return out.set(hl - hr, 2 * e, hd - hu).normalize();
  }

  /** Positive in gullies/hollows, negative on spurs/ridges. Used as a moisture proxy. */
  concavityAt(x: number, z: number, radius = 12): number {
    const h = this.heightAt(x, z);
    const avg =
      (this.heightAt(x - radius, z) +
        this.heightAt(x + radius, z) +
        this.heightAt(x, z - radius) +
        this.heightAt(x, z + radius)) /
      4;
    return avg - h;
  }

  /**
   * Intersect a ray with the terrain. Returns distance along the ray, or -1.
   * `out` receives the hit point.
   */
  raycast(origin: THREE.Vector3, dir: THREE.Vector3, out: THREE.Vector3, maxT = 3000): number {
    let t = 0;
    let prevT = 0;
    const minStep = this.cell * 0.4;
    for (let i = 0; i < 512 && t < maxT; i++) {
      const x = origin.x + dir.x * t;
      const y = origin.y + dir.y * t;
      const z = origin.z + dir.z * t;
      if (Math.abs(x) > this.half || Math.abs(z) > this.half) {
        if (dir.y >= 0 && y > 400) return -1;
      }
      const gap = y - this.heightAt(x, z);
      if (gap < 0) {
        // bisect between prevT and t
        let lo = prevT;
        let hi = t;
        for (let k = 0; k < 10; k++) {
          const mid = (lo + hi) / 2;
          const my = origin.y + dir.y * mid;
          const mh = this.heightAt(origin.x + dir.x * mid, origin.z + dir.z * mid);
          if (my < mh) hi = mid;
          else lo = mid;
        }
        out.copy(dir).multiplyScalar(hi).add(origin);
        return hi;
      }
      prevT = t;
      // slopes here never exceed ~2:1, so stepping by a fraction of the vertical gap is safe
      t += Math.max(minStep, gap * 0.45);
    }
    return -1;
  }

  /** Lowest point across a band of z for each x — used to lay the river and railway. */
  valleyLine(xs: number[], zMin: number, zMax: number, samples = 60): THREE.Vector3[] {
    return xs.map((x) => {
      let bestZ = zMin;
      let bestH = Infinity;
      for (let i = 0; i <= samples; i++) {
        const z = zMin + ((zMax - zMin) * i) / samples;
        const h = this.heightAt(x, z);
        if (h < bestH) {
          bestH = h;
          bestZ = z;
        }
      }
      return new THREE.Vector3(x, bestH, bestZ);
    });
  }
}

/** z of the valley floor for a given x in the procedural terrain. */
export const proceduralValleyZ = (x: number) => 10 * Math.sin(x * 0.011) + 5 * Math.sin(x * 0.029 + 1.3);

/**
 * Procedural ridge-and-valley terrain.
 * Camera looks toward -z: a valley runs left-right near z = 0, the main
 * forested slope rises toward a ridge at z ≈ -175, and higher snowy peaks
 * stand behind it. A gentler slope rises toward the camera (+z).
 */
export function buildProceduralHeights(size: number, res: number, seed: number): Float32Array {
  const n1 = createNoise2D(seed);
  const n2 = createNoise2D(seed + 11);
  const n3 = createNoise2D(seed + 23);
  const heights = new Float32Array(res * res);
  const half = size / 2;
  const cell = size / (res - 1);

  for (let iz = 0; iz < res; iz++) {
    const z = -half + iz * cell;
    for (let ix = 0; ix < res; ix++) {
      const x = -half + ix * cell;
      const d = z - proceduralValleyZ(x);
      let h: number;

      // spurs and gullies running down the main slope
      const spur = Math.sin(x * 0.042 + fbm(n2, x * 0.01, z * 0.01, 2) * 2.2);

      if (d < 0) {
        const t = clamp(-d / 180);
        const crest = 1 + 0.18 * fbm(n1, x * 0.006, 3.1, 3);
        h = 100 * crest * Math.pow(smoothstep(0, 1, t), 1.05);
        h += spur * 6 * Math.sin(Math.PI * t);
      } else {
        const t = clamp(d / 170);
        h = 52 * smoothstep(0, 1, t) * (1 + 0.25 * fbm(n1, x * 0.008, 7.7, 2));
        h += spur * 4 * Math.sin(Math.PI * t);
      }

      // soft river channel
      h -= 3.5 * Math.exp(-(d * d) / 50);

      // general relief, stronger higher up
      const relief = clamp(Math.abs(d) / 120, 0.15, 1);
      h += fbm(n1, x * 0.018, z * 0.018, 4) * 9 * relief;

      // the high range behind the ridge
      const back = smoothstep(-205, -330, z);
      if (back > 0) {
        const peaks = ridged(n3, x * 0.0065, z * 0.0065, 5);
        h += back * (70 + 230 * peaks);
      }

      // lift the far corners so the world edge never shows
      const edge = smoothstep(half * 0.72, half, Math.abs(x));
      h += edge * 90 * (0.6 + 0.4 * fbm(n2, x * 0.01, z * 0.01, 2));

      heights[iz * res + ix] = h;
    }
  }
  return heights;
}

// Build-time check (keys only, nothing imported) so a missing file never causes a 404.
const HAS_HEIGHTMAP = Object.keys(import.meta.glob('/public/terrain/heightmap.png')).length > 0;

/**
 * Loads /terrain/heightmap.png if present (red channel, white = WORLD.heightmapMaxHeight),
 * otherwise builds procedural terrain.
 */
export async function loadHeightfield(res: number): Promise<Heightfield> {
  const size = WORLD.size;
  try {
    const resp = HAS_HEIGHTMAP ? await fetch('/terrain/heightmap.png') : null;
    if (resp?.ok) {
      const bitmap = await createImageBitmap(await resp.blob());
      const canvas = document.createElement('canvas');
      canvas.width = res;
      canvas.height = res;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(bitmap, 0, 0, res, res);
      const data = ctx.getImageData(0, 0, res, res).data;
      const heights = new Float32Array(res * res);
      for (let i = 0; i < res * res; i++) heights[i] = (data[i * 4] / 255) * WORLD.heightmapMaxHeight;
      return new Heightfield(size, res, heights);
    }
  } catch {
    // fall through to procedural
  }
  return new Heightfield(size, res, buildProceduralHeights(size, res, WORLD.seed));
}
