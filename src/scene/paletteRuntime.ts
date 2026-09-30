/**
 * Live palette: starts from palette.ts, optionally overridden by values
 * saved from the ?palette panel (localStorage). Scene modules register a
 * sync function with `onPalette`; it runs immediately and on every change,
 * updating shader uniforms in place (no rebuild, no reload).
 */
import * as THREE from 'three';
import { palette as defaults, type Palette } from './palette';

const STORAGE_KEY = 'kyt-palette';
const panelEnabled = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('palette');

function load(): Palette {
  const p = structuredClone(defaults);
  if (!panelEnabled) return p;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved) deepAssign(p, saved);
  } catch {
    // ignore bad or blocked storage
  }
  return p;
}

function deepAssign(target: Record<string, unknown>, src: Record<string, unknown>) {
  for (const [k, v] of Object.entries(src)) {
    if (!(k in target)) continue;
    const t = target[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && t && typeof t === 'object' && !Array.isArray(t)) {
      deepAssign(t as Record<string, unknown>, v as Record<string, unknown>);
    } else if (typeof v === typeof t || (Array.isArray(v) && Array.isArray(t))) {
      target[k] = v;
    }
  }
}

export const livePalette: Palette = load();

type Listener = (p: Palette) => void;
const listeners = new Set<Listener>();

export function onPalette(fn: Listener): () => void {
  listeners.add(fn);
  fn(livePalette);
  return () => listeners.delete(fn);
}

/** Set a value by path, e.g. ['trees', 'deodar', 'canopy'] or ['terrain', 'flowers', '1']. */
export function setPaletteValue(path: (string | number)[], value: unknown) {
  let obj = livePalette as unknown as Record<string | number, unknown>;
  for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]] as Record<string | number, unknown>;
  obj[path[path.length - 1]] = value;
  save();
  listeners.forEach((fn) => fn(livePalette));
}

export function resetPalette() {
  deepAssign(livePalette as unknown as Record<string, unknown>, structuredClone(defaults) as unknown as Record<string, unknown>);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn(livePalette));
}

function save() {
  if (!panelEnabled) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(livePalette));
  } catch {
    // ignore
  }
}

/** Colour uniform helper: `{ value: Color }` that tracks a palette entry. */
export const colorUniform = (hex: string) => ({ value: new THREE.Color(hex) });

// ---------------------------------------------------------------- toon ramp

/** Shared gradient map for every toon material (bands from palette.toon.steps). */
export const toonRamp = (() => {
  const data = new Uint8Array(4 * 8);
  const tex = new THREE.DataTexture(data, 8, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  onPalette((p) => {
    const steps = p.toon.steps;
    for (let i = 0; i < 8; i++) {
      const s = steps[Math.min(steps.length - 1, Math.floor((i / 8) * steps.length))];
      const v = Math.round(Math.min(1, Math.max(0, s)) * 255);
      data.set([v, v, v, 255], i * 4);
    }
    tex.needsUpdate = true;
  });
  return tex;
})();
