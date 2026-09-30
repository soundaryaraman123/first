/**
 * Section 3 — The conversion (signature interaction).
 * Copy plus the tunables a writer/designer is likely to adjust.
 */
export const conversion = {
  heading: 'The conversion',
  instructions: {
    pointer: 'Click the slope to replace the native forest with chir pine. Click a pine to learn about it.',
    touch: 'Tap the slope to replace the native forest with chir pine. Tap a pine to learn about it.',
  },
  convertedLabel: 'Slope converted',
  keyboard: {
    convertPatch: 'Convert a patch',
    aboutPine: 'About chir pine',
  },
  seeTodayButton: 'See the slope today',
  completeHeading: 'The slope today',
  completeBody:
    'Across much of the lower and middle hills, chir pine now dominates slopes that once held mixed forest.', // TODO-VERIFY
  continueCue: 'Keep scrolling',
  afterBody:
    'A slope of one species holds water, soil and life differently from the forest it replaced. Next: what that changes.', // TODO-VERIFY
  /** once this fraction of the slope is converted, the full sweep starts automatically */
  autoSweepAt: 0.4,
  /** brush radius in world units (the slope is ~400 units wide) */
  brushRadius: 26,
};
