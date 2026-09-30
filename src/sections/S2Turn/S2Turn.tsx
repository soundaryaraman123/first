import { useRef } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import styles from './S2Turn.module.css';

export function S2Turn({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress(ref, index);
  return (
    <section ref={ref} id="the-turn" className={styles.section}>
      <h2>the-turn</h2>
    </section>
  );
}
