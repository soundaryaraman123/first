import { lazy, Suspense, useEffect } from 'react';
import { sections } from './sections/registry';
import { initScroll, destroyScroll, ScrollTrigger } from './scroll/scrollController';
import { useUiStore } from './state/uiStore';
import { site } from './content/site';
import { Loader } from './components/Loader';
import { DebugHud } from './components/DebugHud';
import { debugEnabled } from './lib/device';

// The 3D scene is split into its own chunk and loaded after the page shell.
const SceneRoot = lazy(() => import('./scene/SceneRoot'));

export function App() {
  const webgl = useUiStore((s) => s.webgl);
  const reducedMotion = useUiStore((s) => s.reducedMotion);

  useEffect(() => {
    initScroll(reducedMotion);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => {
      window.removeEventListener('load', onLoad);
      destroyScroll();
    };
  }, [reducedMotion]);

  return (
    <>
      <a className="skip-link" href="#old-forest">
        {site.skipLink}
      </a>
      {webgl && (
        <Suspense fallback={null}>
          <SceneRoot />
        </Suspense>
      )}
      {webgl && <Loader />}
      <main id="content">
        {sections.map(({ id, Component }, index) => (
          <Component key={id} index={index} />
        ))}
      </main>
      {debugEnabled && <DebugHud />}
    </>
  );
}
