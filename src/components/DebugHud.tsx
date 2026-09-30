import { useEffect, useRef } from 'react';
import { useScrollStore } from '../state/scrollStore';

/** ?debug overlay: storyPos, active section and a rough fps meter. Useful when tuning cameraPath.ts. */
export function DebugHud() {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    let fps = 0;
    const tick = (now: number) => {
      frames++;
      if (now - last > 500) {
        fps = (frames * 1000) / (now - last);
        frames = 0;
        last = now;
      }
      const s = useScrollStore.getState();
      if (ref.current) {
        ref.current.textContent =
          `storyPos ${s.storyPos.toFixed(3)}\n` +
          `section  ${s.activeIndex}\n` +
          `scene    ${s.sceneActive ? 'on' : 'paused'}\n` +
          `fps      ${fps.toFixed(0)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <pre
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed', left: 8, bottom: 8, zIndex: 999, margin: 0, padding: '6px 8px',
        font: '11px/1.4 ui-monospace, monospace', background: 'rgb(0 0 0 / 0.7)', color: '#cfe',
        borderRadius: 4, pointerEvents: 'none',
      }}
    />
  );
}
