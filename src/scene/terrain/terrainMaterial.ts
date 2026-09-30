/**
 * Terrain material: cel-shaded MeshToonMaterial with the ground colour
 * computed in the shader from palette.ts (so colour edits apply live):
 *   height + slope → grass / forest floor / meadow / rock / snow / water
 * plus:
 *   - wildflower flecks on gentle grassy ground near the camera
 *   - a "dryness" map that paints ground under cleared / converted forest
 *   - the section-3 brush ring, drawn exactly on the surface
 *
 * Uniforms are module-level singletons so interaction code can drive them
 * without touching React.
 */
import * as THREE from 'three';
import { WORLD } from '../config';
import { onPalette, toonRamp } from '../paletteRuntime';

const { minX, maxX, minZ, maxZ } = WORLD.treeArea;

export const DRY_MAP_W = 192;
export const DRY_MAP_H = 96;
export const dryMapData = new Uint8Array(DRY_MAP_W * DRY_MAP_H);
export const dryMap = new THREE.DataTexture(dryMapData, DRY_MAP_W, DRY_MAP_H, THREE.RedFormat, THREE.UnsignedByteType);
dryMap.magFilter = THREE.LinearFilter;
dryMap.minFilter = THREE.LinearFilter;
dryMap.needsUpdate = true;

const col = () => ({ value: new THREE.Color() });

export const terrainUniforms = {
  uBrushPos: { value: new THREE.Vector3(0, -999, 0) },
  uBrushRadius: { value: 26 },
  uBrushOpacity: { value: 0 },
  uBrushColor: col(),
  uDryMap: { value: dryMap },
  uDryRect: { value: new THREE.Vector4(minX, minZ, 1 / (maxX - minX), 1 / (maxZ - minZ)) },
  uDryColor: col(),
  uGrass: col(),
  uForestFloor: col(),
  uMeadow: col(),
  uRock: col(),
  uSnow: col(),
  uWater: col(),
  uFlower0: col(),
  uFlower1: col(),
  uFlower2: col(),
  uFlowerDensity: { value: 0.35 },
  uFarForest: col(),
  uFarForestLight: col(),
  uFarForestDark: col(),
};

onPalette((p) => {
  const t = p.terrain;
  const u = terrainUniforms;
  u.uBrushColor.value.set(p.brush);
  u.uDryColor.value.set(t.dry);
  u.uGrass.value.set(t.grass);
  u.uForestFloor.value.set(t.forestFloor);
  u.uMeadow.value.set(t.meadow);
  u.uRock.value.set(t.rock);
  u.uSnow.value.set(t.snow);
  u.uWater.value.set(t.water);
  u.uFlower0.value.set(t.flowers[0] ?? '#ffffff');
  u.uFlower1.value.set(t.flowers[1] ?? t.flowers[0] ?? '#ffffff');
  u.uFlower2.value.set(t.flowers[2] ?? t.flowers[0] ?? '#ffffff');
  u.uFlowerDensity.value = t.flowerDensity;
  u.uFarForest.value.set(t.farForest);
  u.uFarForestLight.value.set(t.farForestLight);
  u.uFarForestDark.value.set(t.farForestDark);
});

export function createTerrainMaterial(): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({ gradientMap: toonRamp });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, terrainUniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aVar;
varying vec3 vKytWorld;
varying vec3 vKytNormal;
varying float vKytVar;`,
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
vKytWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
vKytNormal = normalize(mat3(modelMatrix) * objectNormal);
vKytVar = aVar;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vKytWorld;
varying vec3 vKytNormal;
varying float vKytVar;
uniform vec3 uBrushPos;
uniform float uBrushRadius;
uniform float uBrushOpacity;
uniform vec3 uBrushColor;
uniform sampler2D uDryMap;
uniform vec4 uDryRect;
uniform vec3 uDryColor;
uniform vec3 uGrass, uForestFloor, uMeadow, uRock, uSnow, uWater;
uniform vec3 uFlower0, uFlower1, uFlower2;
uniform float uFlowerDensity;
uniform vec3 uFarForest, uFarForestLight, uFarForestDark;
float kytHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
{
  float h = vKytWorld.y;
  float v = vKytVar;
  float up = vKytNormal.y;
  // painted bands: short transitions keep the flat, cel look
  vec3 c = mix(uGrass, uForestFloor, smoothstep(10.0, 22.0, h + v * 6.0));
  c = mix(c, uMeadow, smoothstep(108.0, 122.0, h + v * 8.0));
  c = mix(c, uRock, smoothstep(0.74, 0.66, up));
  c = mix(c, uSnow, smoothstep(175.0 + v * 25.0, 185.0 + v * 25.0, h) * smoothstep(0.3, 0.4, up));
  c = mix(c, uWater, smoothstep(0.8, -0.8, h));

  // Beyond the modelled trees, hills are painted as forest canopy: a cellular
  // pattern of crowns in three tones with dark gaps between them.
  vec2 rect = (vKytWorld.xz - uDryRect.xy) * uDryRect.zw;
  float outside = max(max(-rect.x, rect.x - 1.0), max(-rect.y, rect.y - 1.0));
  float paint = smoothstep(0.0, 0.05, outside + v * 0.04) * smoothstep(6.0, 14.0, h)
    * smoothstep(0.5, 0.62, up) * (1.0 - smoothstep(170.0, 190.0, h));
  if (paint > 0.0) {
    // two offset grids of round crowns (2 lookups instead of a 3x3 cellular search)
    vec2 g = vKytWorld.xz / 3.4;
    vec2 ga = floor(g);
    vec2 pa = ga + vec2(kytHash(ga), kytHash(ga + 7.1)) * 0.5 + 0.25;
    vec2 gb = floor(g + 0.5);
    vec2 pb = gb - 0.5 + vec2(kytHash(gb + 1.7), kytHash(gb + 9.3)) * 0.5 + 0.25;
    float da = length(g - pa);
    float db = length(g - pb);
    float best = min(da, db);
    float id = da < db ? kytHash(ga + 3.3) : kytHash(gb + 5.9);
    vec3 crown = id < 0.35 ? uFarForestDark : id < 0.75 ? uFarForest : uFarForestLight;
    vec3 painted = mix(crown, uFarForestDark * 0.8, smoothstep(0.5, 0.62, best));
    c = mix(c, painted, paint);
  }

  vec2 dryUv = (vKytWorld.xz - uDryRect.xy) * uDryRect.zw;
  float dry = 0.0;
  if (dryUv.x > 0.0 && dryUv.x < 1.0 && dryUv.y > 0.0 && dryUv.y < 1.0) {
    dry = texture2D(uDryMap, dryUv).r;
    c = mix(c, uDryColor, smoothstep(0.3, 0.5, dry) * 0.8);
  }

  // wildflowers: one fleck per ~0.8-unit cell on gentle grass, fading out with distance
  vec2 fc = vKytWorld.xz * 1.25;
  vec2 cell = floor(fc);
  float r = kytHash(cell);
  vec2 centre = vec2(fract(r * 17.13), fract(r * 31.71)) * 0.6 + 0.2;
  float grassy = (1.0 - smoothstep(18.0, 40.0, h)) * smoothstep(0.84, 0.92, up) * (1.0 - step(0.3, dry)) * step(0.8, h);
  float near = 1.0 - smoothstep(60.0, 150.0, length(vViewPosition));
  if (r < uFlowerDensity * grassy && length(fract(fc) - centre) < 0.17 * near) {
    float pick = fract(r * 7.77);
    c = pick < 0.34 ? uFlower0 : pick < 0.67 ? uFlower1 : uFlower2;
  }
  diffuseColor.rgb = c;
}`,
      )
      .replace(
        '#include <opaque_fragment>',
        `if (uBrushOpacity > 0.001) {
  float bd = distance(vKytWorld.xz, uBrushPos.xz);
  float r = uBrushRadius;
  float ring = smoothstep(r + 0.6, r - 0.4, bd) * smoothstep(r - 2.6, r - 0.8, bd);
  float fill = (1.0 - smoothstep(0.0, r, bd)) * 0.14;
  outgoingLight = mix(outgoingLight, uBrushColor, clamp(ring * 0.85 + fill, 0.0, 1.0) * uBrushOpacity);
}
#include <opaque_fragment>`,
      );
  };
  return mat;
}
