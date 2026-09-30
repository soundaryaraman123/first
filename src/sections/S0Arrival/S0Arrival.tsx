import { useRef } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import styles from './S0Arrival.module.css';

export function S0Arrival({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress(ref, index);
  return (
    <section ref={ref} id="arrival" className={styles.section}>
      <h2>arrival</h2>
    </section>
  );
}
