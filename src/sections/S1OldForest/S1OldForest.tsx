import { useRef } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import styles from './S1OldForest.module.css';

export function S1OldForest({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress(ref, index);
  return (
    <section ref={ref} id="old-forest" className={styles.section}>
      <h2>old-forest</h2>
    </section>
  );
}
