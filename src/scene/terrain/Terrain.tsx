import { useMemo } from 'react';
import * as THREE from 'three';
import type { Heightfield } from './heightfield';
import { createTerrainMaterial } from './terrainMaterial';
import { createOutlineMaterial } from '../outline';
import { createNoise2D } from '../../lib/noise';
import { WORLD } from '../config';

/**
 * Terrain mesh. Colours are computed in the shader from palette.ts; the
 * geometry only carries a small noise value (`aVar`) that breaks up the
 * colour bands. The same geometry drawn as an inverted hull gives the ink
 * lines along ridges and hill silhouettes.
 */
export function buildTerrainGeometry(hf: Heightfield): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(hf.size, hf.size, hf.res - 1, hf.res - 1);
  geo.rotateX(-Math.PI / 2);
  geo.deleteAttribute('uv');
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const variation = new Float32Array(pos.count);
  const noise = createNoise2D(WORLD.seed + 99);
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, hf.heights[i]);
    variation[i] = noise(pos.getX(i) * 0.05, pos.getZ(i) * 0.05);
  }
  geo.setAttribute('aVar', new THREE.BufferAttribute(variation, 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

export function Terrain({ heightfield }: { heightfield: Heightfield }) {
  const geometry = useMemo(() => buildTerrainGeometry(heightfield), [heightfield]);
  const material = useMemo(() => createTerrainMaterial(), []);
  const outline = useMemo(() => createOutlineMaterial({ widthScale: 1.25, fade: [80, 700] }), []);
  return (
    <>
      <mesh geometry={geometry} material={material} />
      <mesh geometry={geometry} material={outline} />
    </>
  );
}
