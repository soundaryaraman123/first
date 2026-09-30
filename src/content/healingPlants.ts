/**
 * Section 5 — Healing plants. Plate content comes from species.ts;
 * this file holds the section copy and plate order.
 */
import type { PlantId } from './species';

export const healingPlants = {
  heading: 'Healing plants',
  intro:
    'Above and within the forests grow plants that mountain communities have long used for healing. Many are now scarce.', // TODO-VERIFY
  plateHint: 'Hover, focus or tap a plate to unfold it.',
  order: ['kutki', 'jatamansi', 'dhoop', 'atish', 'banafsha'] as PlantId[],
  asideId: 'guchhi' as PlantId,
  asideHeading: 'Not a plant, a fungus',
  labels: {
    traditionalUse: 'Traditional use',
    altitude: 'Altitude band',
    conservation: 'Conservation',
  },
  lookDontPick: {
    title: 'Look, don’t pick',
    body: 'Many of these plants grow slowly and are already over-harvested. Enjoy them where they grow, photograph them, and leave them for the next walker — and for the mountain.',
  },
  /** Drop Figma exports in /public/plates and map them here, e.g. kutki: '/plates/kutki.svg' */
  plateImages: {} as Partial<Record<PlantId, string>>,
  romanNumerals: ['I', 'II', 'III', 'IV', 'V', 'VI'],
  medicalNote: 'Descriptions of traditional use are cultural context, not medical advice.',
};
