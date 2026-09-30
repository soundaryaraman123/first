import { useRef } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import styles from './S5HealingPlants.module.css';

export function S5HealingPlants({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress(ref, index);
  return (
    <section ref={ref} id="healing-plants" className={styles.section}>
      <h2>healing-plants</h2>
    </section>
  );
}
