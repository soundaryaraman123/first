import { useRef } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import styles from './S3Conversion.module.css';

export function S3Conversion({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress(ref, index);
  return (
    <section ref={ref} id="the-conversion" className={styles.section}>
      <h2>the-conversion</h2>
    </section>
  );
}
