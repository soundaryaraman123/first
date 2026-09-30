/**
 * Loads everything the scene needs once: heightfield, tree geometries and
 * the scattered forest. Cached as a promise so React's `use()` can suspend on it.
 */
import type { Tier } from '../lib/device';
import { loadHeightfield, type Heightfield } from './terrain/heightfield';
import { loadAllSpeciesGeometries } from './trees/loadSpeciesGeometry';
import { buildForest, type Forest } from './trees/forestState';
import { TREE_IDS } from './trees/speciesVisuals';
import { WORLD } from './config';
import { debugEnabled } from '../lib/device';

export interface World {
  heightfield: Heightfield;
  forest: Forest;
}

let promise: Promise<World> | null = null;
let current: World | null = null;

export function loadWorld(tier: Tier): Promise<World> {
  if (!promise) {
    promise = (async () => {
      const [heightfield, geoms] = await Promise.all([
        loadHeightfield(WORLD.resolution[tier]),
        loadAllSpeciesGeometries(TREE_IDS),
      ]);
      const forest = buildForest(heightfield, geoms, tier);
      current = { heightfield, forest };
      if (debugEnabled) (window as unknown as { __kyt: World }).__kyt = current;
      return current;
    })();
  }
  return promise;
}

/** The loaded world, or null while loading. For non-React callers (DOM sections). */
export const getWorld = () => current;
