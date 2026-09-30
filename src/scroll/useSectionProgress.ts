import { useLayoutEffect, type RefObject } from 'react';
import { ScrollTrigger } from './scrollController';
import { useScrollStore } from '../state/scrollStore';

/**
 * Registers a section's scroll range with the central store.
 * Progress is 0 when the section's top reaches the top of the viewport and
 * 1 when its bottom does — so consecutive sections hand over seamlessly
 * and storyPos (their sum) is continuous.
 */
export function useSectionProgress(ref: RefObject<HTMLElement | null>, index: number) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = useScrollStore.getState().setSectionProgress;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => set(index, self.progress),
      onRefresh: (self) => set(index, self.progress),
    });
    set(index, st.progress);
    return () => st.kill();
  }, [ref, index]);
}
