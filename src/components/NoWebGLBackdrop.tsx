import { useScrollStore } from '../state/scrollStore';
import { site } from '../content/site';
import { FallbackLandscape, type FallbackVariant } from './FallbackLandscape';
import styles from './NoWebGLBackdrop.module.css';

/**
 * Static illustrated backdrop used when WebGL is unavailable. One still per
 * section (cross-faded), with the same copy scrolling over it.
 * Supply real illustrations via site.fallbackImages to replace the placeholders.
 */
const VARIANTS: FallbackVariant[] = ['arrival', 'oldForest', 'turn', 'conversion', 'whatChanged'];

export function NoWebGLBackdrop() {
  const active = useScrollStore((s) => Math.min(s.activeIndex, VARIANTS.length - 1));
  return (
    <>
      <div className={styles.backdrop} aria-hidden="true">
        {VARIANTS.map((v, i) => {
          const src = site.fallbackImages[v];
          return (
            <div key={v} className={styles.layer} data-show={i === active || undefined}>
              {src ? <img src={src} alt="" /> : <FallbackLandscape variant={v} />}
            </div>
          );
        })}
      </div>
      <p className={styles.notice} role="note">
        {site.noWebGLNotice}
      </p>
    </>
  );
}
