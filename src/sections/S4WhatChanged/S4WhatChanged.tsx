import { useCallback, useEffect, useRef, useState } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import { useUiStore } from '../../state/uiStore';
import { comparison } from '../../content/comparison';
import { OverlayPanel } from '../../components/OverlayPanel';
import { DraftTag } from '../../components/DraftTag';
import { clamp } from '../../lib/math';
import { OakScene, PineScene } from './illustrations';
import { DropletSim } from './dropletSim';
import styles from './S4WhatChanged.module.css';

/**
 * Section 4 — What changed. Oak (left) vs pine (right) with a draggable
 * divider (pointer drag, or arrow keys on the focused handle), droplets on a
 * 2D canvas, and a comparison table.
 */
export function S4WhatChanged({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dividerRef = useRef(0.5);
  const [divider, setDivider] = useState(0.5);
  const reducedMotion = useUiStore((s) => s.reducedMotion);
  useSectionProgress(ref, index);

  const setFromClientX = useCallback((clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const v = clamp((clientX - rect.left) / rect.width, 0.04, 0.96);
    dividerRef.current = v;
    setDivider(v);
  }, []);

  // --- drag handling --------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if ((e.target as Element).hasPointerCapture(e.pointerId)) setFromClientX(e.clientX);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.03;
    let v = dividerRef.current;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += step;
    else if (e.key === 'Home') v = 0.04;
    else if (e.key === 'End') v = 0.96;
    else return;
    e.preventDefault();
    v = clamp(v, 0.04, 0.96);
    dividerRef.current = v;
    setDivider(v);
  };

  // --- droplet canvas: runs only while visible ---------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sim = new DropletSim(ctx);
    let raf = 0;
    let last = 0;
    let visible = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = stage.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (reducedMotion) sim.drawStill(canvas.width, canvas.height, dividerRef.current);
    };
    const loop = (t: number) => {
      const dt = Math.min((t - last) / 1000, 1 / 20);
      last = t;
      sim.step(dt, dividerRef.current);
      sim.draw(canvas.width, canvas.height, dividerRef.current);
      if (visible) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reducedMotion) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    io.observe(stage);
    resize();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [reducedMotion]);

  // redraw the still frame when the divider moves in reduced-motion mode
  useEffect(() => {
    if (!reducedMotion) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) new DropletSim(ctx).drawStill(canvas.width, canvas.height, divider);
  }, [divider, reducedMotion]);

  const pct = Math.round(divider * 100);

  return (
    <section ref={ref} id="what-changed" className={styles.section} aria-labelledby="what-changed-title">
      <div className={styles.inner}>
        <OverlayPanel align="center" className={styles.panel}>
          <h2 id="what-changed-title" className={styles.title}>
            {comparison.heading}
          </h2>
          <p className={styles.intro}>{comparison.intro}</p>

          <div ref={stageRef} className={styles.stage}>
            <div className={styles.layer}>
              <OakScene />
            </div>
            <div className={styles.layer} style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
              <PineScene />
            </div>
            <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
            <span className={`${styles.tag} ${styles.tagLeft}`}>{comparison.oak.title}</span>
            <span className={`${styles.tag} ${styles.tagRight}`}>{comparison.pine.title}</span>
            <div
              className={styles.divider}
              style={{ left: `${divider * 100}%` }}
              role="slider"
              tabIndex={0}
              aria-label={comparison.sliderLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={`${pct}% oak forest shown`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onKeyDown={onKeyDown}
            >
              <span className={styles.handle} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M9 6 L3 12 L9 18 M15 6 L21 12 L15 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
          <div className={styles.captions}>
            <p>{comparison.oak.caption}</p>
            <p>{comparison.pine.caption}</p>
          </div>

          <table className={styles.table}>
            <caption className="visually-hidden">Oak forest compared with pine forest</caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">Topic</span>
                </th>
                <th scope="col" className={styles.oakHead}>
                  {comparison.oak.title}
                </th>
                <th scope="col" className={styles.pineHead}>
                  {comparison.pine.title}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.topic}>
                  <th scope="row">{row.topic}</th>
                  <td>{row.oak}</td>
                  <td>{row.pine}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.note}>
            General patterns, not measurements of this valley. <DraftTag />
          </p>
        </OverlayPanel>
      </div>
    </section>
  );
}
