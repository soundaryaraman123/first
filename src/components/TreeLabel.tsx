import { useEffect, useRef } from 'react';
import styles from './TreeLabel.module.css';
import { labelBridge } from '../scene/interaction/labelBridge';

/**
 * Floating name label for the tree under the pointer. Positioned every
 * frame by scene/interaction/SceneInteraction.tsx through labelBridge —
 * direct DOM writes, no React re-render per frame.
 */
export function TreeLabel() {
  const ref = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLSpanElement>(null);
  const commonRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    labelBridge.el = ref.current;
    labelBridge.local = localRef.current;
    labelBridge.common = commonRef.current;
    return () => {
      labelBridge.el = null;
    };
  }, []);
  return (
    <div ref={ref} className={styles.label} aria-hidden="true">
      <span ref={localRef} className={styles.local} />
      <span ref={commonRef} className={styles.common} />
    </div>
  );
}
