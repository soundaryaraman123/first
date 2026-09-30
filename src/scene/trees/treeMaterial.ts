/**
 * Shared tree material: flat-shaded, vertex-coloured, instanced.
 * Injected per-instance attributes:
 *   aGrow  0..1  scale + sink (conversion / clearing animations)
 *   aHover 0..1  extra sway when the pointer is over this tree
 * and a gentle wind sway driven by uTime.
 */
import * as THREE from 'three';
import { terrainUniforms } from '../terrain/terrainMaterial';

export const treeUniforms = {
  uTime: { value: 0 },
  uWind: { value: 1 },
};

export function createTreeMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.95,
    metalness: 0,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, treeUniforms, {
      uBrushPos: terrainUniforms.uBrushPos,
      uBrushRadius: terrainUniforms.uBrushRadius,
      uBrushOpacity: terrainUniforms.uBrushOpacity,
      uBrushColor: terrainUniforms.uBrushColor,
    });
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aGrow;
attribute float aHover;
uniform float uTime;
uniform float uWind;
varying vec2 vKytSite;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
float kytG = clamp(aGrow, 0.0, 1.0);
float kytH = max(transformed.y, 0.0);
vec3 kytIP = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
float kytPh = kytIP.x * 0.13 + kytIP.z * 0.07;
// uWind is 0 under reduced motion, which also stills the hover sway
float kytAmp = kytH * kytH * uWind * (0.0016 + 0.018 * aHover);
transformed.x += sin(uTime * (1.3 + aHover * 3.2) + kytPh) * kytAmp;
transformed.z += cos(uTime * (1.1 + aHover * 2.7) + kytPh) * kytAmp * 0.6;
// shrinking trees lean as they go
transformed.x += (1.0 - kytG) * kytH * 0.35;
transformed *= kytG;
transformed.y -= (1.0 - kytG) * 2.5;
vKytSite = kytIP.xz;`,
      );
    // trees inside the section-3 brush get a soft warm highlight (the ring itself hides under canopy)
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec2 vKytSite;
uniform vec3 uBrushPos;
uniform float uBrushRadius;
uniform float uBrushOpacity;
uniform vec3 uBrushColor;`,
      )
      .replace(
        '#include <opaque_fragment>',
        `if (uBrushOpacity > 0.001) {
  float bd = distance(vKytSite, uBrushPos.xz);
  float inside = 1.0 - smoothstep(uBrushRadius - 2.0, uBrushRadius, bd);
  outgoingLight = mix(outgoingLight, uBrushColor, inside * 0.28 * uBrushOpacity);
}
#include <opaque_fragment>`,
      );
  };
  // one program for every species
  mat.customProgramCacheKey = () => 'kyt-tree';
  return mat;
}
