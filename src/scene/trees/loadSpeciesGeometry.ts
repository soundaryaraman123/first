/**
 * Tree geometry loader.
 *
 * For each species, looks for /models/<speciesId>.glb (Draco-compressed
 * glTF is fine). If found, its meshes are merged into one geometry for
 * instancing; otherwise the procedural placeholder is used.
 *
 * Model guidelines for Figma/Blender exports:
 *   - base of trunk at the origin, Y up, ~5–9 units tall
 *   - vertex colours preferred; otherwise each mesh's material colour is baked in
 *   - keep it low-poly (a few hundred triangles) — thousands are instanced
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { TreeId } from '../../content/species';
import { buildProceduralTree, describe, type TreeGeometry } from './geometries';

let gltfLoader: GLTFLoader | null = null;
function getLoader() {
  if (!gltfLoader) {
    // three bundles its Draco decoder (self-hosted with the build; no CDN request)
    const draco = new DRACOLoader();
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(draco);
  }
  return gltfLoader;
}

// Build-time list of the .glb files present in /public/models (keys only; nothing is imported).
// Vite re-evaluates this when files are added, so dropping a model in "just works".
const AVAILABLE_MODELS = new Set(
  Object.keys(import.meta.glob('/public/models/*.glb')).map((p) => p.replace('/public', '')),
);

function gltfToGeometry(scene: THREE.Object3D): THREE.BufferGeometry | null {
  const parts: THREE.BufferGeometry[] = [];
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    let g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'color') g.deleteAttribute(name);
    }
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    if (!g.getAttribute('color')) {
      const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
      const col = mat?.color ?? new THREE.Color('#6b7a4f');
      const n = g.getAttribute('position').count;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) arr.set([col.r, col.g, col.b], i * 3);
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    } else if ((g.getAttribute('color') as THREE.BufferAttribute).itemSize === 4) {
      // drop alpha so all parts merge cleanly
      const src = g.getAttribute('color') as THREE.BufferAttribute;
      const arr = new Float32Array(src.count * 3);
      for (let i = 0; i < src.count; i++) arr.set([src.getX(i), src.getY(i), src.getZ(i)], i * 3);
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    }
    parts.push(g);
  });
  if (!parts.length) return null;
  return mergeGeometries(parts, false);
}

export async function loadSpeciesGeometry(id: TreeId): Promise<TreeGeometry> {
  const url = `/models/${id}.glb`;
  if (AVAILABLE_MODELS.has(url)) {
    try {
      const gltf = await getLoader().loadAsync(url);
      const geometry = gltfToGeometry(gltf.scene);
      if (geometry) return describe(geometry);
    } catch (err) {
      console.warn(`[trees] could not load ${url}, using procedural placeholder`, err);
    }
  }
  return buildProceduralTree(id);
}

export async function loadAllSpeciesGeometries(ids: TreeId[]): Promise<TreeGeometry[]> {
  return Promise.all(ids.map((id) => loadSpeciesGeometry(id)));
}
