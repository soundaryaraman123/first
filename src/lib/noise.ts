/**
 * Seeded 2D value noise + fBm helpers (no dependency).
 * Value noise with quintic interpolation is plenty for stylised terrain.
 */
import { mulberry32 } from './random';

export interface Noise2D {
  (x: number, y: number): number; // returns roughly -1..1
}

export function createNoise2D(seed = 1): Noise2D {
  const rng = mulberry32(seed);
  const perm = new Uint16Array(512);
  const values = new Float32Array(256);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  for (let i = 0; i < 256; i++) values[i] = rng() * 2 - 1;

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const v00 = values[perm[X + perm[Y]]];
    const v10 = values[perm[X + 1 + perm[Y]]];
    const v01 = values[perm[X + perm[Y + 1]]];
    const v11 = values[perm[X + 1 + perm[Y + 1]]];
    const u = fade(xf);
    const v = fade(yf);
    return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
  };
}

export function fbm(noise: Noise2D, x: number, y: number, octaves = 4, lacunarity = 2, gain = 0.5): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/** Ridged multifractal-ish: sharp crests, useful for mountain ridgelines. 0..1 */
export function ridged(noise: Noise2D, x: number, y: number, octaves = 4): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise(x * freq, y * freq));
    sum += n * n * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum;
}
