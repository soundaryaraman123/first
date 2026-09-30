/**
 * Device / preference detection, evaluated once at startup.
 *
 * URL overrides for testing (combine freely):
 *   ?tier=low | ?tier=high     force the performance tier
 *   ?motion=reduced            force prefers-reduced-motion
 *   ?nowebgl                   force the static no-WebGL fallback
 *   ?debug                     show the scroll/fps debug HUD
 */
export type Tier = 'high' | 'low';

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

export const debugEnabled = params.has('debug');

export function detectReducedMotion(): boolean {
  if (params.get('motion') === 'reduced') return true;
  if (params.get('motion') === 'full') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function detectTier(): Tier {
  const forced = params.get('tier');
  if (forced === 'low' || forced === 'high') return forced;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  return coarse || small || fewCores ? 'low' : 'high';
}

export function detectTouch(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

export function detectWebGL(): boolean {
  if (params.has('nowebgl')) return false;
  try {
    const canvas = document.createElement('canvas');
    // three.js now requires WebGL 2
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}
