/**
 * Pointer interaction with the 3D scene (hover, click/tap, brush).
 *
 *  Section 1–2  hover a native tree → it sways + floating name label
 *               (tap on touch shows the label for a moment)
 *  Section 3    brush follows the cursor on the terrain;
 *               click terrain → convert native trees around the hit point;
 *               click a pine → open its species card
 *
 * Listens on window because the canvas has pointer-events: none.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { World } from '../world';
import { useScrollStore } from '../../state/scrollStore';
import { useUiStore } from '../../state/uiStore';
import { SECTION } from '../../sections/sectionIndex';
import { species, type TreeId } from '../../content/species';
import { pickTree, setHovered, type PickKind } from '../trees/forestState';
import { TREE_IDS } from '../trees/speciesVisuals';
import { pointer, isUiTarget } from './pointer';
import { labelBridge } from './labelBridge';
import { terrainUniforms } from '../terrain/terrainMaterial';
import { updateBrush, flashBrush } from './brush';
import { convertAtPoint } from './conversionActions';

const raycaster = new THREE.Raycaster();
const hit = new THREE.Vector3();
const tmp = new THREE.Vector3();
const ndc = new THREE.Vector2();

/** Story ranges where each interaction is live */
const HOVER_NATIVE = [SECTION.oldForest - 0.2, SECTION.conversion - 0.05] as const;
const CONVERSION = [SECTION.conversion - 0.03, SECTION.conversion + 0.6] as const;

const inRange = (v: number, [a, b]: readonly [number, number]) => v >= a && v < b;

export function SceneInteraction({ world }: { world: World }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const touchLabelUntil = useRef(0);
  const touchSite = useRef(-1);
  const lastLabel = useRef<string>('');

  function rayFrom(clientX: number, clientY: number) {
    ndc.set((clientX / size.width) * 2 - 1, -(clientY / size.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray;
  }

  function showLabel(id: TreeId | null, site = -1) {
    const el = labelBridge.el;
    if (!el) return;
    if (!id || site < 0) {
      el.removeAttribute('data-show');
      lastLabel.current = '';
      return;
    }
    if (lastLabel.current !== id) {
      lastLabel.current = id;
      if (labelBridge.local) labelBridge.local.textContent = species[id].localName;
      if (labelBridge.common) labelBridge.common.textContent = `${species[id].commonName} · ${species[id].scientificName}`;
    }
    const f = world.forest;
    const mesh = TREE_IDS.indexOf(id);
    tmp.set(f.x[site], f.y[site] + f.geoms[mesh].height * f.scale[site], f.z[site]).project(camera);
    const x = (tmp.x * 0.5 + 0.5) * size.width;
    const y = (-tmp.y * 0.5 + 0.5) * size.height;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, calc(-100% - 10px))`;
    el.setAttribute('data-show', '');
  }

  // click / tap
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isUiTarget(e.target)) return;
      const ui = useUiStore.getState();
      if (ui.infoSpecies) return;
      const { storyPos } = useScrollStore.getState();
      const isTouch = pointer.touch;
      const ray = rayFrom(e.clientX, e.clientY);
      const tTerrain = world.heightfield.raycast(ray.origin, ray.direction, hit);
      const maxT = tTerrain > 0 ? tTerrain + 4 : 3000;

      if (inRange(storyPos, CONVERSION)) {
        const pine = pickTree(world.forest, ray.origin, ray.direction, maxT, ['pine']);
        if (pine) {
          ui.set({ infoSpecies: TREE_IDS[pine.mesh] });
          return;
        }
        if (tTerrain > 0) {
          if (isTouch) flashBrush(hit.x, hit.y, hit.z);
          convertAtPoint(hit.x, hit.z);
        }
        return;
      }
      if (isTouch && inRange(storyPos, HOVER_NATIVE)) {
        const p = pickTree(world.forest, ray.origin, ray.direction, maxT, ['native']);
        if (p) {
          setHovered(world.forest, p.mesh, p.slot);
          touchLabelUntil.current = performance.now() + 2500;
          touchSite.current = p.site;
        }
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [world, camera, size]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const { storyPos } = useScrollStore.getState();
    const ui = useUiStore.getState();
    const f = world.forest;
    const canHoverScene = pointer.inside && !pointer.overUi && !pointer.touch && !ui.infoSpecies;

    // --- touch label (timed) ---------------------------------------------
    if (pointer.touch && performance.now() < touchLabelUntil.current && touchSite.current >= 0) {
      showLabel(TREE_IDS[f.nativeMesh[touchSite.current]], touchSite.current);
      updateBrush(dt, false);
      return;
    } else if (pointer.touch && touchSite.current >= 0) {
      touchSite.current = -1;
      setHovered(f, -1, -1);
      showLabel(null);
    }

    const hoverNatives = inRange(storyPos, HOVER_NATIVE);
    const conversionLive = inRange(storyPos, CONVERSION);
    let brushFollow = false;

    if (canHoverScene && (hoverNatives || conversionLive)) {
      const ray = rayFrom(pointer.clientX, pointer.clientY);
      const tTerrain = world.heightfield.raycast(ray.origin, ray.direction, hit);
      const maxT = tTerrain > 0 ? tTerrain + 4 : 3000;
      const kinds: PickKind[] = conversionLive ? ['pine'] : ['native'];
      const p = pickTree(f, ray.origin, ray.direction, maxT, kinds);
      if (p) {
        setHovered(f, p.mesh, p.slot);
        showLabel(TREE_IDS[p.mesh], p.site);
      } else {
        setHovered(f, -1, -1);
        showLabel(null);
      }
      document.body.style.cursor = conversionLive ? (p ? 'pointer' : 'crosshair') : '';
      if (conversionLive && !p && tTerrain > 0 && !ui.conversionComplete && !ui.conversionSweeping) {
        terrainUniforms.uBrushPos.value.copy(hit);
        brushFollow = true;
      }
    } else if (f.hovered || lastLabel.current) {
      setHovered(f, -1, -1);
      showLabel(null);
      document.body.style.cursor = '';
    }
    updateBrush(dt, brushFollow);
  });

  return null;
}
