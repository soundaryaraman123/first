import { useLayoutEffect, useRef } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import { gsap, scrollToElement } from '../../scroll/scrollController';
import { useUiStore } from '../../state/uiStore';
import { site } from '../../content/site';
import { arrival } from '../../content/arrival';
import { ScrollCue } from '../../components/ScrollCue';
import styles from './S0Arrival.module.css';

/**
 * Section 0 — Arrival. The 3D mist and ridge sit behind; this is the DOM
 * title card. The title fades up and away as you scroll (the mist lifts
 * in FogLayers.tsx on the same scroll range).
 */
export function S0Arrival({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useUiStore((s) => s.reducedMotion);
  useSectionProgress(ref, index);

  useLayoutEffect(() => {
    if (reducedMotion || !titleRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(titleRef.current, {
        opacity: 0,
        y: -80,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: '45% top', scrub: true },
      });
      gsap.to(cueRef.current, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: '15% top', scrub: true },
      });
    });
    return () => ctx.revert();
  }, [reducedMotion]);

  const next = () => {
    const el = document.getElementById('old-forest');
    if (el) scrollToElement(el);
  };

  return (
    <section ref={ref} id="arrival" className={styles.section} aria-labelledby="arrival-title">
      <div className={styles.sticky}>
        <div ref={titleRef} className={styles.titleBlock}>
          <p className={styles.eyebrow}>
            {arrival.eyebrow} · {site.regionName}
          </p>
          <h1 id="arrival-title" className={styles.title}>
            {site.title}
          </h1>
          <p className={styles.subtitle}>{site.subtitle}</p>
        </div>
        <div ref={cueRef} className={styles.cue}>
          <ScrollCue label={site.scrollCue} onClick={next} />
        </div>
      </div>
    </section>
  );
}
