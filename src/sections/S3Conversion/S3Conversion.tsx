import { useEffect, useRef } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import { setScrollGate, ScrollTrigger } from '../../scroll/scrollController';
import { useUiStore } from '../../state/uiStore';
import { conversion } from '../../content/conversion';
import { convertRandomPatch, startSweep } from '../../scene/interaction/conversionActions';
import { OverlayPanel } from '../../components/OverlayPanel';
import { DraftTag } from '../../components/DraftTag';
import styles from './S3Conversion.module.css';

/**
 * Section 3 — The conversion (signature interaction).
 *
 * Scroll "pins" here: while the conversion is incomplete, a scroll gate
 * (scroll/scrollController.ts) stops the page at the moment this section
 * fills the viewport. The 3D interaction lives in
 * scene/interaction/SceneInteraction.tsx; the buttons here are the keyboard
 * route to the same actions. Once the slope has fully converted the gate
 * lifts and the section continues.
 */
export function S3Conversion({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress(ref, index);
  const touch = useUiStore((s) => s.touch);
  const webgl = useUiStore((s) => s.webgl);
  const fraction = useUiStore((s) => s.convertedFraction);
  const complete = useUiStore((s) => s.conversionComplete);
  const sweeping = useUiStore((s) => s.conversionSweeping);

  // Scroll gate at the top of this section until the conversion is complete.
  useEffect(() => {
    if (!webgl || complete) {
      setScrollGate(null);
      return;
    }
    const update = () => {
      const el = ref.current;
      if (el) setScrollGate(el.getBoundingClientRect().top + window.scrollY);
    };
    update();
    ScrollTrigger.addEventListener('refresh', update);
    return () => {
      ScrollTrigger.removeEventListener('refresh', update);
      setScrollGate(null);
    };
  }, [webgl, complete]);

  // Keep keyboard focus in place when the controls are replaced by the "today" panel.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!complete) return;
    const panel = panelRef.current;
    const lostFocus = !document.activeElement || document.activeElement === document.body;
    if (panel && lostFocus) panel.querySelector<HTMLElement>('h2')?.focus();
  }, [complete]);

  const pct = Math.round(fraction * 100);
  const busy = sweeping || complete;

  return (
    <section ref={ref} id="the-conversion" className={styles.section} aria-labelledby="conversion-title">
      <div className={styles.sticky}>
        <div className={styles.panelWrap} data-ui-panel="">
          <div ref={panelRef} className={styles.panel}>
            {!complete ? (
              <>
                <h2 id="conversion-title" className={styles.title}>
                  {conversion.heading}
                </h2>
                <p className={styles.instructions}>
                  {touch ? conversion.instructions.touch : conversion.instructions.pointer}
                </p>
                <div className={styles.meter}>
                  <div className={styles.meterLabel}>
                    <span>{conversion.convertedLabel}</span>
                    <span aria-hidden="true">{pct}%</span>
                  </div>
                  <div
                    className={styles.bar}
                    role="progressbar"
                    aria-label={conversion.convertedLabel}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                  >
                    <div className={styles.fill} style={{ transform: `scaleX(${fraction})` }} />
                    <div className={styles.threshold} style={{ left: `${conversion.autoSweepAt * 100}%` }} />
                  </div>
                </div>
                <div className={styles.actions}>
                  <button type="button" className={styles.secondary} onClick={convertRandomPatch} disabled={busy}>
                    {conversion.keyboard.convertPatch}
                  </button>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => useUiStore.getState().set({ infoSpecies: 'chirPine' })}
                  >
                    {conversion.keyboard.aboutPine}
                  </button>
                  <button type="button" className={styles.primary} onClick={startSweep} disabled={busy}>
                    {conversion.seeTodayButton}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="conversion-title" className={styles.title} tabIndex={-1}>
                  {conversion.completeHeading}
                </h2>
                <p>
                  {conversion.completeBody} <DraftTag />
                </p>
                <p className={styles.continue}>
                  {conversion.continueCue} <span aria-hidden="true">↓</span>
                </p>
              </>
            )}
          </div>
        </div>
        <p className="visually-hidden" aria-live="polite">
          {complete ? conversion.completeHeading : sweeping ? '' : pct > 0 ? `${pct}% converted` : ''}
        </p>
      </div>
      <div className={styles.after}>
        <OverlayPanel align="right">
          <p className={styles.afterText}>{conversion.afterBody}</p>
        </OverlayPanel>
      </div>
    </section>
  );
}
