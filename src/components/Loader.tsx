import { useUiStore } from '../state/uiStore';
import { site } from '../content/site';
import styles from './Loader.module.css';

/** Lightweight loading veil shown until the 3D scene reports ready. */
export function Loader() {
  const ready = useUiStore((s) => s.sceneReady);
  return (
    <div className={styles.loader} data-ready={ready} role="status" aria-live="polite" aria-hidden={ready}>
      <svg className={styles.mark} viewBox="0 0 48 48" aria-hidden="true">
        <path d="M6 40 L19 16 L27 29 L33 20 L43 40 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <rect className={styles.blaze} x="17" y="33" width="14" height="4" rx="1" />
      </svg>
      <p>{ready ? '' : site.loading}</p>
    </div>
  );
}
