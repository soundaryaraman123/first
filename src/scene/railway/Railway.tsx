/**
 * Section 2: a railway line draws itself along the lower valley.
 * A tube along a curve fitted to the valley floor, revealed with drawRange,
 * plus instanced sleepers that appear with it.
 */
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Heightfield } from '../terrain/heightfield';
import { useScrollStore } from '../../state/scrollStore';
import { useUiStore } from '../../state/uiStore';
import { SECTION } from '../../sections/sectionIndex';
import { invLerp } from '../../lib/math';

import { RAILWAY_DRAW } from './railwayTiming';
const RADIAL = 5;
const SEGMENTS = 360;
const SLEEPER_SPACING = 2.4;

export function Railway({ heightfield }: { heightfield: Heightfield }) {
  const { tube, sleepers, totalSleepers } = useMemo(() => {
    const xs: number[] = [];
    for (let x = -340; x <= 340; x += 20) xs.push(x);
    // hug the near bank of the river, a little above the floor
    const pts = heightfield.valleyLine(xs, -60, 60).map((p) => {
      const z = p.z + 13;
      return new THREE.Vector3(p.x, heightfield.heightAt(p.x, z) + 0.6, z);
    });
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    // drape: re-sample heights along the curve so the line sits on the ground
    const dense = curve.getSpacedPoints(200).map((p) => {
      p.y = Math.max(heightfield.heightAt(p.x, p.z), 0) + 0.7;
      return p;
    });
    const draped = new THREE.CatmullRomCurve3(dense, false, 'centripetal');

    const tubeGeo = new THREE.TubeGeometry(draped, SEGMENTS, 0.42, RADIAL, false);
    const tubeMat = new THREE.MeshStandardMaterial({ color: '#3b332c', roughness: 0.7, metalness: 0.2, flatShading: true });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.frustumCulled = false;

    const length = draped.getLength();
    const count = Math.floor(length / SLEEPER_SPACING);
    const sleeperGeo = new THREE.BoxGeometry(2.6, 0.25, 0.55);
    const sleeperMat = new THREE.MeshStandardMaterial({ color: '#6b5139', roughness: 1, flatShading: true });
    const sleepers = new THREE.InstancedMesh(sleeperGeo, sleeperMat, count);
    sleepers.frustumCulled = false;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const tangent = new THREE.Vector3();
    const pos = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(count - 1, 1);
      draped.getPointAt(t, pos);
      draped.getTangentAt(t, tangent);
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(tangent.x, 0, tangent.z).normalize());
      pos.y -= 0.35;
      m.compose(pos, q, new THREE.Vector3(1, 1, 1));
      sleepers.setMatrixAt(i, m);
    }
    sleepers.instanceMatrix.needsUpdate = true;
    sleepers.count = 0;
    return { tube, sleepers, totalSleepers: count };
  }, [heightfield]);

  const totalIndex = tube.geometry.index!.count;
  const perSegment = RADIAL * 6;

  useFrame(() => {
    const { storyPos } = useScrollStore.getState();
    const { reducedMotion } = useUiStore.getState();
    const s2 = storyPos - SECTION.turn;
    let p = invLerp(RAILWAY_DRAW[0], RAILWAY_DRAW[1], s2);
    if (storyPos < SECTION.turn) p = 0;
    if (reducedMotion) p = s2 >= RAILWAY_DRAW[0] ? 1 : 0; // still state instead of drawing
    const segs = Math.floor(p * SEGMENTS);
    tube.visible = segs > 0;
    tube.geometry.setDrawRange(0, Math.min(segs * perSegment, totalIndex));
    sleepers.count = Math.floor(p * totalSleepers);
  });

  return (
    <>
      <primitive object={tube} />
      <primitive object={sleepers} />
    </>
  );
}
