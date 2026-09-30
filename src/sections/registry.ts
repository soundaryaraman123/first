/**
 * Ordered list of story sections. The array index is the section's
 * "story index" used by the scroll store, the camera path and the scene.
 *
 * To add a section later (Birds, Trails, Closing): create a folder in
 * /src/sections, add its copy in /src/content, and append it here.
 * Sections at index >= SCENE_END_INDEX (state/scrollStore.ts) are DOM-only;
 * the 3D canvas pauses while they're on screen.
 */
import type { ComponentType } from 'react';
import { S0Arrival } from './S0Arrival/S0Arrival';
import { S1OldForest } from './S1OldForest/S1OldForest';
import { S2Turn } from './S2Turn/S2Turn';
import { S3Conversion } from './S3Conversion/S3Conversion';
import { S4WhatChanged } from './S4WhatChanged/S4WhatChanged';
import { S5HealingPlants } from './S5HealingPlants/S5HealingPlants';

export interface SectionProps {
  index: number;
}

export interface SectionDef {
  id: string;
  Component: ComponentType<SectionProps>;
}

export const sections: SectionDef[] = [
  { id: 'arrival', Component: S0Arrival },
  { id: 'old-forest', Component: S1OldForest },
  { id: 'the-turn', Component: S2Turn },
  { id: 'the-conversion', Component: S3Conversion },
  { id: 'what-changed', Component: S4WhatChanged },
  { id: 'healing-plants', Component: S5HealingPlants },
];

/** Story indices by name, so scene code doesn't hard-code numbers. */
export const SECTION = {
  arrival: 0,
  oldForest: 1,
  turn: 2,
  conversion: 3,
  whatChanged: 4,
  healingPlants: 5,
} as const;
