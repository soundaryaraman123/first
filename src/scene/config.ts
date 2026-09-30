/**
 * World / performance constants for the 3D scene.
 * Tunables a designer might touch are grouped at the top.
 */
import type { Tier } from '../lib/device';

export const WORLD = {
  /** seed for terrain noise and tree scatter — change for a different (but stable) layout */
  seed: 7321,
  /** terrain extent in world units (square, centred on origin) */
  size: 900,
  /** vertices per terrain side */
  resolution: { high: 289, low: 161 } as Record<Tier, number>,
  /** height scale used when a heightmap PNG is supplied (white = this many units) */
  heightmapMaxHeight: 240,

  /** region where trees are scattered: the far slope facing the camera, plus the valley floor */
  treeArea: { minX: -230, maxX: 230, minZ: -185, maxZ: 40 },
  treeCount: { high: 9000, low: 3400 } as Record<Tier, number>,
  /** trees are rejected where the surface normal's Y is below this (steep faces) */
  minNormalY: 0.58,
  /** trees are rejected below this height (river channel) and above this (bare ridge) */
  treeHeightRange: [1.5, 112] as [number, number],

  /** scene height -> metres, used to match species altitude bands. Stylised, not to scale. */
  heightToMeters: (h: number) => 1300 + h * 20,
  /** above this altitude a converted site becomes blue pine instead of chir pine */
  bluePineAboveM: 2300,

  /** number of forest clusters that can be cleared in section 2, and the share that are */
  clusterCount: 44,
  clusterClearedShare: 0.5,
};

export const RENDER = {
  maxDpr: { high: 2, low: 1.5 } as Record<Tier, number>,
  antialias: { high: true, low: false } as Record<Tier, boolean>,
  /** ink outlines on trees (the costliest part of the cel look); ridgelines are always outlined */
  treeOutlines: { high: true, low: true } as Record<Tier, boolean>,
};

