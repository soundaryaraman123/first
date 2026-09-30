import { useRef } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import styles from './S4WhatChanged.module.css';

export function S4WhatChanged({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress(ref, index);
  return (
    <section ref={ref} id="what-changed" className={styles.section}>
      <h2>what-changed</h2>
    </section>
  );
}
