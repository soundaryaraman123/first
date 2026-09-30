import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStore } from '../../state/scrollStore';
import { useUiStore } from '../../state/uiStore';
import { mulberry32 } from '../../lib/random';
import { TREE_IDS } from './speciesVisuals';
import { createTreeMaterial, treeUniforms } from './treeMaterial';
import { now } from '../interaction/conversionActions';
import { paintDryness, siteMatrix, updateForest, type Forest as ForestData } from './forestState';

/** One InstancedMesh per species (7 native + 2 pines), driven by typed-array state. */
export function Forest({ forest }: { forest: ForestData }) {
  const material = useMemo(() => createTreeMaterial(), []);

  const meshes = useMemo(() => {
    const rng = mulberry32(99);
    const m4 = new THREE.Matrix4();
    const color = new THREE.Color();
    const list = TREE_IDS.map((id, m) => {
      const geometry = forest.geoms[m].geometry.clone();
      const count = forest.meshCount[m];
      const mesh = new THREE.InstancedMesh(geometry, material, Math.max(count, 1));
      mesh.name = `trees:${id}`;
      mesh.count = count;
      mesh.frustumCulled = false;
      const growAttr = new THREE.InstancedBufferAttribute(forest.grow[m], 1);
      growAttr.setUsage(THREE.DynamicDrawUsage);
      const hoverAttr = new THREE.InstancedBufferAttribute(forest.hover[m], 1);
      hoverAttr.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute('aGrow', growAttr);
      geometry.setAttribute('aHover', hoverAttr);
      return mesh;
    });
    for (let i = 0; i < forest.count; i++) {
      siteMatrix(forest, i, m4);
      // subtle per-tree brightness/hue variation
      const b = 0.86 + rng() * 0.26;
      color.setRGB(b * (0.97 + rng() * 0.06), b, b * (0.95 + rng() * 0.06));
      const nm = list[forest.nativeMesh[i]];
      nm.setMatrixAt(forest.nativeSlot[i], m4);
      nm.setColorAt(forest.nativeSlot[i], color);
      const pm = list[forest.pineMesh[i]];
      pm.setMatrixAt(forest.pineSlot[i], m4);
      pm.setColorAt(forest.pineSlot[i], color);
    }
    for (const mesh of list) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    return list;
  }, [forest, material]);

  useEffect(
    () => () => {
      meshes.forEach((m) => m.geometry.dispose());
      material.dispose();
    },
    [meshes, material],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    treeUniforms.uTime.value = state.clock.elapsedTime;
    const { storyPos } = useScrollStore.getState();
    const { reducedMotion } = useUiStore.getState();
    treeUniforms.uWind.value = reducedMotion ? 0 : 1;
    updateForest(forest, storyPos, now(), dt, reducedMotion);
    for (let m = 0; m < meshes.length; m++) {
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
    </>
  );
}
