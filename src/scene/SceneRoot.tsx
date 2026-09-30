/**
 * The single persistent <Canvas> behind sections 0–4.
 * Lazy-loaded from App.tsx. Its render loop stops once the DOM-only
 * sections cover the viewport (scrollStore.sceneActive).
 */
import { Suspense, use, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useUiStore } from '../state/uiStore';
import { useScrollStore } from '../state/scrollStore';
import { RENDER } from './config';
import { loadWorld } from './world';
import { Atmosphere } from './Atmosphere';
import { CameraRig, cameraCut } from './CameraRig';
import { Terrain } from './terrain/Terrain';
import { Forest } from './trees/Forest';
import { FogLayers } from './fog/FogLayers';
import { Clouds } from './clouds/Clouds';
import { Railway } from './railway/Railway';
import { SceneInteraction } from './interaction/SceneInteraction';
import { installPointer } from './interaction/pointer';
import styles from './SceneRoot.module.css';

function World() {
  const tier = useUiStore((s) => s.tier);
  const world = use(loadWorld(tier));
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    installPointer();
    // let a couple of frames render (shader compile) before lifting the loader
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => useUiStore.getState().set({ sceneReady: true }));
    });
    invalidate();
    return () => cancelAnimationFrame(raf);
  }, [invalidate]);

  return (
    <>
      <CameraRig />
      <Terrain heightfield={world.heightfield} />
      <Forest forest={world.forest} />
      <Railway heightfield={world.heightfield} />
      <Clouds />
      <FogLayers />
      <SceneInteraction world={world} />
    </>
  );
}

/**
 * Reduced motion: instead of flying the camera, fade the canvas out, cut to the
 * next section's still, and fade back in.
 */
function useReducedMotionCuts() {
  const reducedMotion = useUiStore((s) => s.reducedMotion);
  const activeIndex = useScrollStore((s) => s.activeIndex);
  const [cutting, setCutting] = useState(false);
  useEffect(() => {
    if (!reducedMotion || cameraCut.index === activeIndex) return;
    setCutting(true);
    const t1 = window.setTimeout(() => {
      cameraCut.index = activeIndex;
      setCutting(false);
    }, 220);
    return () => window.clearTimeout(t1);
  }, [reducedMotion, activeIndex]);
  return cutting;
}

export default function SceneRoot() {
  const tier = useUiStore((s) => s.tier);
  const sceneActive = useScrollStore((s) => s.sceneActive);
  const cutting = useReducedMotionCuts();

  return (
    <div className={styles.wrap} data-active={sceneActive} data-cut={cutting || undefined} aria-hidden="true">
      <Canvas
        flat
        dpr={[1, RENDER.maxDpr[tier]]}
        frameloop={sceneActive ? 'always' : 'never'}
        camera={{ fov: 42, near: 0.5, far: 4000, position: [0, 150, 250] }}
        gl={{ antialias: RENDER.antialias[tier], powerPreference: 'high-performance' }}
      >
        <Atmosphere />
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </Canvas>
    </div>
  );
}
