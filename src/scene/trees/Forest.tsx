import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStore } from '../../state/scrollStore';
import { useUiStore } from '../../state/uiStore';
import { mulberry32 } from '../../lib/random';
import { NATIVE_COUNT, TREE_IDS } from './speciesVisuals';
import { createTreeMaterial, treeUniforms } from './treeMaterial';
import { createOutlineMaterial, makeHullGeometry, setOutlineResolution } from '../outline';
import { now } from '../interaction/conversionActions';
import { RENDER } from '../config';
import { paintDryness, siteMatrix, updateForest, type Forest as ForestData } from './forestState';

const size = new THREE.Vector2();

/**
 * One cel-shaded InstancedMesh per species (7 native + 2 pines), each with an
 * ink-outline twin that shares its instance matrices and grow/hover buffers.
 * Pine instances are written only when a site converts (see forestState).
 */
export function Forest({ forest }: { forest: ForestData }) {
  const tier = useUiStore((s) => s.tier);

  const { meshes, outlines, colors, materials, outlineMaterial } = useMemo(() => {
    const rng = mulberry32(99);
    const m4 = new THREE.Matrix4();
    const outlineMaterial = createOutlineMaterial({ tree: true });
    const materials = TREE_IDS.map((id) => createTreeMaterial(id));
    const meshes: THREE.InstancedMesh[] = [];
    const outlines: THREE.InstancedMesh[] = [];

    TREE_IDS.forEach((id, m) => {
      const geometry = forest.geoms[m].geometry.clone();
      const capacity = Math.max(forest.meshCount[m], 1);
      const mesh = new THREE.InstancedMesh(geometry, materials[m], capacity);
      mesh.name = `trees:${id}`;
      mesh.frustumCulled = false;
      const growAttr = new THREE.InstancedBufferAttribute(forest.grow[m], 1).setUsage(THREE.DynamicDrawUsage);
      const hoverAttr = new THREE.InstancedBufferAttribute(forest.hover[m], 1).setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute('aGrow', growAttr);
      geometry.setAttribute('aHover', hoverAttr);
      mesh.setColorAt(0, new THREE.Color(1, 1, 1)); // allocate instanceColor
      meshes.push(mesh);

      if (RENDER.treeOutlines[tier]) {
        const hull = makeHullGeometry(forest.geoms[m].geometry);
        hull.setAttribute('aGrow', growAttr);
        hull.setAttribute('aHover', hoverAttr);
        const outline = new THREE.InstancedMesh(hull, outlineMaterial, capacity);
        outline.name = `outline:${id}`;
        outline.instanceMatrix = mesh.instanceMatrix; // shared buffer
        outline.frustumCulled = false;
        outlines.push(outline);
      }
    });

    // per-tree brightness/hue variation; pines reuse the same values when they appear
    const colors = new Float32Array(forest.count * 3);
    for (let i = 0; i < forest.count; i++) {
      const b = 0.9 + rng() * 0.2;
      colors[i * 3] = b * (0.97 + rng() * 0.06);
      colors[i * 3 + 1] = b;
      colors[i * 3 + 2] = b * (0.95 + rng() * 0.06);
    }
    const c = new THREE.Color();
    for (let i = 0; i < forest.count; i++) {
      siteMatrix(forest, i, m4);
      const nm = meshes[forest.nativeMesh[i]];
      nm.setMatrixAt(forest.nativeSlot[i], m4);
      nm.setColorAt(forest.nativeSlot[i], c.fromArray(colors, i * 3));
    }
    meshes.forEach((mesh, m) => {
      // natives are all drawn; pines only as they're assigned
      mesh.count = m >= NATIVE_COUNT ? forest.pineUsed[m] : forest.meshCount[m];
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    return { meshes, outlines, colors, materials, outlineMaterial };
  }, [forest, tier]);

  useEffect(
    () => () => {
      meshes.forEach((m) => m.geometry.dispose());
      outlines.forEach((m) => m.geometry.dispose());
      materials.forEach((m) => m.dispose());
      outlineMaterial.dispose();
    },
    [meshes, outlines, materials, outlineMaterial],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    treeUniforms.uTime.value = state.clock.elapsedTime;
    state.gl.getDrawingBufferSize(size);
    setOutlineResolution(size.x, size.y);
    const { storyPos } = useScrollStore.getState();
    const { reducedMotion } = useUiStore.getState();
    treeUniforms.uWind.value = reducedMotion ? 0 : 1;

    writeNewPines(forest, meshes, colors);
    updateForest(forest, storyPos, now(), dt, reducedMotion);

    for (let m = 0; m < meshes.length; m++) {
      if (outlines[m]) outlines[m].count = meshes[m].count;
      if (forest.meshDirty[m]) {
        (meshes[m].geometry.getAttribute('aGrow') as THREE.BufferAttribute).needsUpdate = true;
        forest.meshDirty[m] = false;
      }
      if (forest.hoverDirty[m]) {
        (meshes[m].geometry.getAttribute('aHover') as THREE.BufferAttribute).needsUpdate = true;
        forest.hoverDirty[m] = false;
      }
    }
    paintDryness(forest); // no-op unless something changed
  });

  return (
    <>
      {meshes.map((mesh) => (
        <primitive key={mesh.name} object={mesh} />
      ))}
      {outlines.map((mesh) => (
        <primitive key={mesh.name} object={mesh} />
      ))}
    </>
  );
}

const m4 = new THREE.Matrix4();
const col = new THREE.Color();

/** Write matrices for pine instances assigned since last frame and grow the draw count. */
function writeNewPines(forest: ForestData, meshes: THREE.InstancedMesh[], colors: Float32Array) {
  if (!forest.newPineSites.length) return;
  const touched = new Set<number>();
  for (const i of forest.newPineSites) {
    const m = forest.pineMesh[i];
    const slot = forest.pineSlot[i];
    siteMatrix(forest, i, m4);
    meshes[m].setMatrixAt(slot, m4);
    meshes[m].setColorAt(slot, col.fromArray(colors, i * 3));
    touched.add(m);
  }
  forest.newPineSites.length = 0;
  for (const m of touched) {
    meshes[m].count = forest.pineUsed[m];
    meshes[m].instanceMatrix.needsUpdate = true;
    if (meshes[m].instanceColor) meshes[m].instanceColor.needsUpdate = true;
  }
}
