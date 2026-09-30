# Know your trail

A scroll-driven story of a Western Himalayan valley's forests: arrival, the old mixed forest, colonial forestry, the conversion to chir pine, what changed, and healing plants. Sections 0–5 are built. Birds, trails and the closing section plug in later.

The previous single-page site is kept in `legacy/`.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run typecheck
```

### URL flags (for testing)

| Flag | Effect |
| --- | --- |
| `?debug` | HUD with live `storyPos`, active section, fps; exposes `window.__kyt` |
| `?tier=low` / `?tier=high` | force the mobile / desktop performance tier |
| `?motion=reduced` | force prefers-reduced-motion behaviour |
| `?nowebgl` | force the static no-WebGL fallback |
| `?palette` or `#palette` | live colour panel for the 3D scene (see below) |

## Where to tune things

| What | File |
| --- | --- |
| All copy | `src/content/*.ts` (one file per section, plus `site.ts`) |
| Species data (names, altitude bands, facts, plant plates) | `src/content/species.ts` |
| Camera path (keyframes on the story timeline) | `src/scene/cameraPath.ts` |
| **3D scene colours** (sky, clouds, haze, light, cel bands, outlines, ground, every tree) | `src/scene/palette.ts` |
| Design tokens for the page UI (colour, type, spacing, radius, motion) | `src/styles/tokens.css` |
| Tree placement preferences | `src/scene/trees/speciesVisuals.ts` |
| Tree shapes (procedural placeholders) | `src/scene/trees/geometries.ts` |
| World constants (tree counts, terrain size, seed, clearing share) | `src/scene/config.ts` |
| Section 3 threshold & brush size | `src/content/conversion.ts` |
| Animation timings (sink/grow, ripple, sweep) | `TIMING` in `src/scene/trees/forestState.ts` |

**Content accuracy:** every historical/ecological detail is a placeholder marked `// TODO-VERIFY`. While `site.showDraftTags` is `true`, the UI shows small "to verify" tags next to those facts. Set it to `false` for launch.

## Changing the scene colours

The landscape is cel-shaded: flat bands of light set by `toon.steps`, with ink outlines whose colour and width you can change. Every colour lives in `src/scene/palette.ts`.

The quickest way to tune them:

1. Open the site with `?palette` (e.g. `http://localhost:5173/?palette`).
2. Change colours and sliders in the "Scene colours" panel. Changes apply live and are remembered in that browser.
3. Click **Copy palette** and paste the result over the object in `src/scene/palette.ts` to keep it. **Reset** returns to the file's values.

Tree colours apply to the procedural placeholder trees. A `.glb` model keeps its own colours.

## Dropping in real assets

| Asset | Where | Notes |
| --- | --- | --- |
| Terrain heightmap | `public/terrain/heightmap.png` | Red channel, white = `WORLD.heightmapMaxHeight`. Picked up automatically. Otherwise terrain is procedural. |
| Tree models | `public/models/<speciesId>.glb` | Draco OK (three's decoder is bundled and self-hosted). Base at origin, Y up, ~5–9 units tall, low-poly. Vertex colours preferred. Species ids: `banjOak kharsuOak rhododendron deodar walnut maple horseChestnut chirPine bluePine`. Picked up automatically. |
| Plant plates | e.g. `public/plates/kutki.svg` | Map in `healingPlants.plateImages`. |
| No-WebGL stills | e.g. `public/fallback/arrival.jpg` | Map in `site.fallbackImages`. |
| Sounds | `public/audio/*.mp3` | Map in `FILES` in `src/audio/audio.ts`. Synthesised placeholders until then. |
| Fonts | `src/styles/tokens.css` | `--font-serif` / `--font-sans`. Add `@font-face` or a `<link>`. |

## Architecture

```
src/
  content/        copy + species data (no logic)
  styles/         tokens.css (Figma-Variables-shaped) + global.css
  state/          zustand: scrollStore (per-section progress -> storyPos), uiStore
  scroll/         Lenis <-> GSAP ScrollTrigger sync, section-3 scroll gate, useSectionProgress
  sections/       one folder per section + registry.ts (order = story index)
  scene/          the single persistent <Canvas> (lazy-loaded chunk)
    palette.ts, paletteRuntime.ts   all scene colours + live updates
    outline.ts                      inverted-hull ink outlines
    cameraPath.ts, CameraRig.tsx, Atmosphere.tsx
    clouds/       cel-shaded cumulus: the opening sea of clouds
    terrain/      heightfield (procedural or PNG), ray marching, brush + dryness shader
    trees/        procedural geometry, glTF loader, seeded scatter, typed-array forest state
    fog/          section-0 mist layers with pointer parting
    railway/      section-2 draw-on railway
    interaction/  window-level pointer, picking, brush, section-3 actions
  components/     overlay panel, info-card dialog, sound toggle, loader, fallbacks
  audio/          WebAudio manager (muted by default)
```

- **storyPos**: each section reports 0..1 progress from when its top reaches the viewport top to when its bottom does. `storyPos` is their sum, so `2.5` means halfway through section 2. The 3D scene reads it every frame with `getState()`, so no React re-renders happen per frame.
- **Per-tree state** lives in typed arrays (`forestState.ts`). Each site on the slope has one native instance and one pine instance. Show and hide are driven by a per-instance `aGrow` attribute in the tree shader, and instance matrices never change.
- **Picking** uses analytic canopy spheres plus heightfield ray marching. It never raycasts triangles.
- **The canvas has `pointer-events: none`.** Pointer input is read on `window`, so page scrolling (including touch) stays native.
- **The canvas render loop stops** once section 5 covers the viewport.

### Adding a section

1. Create `src/sections/SnName/` with a component that calls `useSectionProgress(ref, index)`.
2. Put its copy in `src/content/`.
3. Append it to `sections` in `registry.ts` and add its name to `sectionIndex.ts`.
4. If it's 3D, add camera keys at `index + progress` in `cameraPath.ts`. If it's DOM-only after section 5, nothing else is needed.
