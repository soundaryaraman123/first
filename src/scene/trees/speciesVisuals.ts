/**
 * How each tree species looks and where it likes to grow in the scene.
 * (Names/facts live in content/species.ts; this is purely visual/placement.)
 *
 * weight    relative abundance before altitude/moisture filtering
 * moisture  -1 favours spurs and ridges, +1 favours gullies and hollows
 * scale     random size range per tree
 * colors    placeholder palette for the procedural low-poly models
 */
import type { TreeId } from '../../content/species';
import { NATIVE_TREES, PINES } from '../../content/species';

export interface TreeVisual {
  weight: number;
  moisture: number;
  scale: [number, number];
  colors: { trunk: string; canopy: string; canopyAlt?: string; accent?: string };
}

export const TREE_VISUALS: Record<TreeId, TreeVisual> = {
  banjOak: {
    weight: 1.5,
    moisture: 0,
    scale: [1.02, 1.44],
    colors: { trunk: '#5a4636', canopy: '#6c7c55', canopyAlt: '#7f8e68' },
  },
  kharsuOak: {
    weight: 1.1,
    moisture: -0.2,
    scale: [1.08, 1.5],
    colors: { trunk: '#4c3b2e', canopy: '#445632', canopyAlt: '#4f6139' },
  },
  rhododendron: {
    weight: 0.9,
    moisture: 0.1,
    scale: [1.02, 1.38],
    colors: { trunk: '#5b4232', canopy: '#3f5631', accent: '#c2382c' },
  },
  deodar: {
    weight: 0.85,
    moisture: -0.5,
    scale: [1.02, 1.56],
    colors: { trunk: '#5a4332', canopy: '#35503f', canopyAlt: '#3e5b49' },
  },
  walnut: {
    weight: 0.45,
    moisture: 0.8,
    scale: [1.02, 1.38],
    colors: { trunk: '#6a5847', canopy: '#7c9150', canopyAlt: '#89a05a' },
  },
  maple: {
    weight: 0.5,
    moisture: 0.6,
    scale: [0.96, 1.38],
    colors: { trunk: '#5e4a3a', canopy: '#949a46', canopyAlt: '#b28a3a' },
  },
  horseChestnut: {
    weight: 0.45,
    moisture: 0.9,
    scale: [1.08, 1.5],
    colors: { trunk: '#58463a', canopy: '#4d6c38', accent: '#d9d2b4' },
  },
  chirPine: {
    weight: 1,
    moisture: 0,
    scale: [1.08, 1.44],
    colors: { trunk: '#8b5a3a', canopy: '#8e9b44', canopyAlt: '#7c8a3c' },
  },
  bluePine: {
    weight: 1,
    moisture: 0,
    scale: [1.08, 1.44],
    colors: { trunk: '#6e5040', canopy: '#5c7467', canopyAlt: '#678073' },
  },
};

/** Mesh order: native species first, then pines. */
export const TREE_IDS: TreeId[] = [...NATIVE_TREES, ...PINES];
export const NATIVE_COUNT = NATIVE_TREES.length;
