/**
 * Terrain material: flat-shaded MeshStandardMaterial with two additions
 * injected into the built-in shader:
 *   1. a soft circular "brush" ring (section 3) drawn exactly on the surface
 *   2. a "dryness" map that tints ground under cleared / converted forest
 *
 * Uniforms are module-level singletons so interaction code can drive them
 * without touching React.
 */
import * as THREE from 'three';
import { COLORS, WORLD } from '../config';

const { minX, maxX, minZ, maxZ } = WORLD.treeArea;

export const DRY_MAP_W = 192;
export const DRY_MAP_H = 96;
export const dryMapData = new Uint8Array(DRY_MAP_W * DRY_MAP_H);
export const dryMap = new THREE.DataTexture(dryMapData, DRY_MAP_W, DRY_MAP_H, THREE.RedFormat, THREE.UnsignedByteType);
dryMap.magFilter = THREE.LinearFilter;
dryMap.minFilter = THREE.LinearFilter;
dryMap.needsUpdate = true;

export const terrainUniforms = {
  uBrushPos: { value: new THREE.Vector3(0, -999, 0) },
  uBrushRadius: { value: 26 },
  uBrushOpacity: { value: 0 },
  uBrushColor: { value: new THREE.Color(COLORS.brush) },
  uDryMap: { value: dryMap },
  uDryRect: { value: new THREE.Vector4(minX, minZ, 1 / (maxX - minX), 1 / (maxZ - minZ)) },
  uDryColor: { value: new THREE.Color(COLORS.dryGround) },
};

export function createTerrainMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
    metalness: 0,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, terrainUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vKytWorld;')
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvKytWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vKytWorld;
uniform vec3 uBrushPos;
uniform float uBrushRadius;
uniform float uBrushOpacity;
uniform vec3 uBrushColor;
uniform sampler2D uDryMap;
uniform vec4 uDryRect;
uniform vec3 uDryColor;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec2 dryUv = (vKytWorld.xz - uDryRect.xy) * uDryRect.zw;
if (dryUv.x > 0.0 && dryUv.x < 1.0 && dryUv.y > 0.0 && dryUv.y < 1.0) {
  float dry = texture2D(uDryMap, dryUv).r;
  diffuseColor.rgb = mix(diffuseColor.rgb, uDryColor, smoothstep(0.0, 1.0, dry) * 0.55);
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
