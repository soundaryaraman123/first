/**
 * Cel-shaded tree material (MeshToonMaterial + shared toon ramp), one per
 * species so each can take its own palette colours.
 *
 * Procedural trees tag every vertex with `aPart` (0 trunk, 1 canopy,
 * 2 canopy alt, 3 accent); the shader looks the colour up from palette
 * uniforms, so colour changes are live. glTF models use aPart = -1 and keep
 * their own vertex colours.
 */
import * as THREE from 'three';
import type { TreeId } from '../../content/species';
import { terrainUniforms } from '../terrain/terrainMaterial';
import { onPalette, toonRamp } from '../paletteRuntime';
import { TREE_DEFORM, TREE_DEFORM_PARS, treeUniforms } from './treeDeform';

export { treeUniforms };

export function createTreeMaterial(id: TreeId): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp });
  const parts = {
    uTrunk: { value: new THREE.Color() },
    uCanopy: { value: new THREE.Color() },
    uCanopyAlt: { value: new THREE.Color() },
    uAccent: { value: new THREE.Color() },
  };
  const unsubscribe = onPalette((p) => {
    const c = p.trees[id];
    parts.uTrunk.value.set(c.trunk);
    parts.uCanopy.value.set(c.canopy);
    parts.uCanopyAlt.value.set(c.canopyAlt);
    parts.uAccent.value.set(c.accent);
  });
  mat.addEventListener('dispose', unsubscribe);

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, treeUniforms, parts, {
      uBrushPos: terrainUniforms.uBrushPos,
      uBrushRadius: terrainUniforms.uBrushRadius,
      uBrushOpacity: terrainUniforms.uBrushOpacity,
      uBrushColor: terrainUniforms.uBrushColor,
    });
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
${TREE_DEFORM_PARS}
attribute float aPart;
uniform vec3 uTrunk;
uniform vec3 uCanopy;
uniform vec3 uCanopyAlt;
uniform vec3 uAccent;
varying vec2 vKytSite;
varying vec3 vKytPart;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
${TREE_DEFORM}
vKytSite = kytIP.xz;
vKytPart = aPart < -0.5 ? vec3(1.0) : aPart < 0.5 ? uTrunk : aPart < 1.5 ? uCanopy : aPart < 2.5 ? uCanopyAlt : uAccent;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec2 vKytSite;
varying vec3 vKytPart;
uniform vec3 uBrushPos;
uniform float uBrushRadius;
uniform float uBrushOpacity;
uniform vec3 uBrushColor;`,
      )
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vKytPart;')
      .replace(
        '#include <opaque_fragment>',
        // trees inside the section-3 brush get a soft warm highlight (the ring hides under canopy)
        `if (uBrushOpacity > 0.001) {
  float bd = distance(vKytSite, uBrushPos.xz);
  float inside = 1.0 - smoothstep(uBrushRadius - 2.0, uBrushRadius, bd);
  outgoingLight = mix(outgoingLight, uBrushColor, inside * 0.28 * uBrushOpacity);
}
#include <opaque_fragment>`,
      );
  };
  // same program for every species; only uniforms differ
  mat.customProgramCacheKey = () => 'kyt-tree-toon';
  return mat;
}
