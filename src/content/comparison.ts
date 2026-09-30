/**
 * Section 4 — What changed. Oak forest vs pine forest.
 * All comparisons are general placeholders.  // TODO-VERIFY every row
 */
export const comparison = {
  heading: 'What changed',
  intro: 'Drag the divider to compare the two forests.',
  sliderLabel: 'Compare oak forest and pine forest',
  oak: { title: 'Oak forest', caption: 'Rain soaks into leaf litter and soil.' }, // TODO-VERIFY
  pine: { title: 'Pine forest', caption: 'More rain runs off the needle layer.' }, // TODO-VERIFY
  rows: [
    {
      topic: 'Springs & water',
      oak: 'Spongy litter and soil help rain soak in and feed springs.', // TODO-VERIFY
      pine: 'Needle layers can shed water, with more runoff.', // TODO-VERIFY
    },
    {
      topic: 'Fire',
      oak: 'Moist litter is slow to burn.', // TODO-VERIFY
      pine: 'Dry, resinous needles can carry ground fires.', // TODO-VERIFY
    },
    {
      topic: 'Soil',
      oak: 'Leaf fall builds rich, deep humus.', // TODO-VERIFY
      pine: 'Acidic needle litter breaks down slowly.', // TODO-VERIFY
    },
    {
      topic: 'Understory life',
      oak: 'Layers of shrubs, herbs, fungi and birds.', // TODO-VERIFY
      pine: 'A sparser understory with fewer plants.', // TODO-VERIFY
    },
  ],
};
