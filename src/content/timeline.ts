/**
 * Section 2 — The turn (colonial forestry).
 *
 * PLACEHOLDER MILESTONES — all dates and descriptions must be verified.
 * `year` drives the ticking counter; it is shown as "c. <year>" and flagged
 * with a draft tag while `verified` is false.
 */
export interface Milestone {
  year: number; // TODO-VERIFY
  title: string;
  body: string;
  verified: boolean;
}

export const turn = {
  heading: 'The turn',
  intro:
    'Under colonial rule, forests came to be managed for timber and resin. Over the following decades, much of the mixed forest was cleared or replaced.', // TODO-VERIFY
  milestones: [
    {
      year: 1860, // TODO-VERIFY
      title: 'A forest department forms',
      body: 'Forests begin to be administered by the state, with an eye on timber supply.', // TODO-VERIFY
      verified: false,
    },
    {
      year: 1870, // TODO-VERIFY
      title: 'Railway sleeper demand',
      body: 'Expanding railways need vast numbers of sleepers, and hill forests are felled to supply them.', // TODO-VERIFY
      verified: false,
    },
    {
      year: 1880, // TODO-VERIFY
      title: 'Forest laws',
      body: 'New forest acts reserve large areas for the state and restrict customary village use.', // TODO-VERIFY
      verified: false,
    },
    {
      year: 1900, // TODO-VERIFY
      title: 'Resin tapping',
      body: 'Resin becomes a commercial product, and pine is favoured over oak.', // TODO-VERIFY
      verified: false,
    },
    {
      year: 1920, // TODO-VERIFY
      title: 'Working plans',
      body: 'Management plans favour fast-growing, marketable conifers across the lower slopes.', // TODO-VERIFY
      verified: false,
    },
  ] satisfies Milestone[],
  railwayLabel: 'Timber for the railways',
};
