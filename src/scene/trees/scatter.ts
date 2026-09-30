/**
 * Seeded tree placement on the terrain.
 *
 * Jittered-grid sampling over WORLD.treeArea, rejecting:
 *   - steep faces (surface normal Y below WORLD.minNormalY)
 *   - the river channel and the bare upper ridge (WORLD.treeHeightRange)
 *   - natural gaps from a low-frequency density noise
 * Species are chosen per site from altitude band (content/species.ts),
 * a moisture proxy (terrain concavity) and patchy abundance noise.
 */
import * as THREE from 'three';
import { NATIVE_TREES, species } from '../../content/species';
import { createNoise2D } from '../../lib/noise';
import { mulberry32, weightedIndex, range } from '../../lib/random';
import { clamp, smoothstep } from '../../lib/math';
import type { Tier } from '../../lib/device';
import { WORLD } from '../config';
import type { Heightfield } from '../terrain/heightfield';
import { TREE_VISUALS } from './speciesVisuals';

export interface Site {
  x: number;
  y: number;
  z: number;
  rot: number;
  scale: number;
  native: number; // index into NATIVE_TREES
  pine: number; // 0 chir, 1 blue
  meters: number;
}

/** soft membership of an altitude band, with 250 m feathered edges */
function bandFit(m: number, [lo, hi]: [number, number]) {
  return smoothstep(lo - 250, lo + 100, m) * (1 - smoothstep(hi - 100, hi + 250, m));
}

export function scatterTrees(hf: Heightfield, tier: Tier): Site[] {
  const rng = mulberry32(WORLD.seed + 404);
  const density = createNoise2D(WORLD.seed + 5);
  const patch = createNoise2D(WORLD.seed + 6);
  const { minX, maxX, minZ, maxZ } = WORLD.treeArea;
  const target = WORLD.treeCount[tier];
  const area = (maxX - minX) * (maxZ - minZ);
  // over-sample; rejections typically remove ~40%
  const cell = Math.sqrt(area / (target * 1.9));
  const normal = new THREE.Vector3();
  const weights = new Float32Array(NATIVE_TREES.length);
  const sites: Site[] = [];

  for (let z = minZ; z < maxZ; z += cell) {
    for (let x = minX; x < maxX; x += cell) {
      const px = x + rng() * cell;
      const pz = z + rng() * cell;
      const h = hf.heightAt(px, pz);
      const [hMin, hMax] = WORLD.treeHeightRange;
      if (h < hMin || h > hMax + rng() * 8) continue;
      hf.normalAt(px, pz, normal);
      if (normal.y < WORLD.minNormalY) continue;
      // natural clearings
      const d = density(px * 0.02, pz * 0.02) + density(px * 0.07, pz * 0.07) * 0.3;
      if (d < -0.7) continue;
      // thin out toward the side edges of the forested area
      const edge = smoothstep(maxX, maxX - 40, Math.abs(px));
      if (rng() > edge) continue;

      const meters = WORLD.heightToMeters(h);
      const moisture = clamp(hf.concavityAt(px, pz) / 4, -1, 1);
      for (let i = 0; i < NATIVE_TREES.length; i++) {
        const id = NATIVE_TREES[i];
        const vis = TREE_VISUALS[id];
        const fit = bandFit(meters, species[id].altitudeM);
        const wet = 1 + vis.moisture * moisture * 0.9;
        const patchy = 0.45 + 0.9 * (0.5 + 0.5 * patch(px * 0.025 + i * 17.3, pz * 0.025 - i * 9.1));
        weights[i] = Math.max(0, vis.weight * fit * wet * patchy);
      }
      const native = weightedIndex(rng, weights);
      if (native < 0) continue;
      const vis = TREE_VISUALS[NATIVE_TREES[native]];
      sites.push({
        x: px,
        y: h - 0.15,
        z: pz,
        rot: rng() * Math.PI * 2,
        scale: range(rng, vis.scale[0], vis.scale[1]),
        native,
        pine: meters > WORLD.bluePineAboveM ? 1 : 0,
        meters,
      });
    }
  }

  // deterministic down-sample to the target count
  while (sites.length > target) {
    const i = Math.floor(rng() * sites.length);
    sites[i] = sites[sites.length - 1];
    sites.pop();
  }
  return sites;
}
