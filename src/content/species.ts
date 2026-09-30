/**
 * Species data — trees (sections 1–3) and healing plants (section 5).
 *
 * EDIT FREELY. Logic reads these fields; nothing here is code.
 *
 * ACCURACY: every ecological/ethnobotanical detail below is placeholder copy
 * and must be checked before launch. Fields marked `// TODO-VERIFY` in
 * particular. Keep UI copy general; avoid exact figures until verified.
 *
 * Local names vary between valleys and dialects — confirm with the
 * communities of the specific region.  // TODO-VERIFY
 */

export type NativeTreeId =
  | 'banjOak'
  | 'kharsuOak'
  | 'rhododendron'
  | 'deodar'
  | 'walnut'
  | 'maple'
  | 'horseChestnut';

export type PineId = 'chirPine' | 'bluePine';

export type PlantId = 'kutki' | 'jatamansi' | 'dhoop' | 'atish' | 'banafsha' | 'guchhi';

export type TreeId = NativeTreeId | PineId;
export type SpeciesId = TreeId | PlantId;

export interface Trait {
  label: string;
  text: string;
}

export interface Species {
  id: SpeciesId;
  kind: 'native-tree' | 'pine' | 'plant' | 'fungus';
  commonName: string;
  localName: string;
  scientificName: string;
  description: string;
  funFact: string;
  /** approximate altitude band in metres  // TODO-VERIFY */
  altitudeM: [number, number];
  /** extra facts shown on info cards (pines) */
  traits?: Trait[];
  /** section 5 plates */
  traditionalUse?: string;
  conservation?: string;
}

export const NATIVE_TREES: NativeTreeId[] = [
  'banjOak',
  'kharsuOak',
  'rhododendron',
  'deodar',
  'walnut',
  'maple',
  'horseChestnut',
];
export const PINES: PineId[] = ['chirPine', 'bluePine'];
export const PLANTS: PlantId[] = ['kutki', 'jatamansi', 'dhoop', 'atish', 'banafsha', 'guchhi'];

export const species: Record<SpeciesId, Species> = {
  // ---------------------------------------------------------------- trees
  banjOak: {
    id: 'banjOak',
    kind: 'native-tree',
    commonName: 'Banj oak',
    localName: 'Banj', // TODO-VERIFY local name for region
    scientificName: 'Quercus leucotrichophora',
    description:
      'An evergreen oak with silvery-backed leaves. Its leaf litter builds deep, spongy soil on the middle slopes.', // TODO-VERIFY
    funFact: 'Its leaves have long been gathered as fodder and bedding for livestock.', // TODO-VERIFY
    altitudeM: [1500, 2400], // TODO-VERIFY
  },
  kharsuOak: {
    id: 'kharsuOak',
    kind: 'native-tree',
    commonName: 'Brown oak',
    localName: 'Kharsu', // TODO-VERIFY
    scientificName: 'Quercus semecarpifolia',
    description: 'A high-altitude oak forming dense, dark stands up toward the treeline.', // TODO-VERIFY
    funFact: 'Its forests are often the last broad-leaved woods before alpine meadows begin.', // TODO-VERIFY
    altitudeM: [2400, 3500], // TODO-VERIFY
  },
  rhododendron: {
    id: 'rhododendron',
    kind: 'native-tree',
    commonName: 'Tree rhododendron',
    localName: 'Burans', // TODO-VERIFY
    scientificName: 'Rhododendron arboreum',
    description: 'A gnarled, slow-growing tree that lights the oak forest with red blooms in spring.', // TODO-VERIFY
    funFact: 'Its flowers are made into a bright red drink in many hill homes.', // TODO-VERIFY
    altitudeM: [1500, 3000], // TODO-VERIFY
  },
  deodar: {
    id: 'deodar',
    kind: 'native-tree',
    commonName: 'Himalayan cedar',
    localName: 'Devdar', // TODO-VERIFY
    scientificName: 'Cedrus deodara',
    description: 'A tall, tiered conifer with drooping tips, long valued for its durable, fragrant wood.', // TODO-VERIFY
    funFact: 'The name is often read as "timber of the gods".', // TODO-VERIFY
    altitudeM: [1800, 3000], // TODO-VERIFY
  },
  walnut: {
    id: 'walnut',
    kind: 'native-tree',
    commonName: 'Walnut',
    localName: 'Akhrot', // TODO-VERIFY
    scientificName: 'Juglans regia',
    description: 'A broad-crowned tree of moist valley sides and village edges.', // TODO-VERIFY
    funFact: 'Its bark and husks have been used as a natural dye.', // TODO-VERIFY
    altitudeM: [1200, 2800], // TODO-VERIFY
  },
  maple: {
    id: 'maple',
    kind: 'native-tree',
    commonName: 'Himalayan maple',
    localName: 'Kainjal', // TODO-VERIFY
    scientificName: 'Acer sp.', // TODO-VERIFY which species
    description: 'A deciduous tree of cool, shaded gullies that turns gold before winter.', // TODO-VERIFY
    funFact: 'Its winged seeds spin like tiny propellers on the wind.',
    altitudeM: [2000, 3200], // TODO-VERIFY
  },
  horseChestnut: {
    id: 'horseChestnut',
    kind: 'native-tree',
    commonName: 'Indian horse chestnut',
    localName: 'Pangar', // TODO-VERIFY
    scientificName: 'Aesculus indica',
    description: 'A tall, shady tree of moist ravines, with upright candles of pale flowers.', // TODO-VERIFY
    funFact: 'Its large seeds have traditionally been processed into flour in lean times.', // TODO-VERIFY
    altitudeM: [1500, 3000], // TODO-VERIFY
  },

  // ---------------------------------------------------------------- pines
  chirPine: {
    id: 'chirPine',
    kind: 'pine',
    commonName: 'Chir pine',
    localName: 'Chir', // TODO-VERIFY
    scientificName: 'Pinus roxburghii',
    description:
      'A fast-growing pine of the lower and middle hills, widely favoured by forestry for timber and resin.', // TODO-VERIFY
    funFact: 'Its long needles can carpet the forest floor thickly.',
    altitudeM: [500, 2300], // TODO-VERIFY
    traits: [
      { label: 'Resin', text: 'Tapped for resin, used in turpentine and rosin.' }, // TODO-VERIFY
      { label: 'Needle litter', text: 'Needles decompose slowly and build a dry, slippery layer.' }, // TODO-VERIFY
      { label: 'Fire', text: 'Dry needle litter can carry ground fires through the forest.' }, // TODO-VERIFY
      { label: 'Understory', text: 'Few shrubs and herbs tend to grow beneath dense stands.' }, // TODO-VERIFY
    ],
  },
  bluePine: {
    id: 'bluePine',
    kind: 'pine',
    commonName: 'Blue pine',
    localName: 'Kail', // TODO-VERIFY
    scientificName: 'Pinus wallichiana',
    description: 'A soft-needled pine of higher slopes, with drooping blue-green needles.', // TODO-VERIFY
    funFact: 'Its needles hang in soft bunches of five.', // TODO-VERIFY
    altitudeM: [1800, 3600], // TODO-VERIFY
    traits: [
      { label: 'Resin', text: 'Also yields resin, though it is less commonly tapped.' }, // TODO-VERIFY
      { label: 'Needle litter', text: 'Forms a layer of needles that is slow to break down.' }, // TODO-VERIFY
      { label: 'Fire', text: 'Needle litter can add to ground-fire risk in dry seasons.' }, // TODO-VERIFY
      { label: 'Understory', text: 'Dense stands can shade out much of the understory.' }, // TODO-VERIFY
    ],
  },

  // --------------------------------------------------------- healing plants
  kutki: {
    id: 'kutki',
    kind: 'plant',
    commonName: 'Kutki',
    localName: 'Kutki', // TODO-VERIFY
    scientificName: 'Picrorhiza kurroa',
    description: 'A small creeping herb of rocky alpine slopes with a famously bitter root.',
    funFact: 'Its bitterness is part of what made it prized.', // TODO-VERIFY
    altitudeM: [3000, 4800], // TODO-VERIFY
    traditionalUse: 'Used in traditional medicine systems, especially as a bitter tonic.', // TODO-VERIFY
    conservation: 'Under pressure from wild collection.', // TODO-VERIFY formal status
  },
  jatamansi: {
    id: 'jatamansi',
    kind: 'plant',
    commonName: 'Jatamansi',
    localName: 'Jatamansi', // TODO-VERIFY
    scientificName: 'Nardostachys jatamansi',
    description: 'An aromatic alpine herb whose hairy rhizomes smell earthy and sweet.',
    funFact: 'Its fragrant oil has been traded far beyond the mountains for centuries.', // TODO-VERIFY
    altitudeM: [3000, 5000], // TODO-VERIFY
    traditionalUse: 'Used in traditional medicine and perfumery; valued as calming.', // TODO-VERIFY
    conservation: 'Considered threatened by over-harvesting of its roots.', // TODO-VERIFY formal status
  },
  dhoop: {
    id: 'dhoop',
    kind: 'plant',
    commonName: 'Dhoop',
    localName: 'Dhoop', // TODO-VERIFY
    scientificName: 'Jurinea dolomiaea', // TODO-VERIFY
    description: 'A stemless alpine plant with a rosette of leaves and a fragrant root.',
    funFact: 'Its name comes from its use as incense.', // TODO-VERIFY
    altitudeM: [3000, 4000], // TODO-VERIFY
    traditionalUse: 'Roots traditionally burned as incense in shrines and homes.', // TODO-VERIFY
    conservation: 'Collected from the wild; populations are under pressure.', // TODO-VERIFY
  },
  atish: {
    id: 'atish',
    kind: 'plant',
    commonName: 'Atish',
    localName: 'Atees', // TODO-VERIFY
    scientificName: 'Aconitum heterophyllum',
    description: 'A monkshood of high meadows with hooded, violet-veined flowers.',
    funFact: 'Many of its relatives are among the most poisonous plants in the Himalaya.', // TODO-VERIFY
    altitudeM: [2400, 4000], // TODO-VERIFY
    traditionalUse: 'Its tubers are used in traditional medicine after careful preparation.', // TODO-VERIFY
    conservation: 'Considered at risk from wild harvesting.', // TODO-VERIFY formal status
  },
  banafsha: {
    id: 'banafsha',
    kind: 'plant',
    commonName: 'Himalayan violet',
    localName: 'Banafsha', // TODO-VERIFY
    scientificName: 'Viola sp.', // TODO-VERIFY which species
    description: 'A low violet of shady forest floors and banks, flowering early in the year.',
    funFact: 'It thrives in the moist, leafy shade of the oak forest.', // TODO-VERIFY
    altitudeM: [1500, 2500], // TODO-VERIFY
    traditionalUse: 'Flowers and leaves are used in home remedies for coughs and colds.', // TODO-VERIFY
    conservation: 'Declining where forest floors dry out or are over-collected.', // TODO-VERIFY
  },
  guchhi: {
    id: 'guchhi',
    kind: 'fungus',
    commonName: 'Morel',
    localName: 'Guchhi', // TODO-VERIFY
    scientificName: 'Morchella sp.',
    description: 'Not a plant at all: a fungus with a honeycombed cap, appearing briefly in spring.',
    funFact: 'Fungi are closer relatives of animals than of plants.',
    altitudeM: [1800, 3500], // TODO-VERIFY
    traditionalUse: 'Gathered as a prized food rather than a medicine.', // TODO-VERIFY
    conservation: 'Seasonal and unpredictable; heavy gathering pressure in some areas.', // TODO-VERIFY
  },
};
