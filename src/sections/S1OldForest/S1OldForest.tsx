import { useRef } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import { oldForest } from '../../content/oldForest';
import { NATIVE_TREES, species } from '../../content/species';
import { TREE_VISUALS } from '../../scene/trees/speciesVisuals';
import { OverlayPanel } from '../../components/OverlayPanel';
import { DraftTag } from '../../components/DraftTag';
import styles from './S1OldForest.module.css';

/**
 * Section 1 — The old forest. The camera descends to the mixed forest
 * (cameraPath.ts, keys 1.0–1.75); these panels scroll over it.
 * Tree hover/labels are handled in scene/interaction/SceneInteraction.tsx.
 */
export function S1OldForest({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress(ref, index);
  const last = oldForest.blocks.length - 1;

  return (
    <section ref={ref} id="old-forest" className={styles.section} aria-labelledby="old-forest-title">
      {oldForest.blocks.map((block, i) => (
        <div key={block.title} className={styles.slot}>
          <OverlayPanel align={i % 2 ? 'right' : 'left'} as="article">
            {i === 0 && (
              <h2 id="old-forest-title" className={styles.sectionTitle}>
                {oldForest.heading}
              </h2>
            )}
            <h3 className={styles.blockTitle}>{block.title}</h3>
            <p>
              {block.body}
              {i < last && <DraftTag />}
            </p>
            {i === last && (
              <ul className={styles.legend} aria-label="Trees of the old forest">
                {NATIVE_TREES.map((id) => (
                  <li key={id}>
                    <span
                      className={styles.swatch}
                      style={{ background: TREE_VISUALS[id].colors.accent ?? TREE_VISUALS[id].colors.canopy }}
                      aria-hidden="true"
                    />
                    <span className={styles.local}>{species[id].localName}</span>
                    <span className={styles.common}>{species[id].commonName}</span>
                  </li>
                ))}
              </ul>
            )}
          </OverlayPanel>
        </div>
      ))}
    </section>
  );
}
