/**
 * SCENE PALETTE — every colour in the 3D landscape lives here.
 *
 * Edit the hex values below, or open the site with ?palette to pick colours
 * live (changes apply instantly; "Copy palette" gives you a block to paste
 * back into this file).
 *
 * Style: cel-shaded (flat bands of light) with ink outlines. Lighting is
 * quantised by `toon.steps`, so colours read as flat paint with 2–3 tones.
 */

export const palette = {
  sky: {
    top: '#5f9fd6', // zenith blue
    horizon: '#d4e8f0', // pale haze at the horizon
    sunGlow: '#fff6dc',
  },
  /** distance haze: far hills fade toward this (aerial perspective) */
  haze: '#b9d6e3',

  clouds: {
    light: '#ffffff',
    shadow: '#b7cde3', // the cool underside tone
    outline: '#8fb0cf',
  },

  light: {
    sun: '#fff3dc',
    sunIntensity: 2.4,
    skyFill: '#d9ecf5',
    groundFill: '#5b6a3a',
    fillIntensity: 1.25,
  },

  /** brightness of each cel-shading band, darkest -> lightest (0..1) */
  toon: {
    steps: [0.42, 0.72, 1.0],
  },

  outline: {
    color: '#1d2b1f',
    /** line width in screen pixels near the camera (thins with distance) */
    width: 1.6,
  },

  terrain: {
    grass: '#96b84a',
    forestFloor: '#5e8036',
    meadow: '#a9bf5c',
    rock: '#8d97a4', // cool grey-blue reads as distance
    snow: '#f5f8f6',
    water: '#7fb6c6',
    /** hills beyond the modelled trees are painted as forest canopy in three tones */
    farForest: '#6f9a45',
    farForestLight: '#9dbd58',
    farForestDark: '#2f5a45',
    /** ground under cleared / converted forest */
    dry: '#c29a5a',
    flowers: ['#ffffff', '#f4d34c', '#e0585a'],
    /** 0 = no wildflowers, 1 = dense */
    flowerDensity: 0.35,
  },

  /** per species: trunk, main canopy, second canopy tone, accent (flowers/candles) */
  trees: {
    banjOak: { trunk: '#6b4a34', canopy: '#7fa04a', canopyAlt: '#96b95a', accent: '#96b95a' },
    kharsuOak: { trunk: '#5c4030', canopy: '#4f7a3a', canopyAlt: '#5f8c44', accent: '#5f8c44' },
    rhododendron: { trunk: '#6a4632', canopy: '#3f6a36', canopyAlt: '#4b7a3e', accent: '#d8393a' },
    deodar: { trunk: '#7a4632', canopy: '#2e5a48', canopyAlt: '#3a6b55', accent: '#3a6b55' },
    walnut: { trunk: '#76604c', canopy: '#a3c457', canopyAlt: '#b6d166', accent: '#b6d166' },
    maple: { trunk: '#6c5040', canopy: '#b7b845', canopyAlt: '#d49a3c', accent: '#d49a3c' },
    horseChestnut: { trunk: '#65483a', canopy: '#5d8f3e', canopyAlt: '#6ea04a', accent: '#cbd98f' },
    chirPine: { trunk: '#9a4e32', canopy: '#9fae45', canopyAlt: '#879b3c', accent: '#879b3c' },
    bluePine: { trunk: '#86503c', canopy: '#4f7f76', canopyAlt: '#5d8f86', accent: '#5d8f86' },
  },

  /** section-3 brush ring */
  brush: '#fff6e2',
};

export type Palette = typeof palette;
