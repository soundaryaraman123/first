import { useLayoutEffect, useRef, useState } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import { ScrollTrigger } from '../../scroll/scrollController';
import { useUiStore } from '../../state/uiStore';
import { turn } from '../../content/timeline';
import { RAILWAY_DRAW } from '../../scene/railway/Railway';
import { OverlayPanel } from '../../components/OverlayPanel';
import { DraftTag } from '../../components/DraftTag';
import { lerp, invLerp } from '../../lib/math';
import styles from './S2Turn.module.css';

/**
 * Section 2 — The turn. A scroll-scrubbed ledger/timeline:
 *  - the year counter ticks between milestones
 *  - forest clusters sink as the ledger fills (forestState.ts, clusterThreshold)
 *  - the railway draws itself along the valley (scene/railway/Railway.tsx)
 * Progress-driven DOM updates write straight to refs; React only re-renders
 * when the active milestone changes.
 */
const N = turn.milestones.length;
/** where each milestone sits within the section's scroll progress */
const STOPS = turn.milestones.map((_, i) => lerp(0.1, 0.86, i / Math.max(N - 1, 1)));

export function S2Turn({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLParagraphElement>(null);
  const [active, setActive] = useState(-1);
  const reducedMotion = useUiStore((s) => s.reducedMotion);
  useSectionProgress(ref, index);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let current = -2;
    const update = (p: number) => {
      let a = -1;
      for (let i = 0; i < N; i++) if (p >= STOPS[i] - 0.02) a = i;
      if (a !== current) {
        current = a;
        setActive(a);
      }
      // year counter: ticks between milestone years (jumps with reduced motion)
      const ms = turn.milestones;
      let year = ms[0].year;
      if (reducedMotion || a < 0) year = ms[Math.max(a, 0)].year;
      else if (a >= N - 1) year = ms[N - 1].year;
      else year = Math.round(lerp(ms[a].year, ms[a + 1].year, invLerp(STOPS[a], STOPS[a + 1], p)));
      if (yearRef.current) yearRef.current.textContent = String(year);
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${invLerp(STOPS[0], STOPS[N - 1], p)})`;
      if (railRef.current) railRef.current.toggleAttribute('data-show', p > RAILWAY_DRAW[0] && p < 0.98);
    };
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
    update(st.progress);
    return () => st.kill();
  }, [reducedMotion]);

  const current = active >= 0 ? turn.milestones[active] : null;

  return (
    <section ref={ref} id="the-turn" className={styles.section} aria-labelledby="turn-title">
      <div className={styles.intro}>
        <OverlayPanel align="center">
          <h2 id="turn-title" className={styles.title}>
            {turn.heading}
          </h2>
          <p>
            {turn.intro} <DraftTag />
          </p>
        </OverlayPanel>
      </div>

      <div className={styles.sticky}>
        <div className={styles.ledger} data-ui-panel="">
          <div className={styles.counter} aria-hidden="true">
            <span className={styles.circa}>c.</span>
            <span ref={yearRef} className={styles.year}>
              {turn.milestones[0].year}
            </span>
          </div>
          <div className={styles.body}>
            <div className={styles.listWrap}>
              <div className={styles.track} aria-hidden="true">
                <div ref={fillRef} className={styles.fill} />
              </div>
              <ol className={styles.list}>
              {turn.milestones.map((m, i) => (
                <li key={m.title} className={styles.item} data-state={i < active ? 'past' : i === active ? 'active' : 'future'}>
                  <span className={styles.dot} aria-hidden="true" />
                  <span className={styles.itemYear}>c. {m.year}</span>
                  <span className={styles.itemTitle}>{m.title}</span>
                </li>
              ))}
              </ol>
            </div>
            <div className={styles.detail} aria-live="polite">
              {current ? (
                <>
                  <h3 className={styles.detailTitle}>{current.title}</h3>
                  <p>
                    {current.body}
                    {!current.verified && <DraftTag />}
                  </p>
                </>
              ) : (
                <p className={styles.hint}>Scroll to fill in the ledger.</p>
              )}
            </div>
            <p ref={railRef} className={styles.rail}>
              <span className={styles.railIcon} aria-hidden="true" />
              {turn.railwayLabel}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
