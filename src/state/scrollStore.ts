/**
 * Central scroll-progress store.
 *
 * Every section registers a ScrollTrigger (see scroll/useSectionProgress.ts)
 * and writes its own 0..1 progress here. From that we derive `storyPos`:
 *
 *   storyPos = sum of all section progresses
 *
 * so storyPos 0.0 = top of section 0, 1.5 = halfway through section 1, etc.
 * The 3D scene (camera path, forest state, fog) reads storyPos every frame
 * via `useScrollStore.getState()` — no React re-render involved.
 *
 * DOM components should subscribe with narrow selectors (e.g. activeIndex)
 * to avoid re-rendering on every scroll tick.
 */
import { create } from 'zustand';

export interface ScrollState {
  /** 0..1 progress for each section, indexed like sections/registry.ts */
  sectionProgress: number[];
  storyPos: number;
  activeIndex: number;
  /** true while the 3D canvas should be rendering (sections 0–4) */
  sceneActive: boolean;
  setSectionProgress: (index: number, progress: number) => void;
}

/** Index of the first DOM-only section. The canvas pauses once storyPos reaches it. */
export const SCENE_END_INDEX = 5;

export const useScrollStore = create<ScrollState>((set, get) => ({
  sectionProgress: [],
  storyPos: 0,
  activeIndex: 0,
  sceneActive: true,
  setSectionProgress: (index, progress) => {
    const prev = get().sectionProgress;
    if (prev[index] === progress) return;
    const next = prev.slice();
    next[index] = progress;
    let storyPos = 0;
    for (let i = 0; i < next.length; i++) storyPos += next[i] ?? 0;
    const activeIndex = Math.min(Math.floor(storyPos + 1e-4), Math.max(next.length - 1, 0));
    set({
      sectionProgress: next,
      storyPos,
      activeIndex,
      // tiny margin so the last 3D frame is fully covered before we pause
      sceneActive: storyPos < SCENE_END_INDEX - 0.001,
    });
  },
}));

/** Progress (0..1) of a section at a given storyPos. */
export const localProgress = (storyPos: number, index: number) =>
  Math.min(Math.max(storyPos - index, 0), 1);
