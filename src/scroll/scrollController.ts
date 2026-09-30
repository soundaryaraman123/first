/**
 * Lenis <-> GSAP ScrollTrigger wiring, plus the section-3 "scroll gate".
 *
 * - Lenis drives smooth scrolling from GSAP's ticker so ScrollTrigger and
 *   Lenis share one clock.
 * - With reduced motion we skip Lenis entirely and use native scrolling.
 * - The gate: while section 3's conversion is incomplete, scrolling past
 *   `gateY` (the moment section 3 fills the viewport) is blocked. Scrolling
 *   back up is always allowed.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let gateY: number | null = null;
let tickerFn: ((time: number) => void) | null = null;

function currentScroll() {
  return lenis ? lenis.scroll : window.scrollY;
}

function clampToGate() {
  if (gateY === null) return;
  if (currentScroll() > gateY + 1) {
    if (lenis) lenis.scrollTo(gateY, { immediate: true, force: true });
    else window.scrollTo(0, gateY);
  }
}

export function initScroll(reducedMotion: boolean) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  if (!reducedMotion) {
    lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      // Block downward wheel/touch input at the gate, before Lenis animates past it.
      virtualScroll: (e) => !(gateY !== null && e.deltaY > 0 && currentScroll() >= gateY - 2),
    });
    lenis.on('scroll', () => {
      clampToGate();
      ScrollTrigger.update();
    });
    tickerFn = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);
  }
  // Keyboard, scrollbar drag and native scrolling are caught here.
  window.addEventListener('scroll', clampToGate, { passive: true });
  // Touch scrolling is native (Lenis doesn't smooth touch): stop upward swipes at the
  // gate up front rather than snapping back after overshooting.
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
}

let touchY = 0;
function onTouchStart(e: TouchEvent) {
  touchY = e.touches[0]?.clientY ?? 0;
}
function onTouchMove(e: TouchEvent) {
  if (gateY === null || !e.cancelable) return;
  const y = e.touches[0]?.clientY ?? touchY;
  const scrollingDown = touchY - y > 0;
  if (scrollingDown && currentScroll() >= gateY - 2) e.preventDefault();
}

export function destroyScroll() {
  window.removeEventListener('scroll', clampToGate);
  window.removeEventListener('touchstart', onTouchStart);
  window.removeEventListener('touchmove', onTouchMove);
  if (tickerFn) gsap.ticker.remove(tickerFn);
  lenis?.destroy();
  lenis = null;
  tickerFn = null;
}

export function setScrollGate(y: number | null) {
  gateY = y;
  clampToGate();
}

export function scrollToY(y: number, immediate = false) {
  if (lenis) lenis.scrollTo(y, { immediate, duration: 1.6 });
  else window.scrollTo({ top: y, behavior: 'auto' });
}

export function scrollToElement(el: HTMLElement, immediate = false) {
  const y = el.getBoundingClientRect().top + currentScroll();
  scrollToY(y, immediate);
}

export { ScrollTrigger, gsap };
