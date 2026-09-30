import { useMemo } from 'react';
import * as THREE from 'three';
import type { Heightfield } from './heightfield';
import { createTerrainMaterial } from './terrainMaterial';
import { createNoise2D } from '../../lib/noise';
import { smoothstep } from '../../lib/math';
import { WORLD } from '../config';

// Ground palette (placeholder — tune alongside tokens.css)
const C = {
  valley: new THREE.Color('#8a9463'),
  forestFloor: new THREE.Color('#5c6843'),
  meadow: new THREE.Color('#8d8c63'),
  rock: new THREE.Color('#7d776c'),
  snow: new THREE.Color('#eef1ef'),
  water: new THREE.Color('#8ea5a4'),
};

export function buildTerrainGeometry(hf: Heightfield): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(hf.size, hf.size, hf.res - 1, hf.res - 1);
  geo.rotateX(-Math.PI / 2);
  geo.deleteAttribute('uv');
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const noise = createNoise2D(WORLD.seed + 99);
  const n = new THREE.Vector3();
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const h = hf.heights[i];
    pos.setY(i, h);
    const x = pos.getX(i);
    const z = pos.getZ(i);
    hf.normalAt(x, z, n);
    const v = noise(x * 0.05, z * 0.05);

    c.copy(C.valley).lerp(C.forestFloor, smoothstep(6, 30, h));
    c.lerp(C.meadow, smoothstep(105, 135, h));
    c.lerp(C.rock, smoothstep(0.8, 0.6, n.y) * 0.85);
    c.lerp(C.snow, smoothstep(175 + v * 25, 215 + v * 25, h) * smoothstep(0.45, 0.7, n.y));
    c.lerp(C.water, smoothstep(1.2, -1.5, h));
    c.multiplyScalar(1 + v * 0.06);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

export function Terrain({ heightfield }: { heightfield: Heightfield }) {
  const geometry = useMemo(() => buildTerrainGeometry(heightfield), [heightfield]);
  const material = useMemo(() => createTerrainMaterial(), []);
  return <mesh geometry={geometry} material={material} />;
}
