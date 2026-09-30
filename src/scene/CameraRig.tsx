import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStore } from '../state/scrollStore';
import { useUiStore } from '../state/uiStore';
import { smoothstep, lerp } from '../lib/math';
import { cameraPath, reducedMotionStills, POINTER_PARALLAX, type CameraKey } from './cameraPath';
import { pointer } from './interaction/pointer';

const pos = new THREE.Vector3();
const target = new THREE.Vector3();
const smoothPos = new THREE.Vector3();
const smoothTarget = new THREE.Vector3();
let initialised = false;

/** Samples the keyframed camera path at a story position. */
export function sampleCamera(at: number, outPos: THREE.Vector3, outTarget: THREE.Vector3): number {
  const keys = cameraPath;
  if (at <= keys[0].at) return apply(keys[0], keys[0], 0, outPos, outTarget);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (at <= b.at) {
      const raw = (at - a.at) / (b.at - a.at);
      // settle into / out of held keys; glide through the rest
      let eased = raw;
      if (a.hold && b.hold) eased = smoothstep(0, 1, raw);
      else if (a.hold) eased = raw * raw;
      else if (b.hold) eased = 1 - (1 - raw) * (1 - raw);
      return apply(a, b, eased, outPos, outTarget);
    }
  }
  const last = keys[keys.length - 1];
  return apply(last, last, 0, outPos, outTarget);
}

function apply(a: CameraKey, b: CameraKey, t: number, outPos: THREE.Vector3, outTarget: THREE.Vector3) {
  outPos.set(lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t));
  outTarget.set(
    lerp(a.target[0], b.target[0], t),
    lerp(a.target[1], b.target[1], t),
    lerp(a.target[2], b.target[2], t),
  );
  return lerp(a.fov ?? 45, b.fov ?? 45, t);
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  useFrame((_, delta) => {
    const { storyPos, activeIndex } = useScrollStore.getState();
    const { reducedMotion } = useUiStore.getState();
    const at = reducedMotion ? (reducedMotionStills[activeIndex] ?? storyPos) : storyPos;
    const fov = sampleCamera(at, pos, target);

    if (!reducedMotion && POINTER_PARALLAX > 0 && !pointer.touch) {
      pos.x += pointer.ndc.x * POINTER_PARALLAX;
      pos.y += pointer.ndc.y * POINTER_PARALLAX * 0.5;
    }

    // light damping on top of Lenis for a filmic feel; snaps when reduced motion
    const k = reducedMotion || !initialised ? 1 : 1 - Math.exp(-delta * 6);
    smoothPos.lerp(pos, k);
    smoothTarget.lerp(target, k);
    if (!initialised) {
      smoothPos.copy(pos);
      smoothTarget.copy(target);
      initialised = true;
    }
    camera.position.copy(smoothPos);
    camera.lookAt(smoothTarget);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
