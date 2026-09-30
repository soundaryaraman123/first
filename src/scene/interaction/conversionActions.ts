/**
 * Section 3 actions, callable from both the 3D click handler and DOM buttons
 * (keyboard users). Per-tree state stays in the forest's typed arrays; only
 * the summary numbers go into the UI store.
 */
import { getWorld } from '../world';
import { convertAll, convertAround, randomUnconvertedSite } from '../trees/forestState';
import { useUiStore } from '../../state/uiStore';
import { conversion } from '../../content/conversion';
import { playSound } from '../../audio/audio';
import { mulberry32 } from '../../lib/random';
import { flashBrush } from './brush';

/** Shared clock for tree animations (seconds). */
export const now = () => performance.now() / 1000;

const rng = mulberry32(2024);
let completeTimer: number | undefined;

function syncFraction() {
  const w = getWorld();
  if (!w) return;
  const f = w.forest;
  useUiStore.getState().set({ convertedFraction: f.convertedCount / Math.max(f.count, 1) });
}

export function convertAtPoint(x: number, z: number) {
  const w = getWorld();
  const ui = useUiStore.getState();
  if (!w || ui.conversionComplete || ui.conversionSweeping) return;
  const added = convertAround(w.forest, x, z, conversion.brushRadius, now(), ui.reducedMotion);
  if (added > 0) {
    playSound('creak', Math.min(1, 0.4 + added / 120));
    setTimeout(() => playSound('rustle', 0.8), 260);
  }
  syncFraction();
  if (useUiStore.getState().convertedFraction >= conversion.autoSweepAt) {
    window.setTimeout(startSweep, ui.reducedMotion ? 0 : 900);
  }
}

/** Keyboard alternative to clicking the slope. */
export function convertRandomPatch() {
  const w = getWorld();
  if (!w) return;
  const i = randomUnconvertedSite(w.forest, rng);
  if (i < 0) return;
  flashBrush(w.forest.x[i], w.forest.y[i], w.forest.z[i]);
  convertAtPoint(w.forest.x[i], w.forest.z[i]);
}

/** "See the slope today": convert everything in one sweep, then release the scroll gate. */
export function startSweep() {
  const w = getWorld();
  const ui = useUiStore.getState();
  if (!w || ui.conversionComplete || ui.conversionSweeping) return;
  ui.set({ conversionSweeping: true });
  const duration = convertAll(w.forest, now(), ui.reducedMotion);
  playSound('rustle', 1);
  setTimeout(() => playSound('creak', 1), 500);
  setTimeout(() => playSound('rustle', 0.8), 1300);
  syncFraction();
  window.clearTimeout(completeTimer);
  completeTimer = window.setTimeout(
    () => useUiStore.getState().set({ conversionComplete: true, conversionSweeping: false }),
    duration * 1000 + 200,
  );
}
