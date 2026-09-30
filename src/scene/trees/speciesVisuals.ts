/**
 * How each tree species looks and where it likes to grow in the scene.
 * (Names/facts live in content/species.ts; this is purely visual/placement.)
 *
 * weight    relative abundance before altitude/moisture filtering
 * moisture  -1 favours spurs and ridges, +1 favours gullies and hollows
 * scale     random size range per tree
 * (colours live in scene/palette.ts)
 */
import type { TreeId } from '../../content/species';
import { NATIVE_TREES, PINES } from '../../content/species';

export interface TreeVisual {
  weight: number;
  moisture: number;
  scale: [number, number];
}

export const TREE_VISUALS: Record<TreeId, TreeVisual> = {
  banjOak: {
    weight: 1.5,
    moisture: 0,
    scale: [1.02, 1.44],
  },
  kharsuOak: {
    weight: 1.1,
    moisture: -0.2,
    scale: [1.08, 1.5],
  },
  rhododendron: {
    weight: 0.9,
    moisture: 0.1,
    scale: [1.02, 1.38],
  },
  deodar: {
    weight: 0.85,
    moisture: -0.5,
    scale: [1.02, 1.56],
  },
  walnut: {
    weight: 0.45,
    moisture: 0.8,
    scale: [1.02, 1.38],
  },
  maple: {
    weight: 0.5,
    moisture: 0.6,
    scale: [0.96, 1.38],
  },
  horseChestnut: {
    weight: 0.45,
    moisture: 0.9,
    scale: [1.08, 1.5],
  },
  chirPine: {
    weight: 1,
    moisture: 0,
    scale: [1.08, 1.44],
  },
  bluePine: {
    weight: 1,
    moisture: 0,
    scale: [1.08, 1.44],
  },
};

/** Mesh order: native species first, then pines. */
export const TREE_IDS: TreeId[] = [...NATIVE_TREES, ...PINES];
export const NATIVE_COUNT = NATIVE_TREES.length;
