/**
 * UI / preference state shared by DOM and 3D.
 * Anything touched per-frame (per-tree state) lives in typed arrays instead —
 * see scene/trees/forestState.ts.
 */
import { create } from 'zustand';
import type { Tier } from '../lib/device';
import type { SpeciesId } from '../content/species';

export interface HoverLabel {
  speciesId: SpeciesId;
  /** screen position in CSS px */
  x: number;
  y: number;
}

export interface UiState {
  reducedMotion: boolean;
  tier: Tier;
  touch: boolean;
  webgl: boolean;
  soundOn: boolean;
  sceneReady: boolean;
  /** species card currently open (dialog), or null */
  infoSpecies: SpeciesId | null;
  /** fraction (0..1) of the slope converted in section 3 */
  convertedFraction: number;
  /** true once the final sweep has finished — releases the section 3 scroll gate */
  conversionComplete: boolean;
  conversionSweeping: boolean;
  set: (patch: Partial<Omit<UiState, 'set'>>) => void;
}

export const useUiStore = create<UiState>((set) => ({
  reducedMotion: false,
  tier: 'high',
  touch: false,
  webgl: true,
  soundOn: false,
  sceneReady: false,
  infoSpecies: null,
  convertedFraction: 0,
  conversionComplete: false,
  conversionSweeping: false,
  set: (patch) => set(patch),
}));
