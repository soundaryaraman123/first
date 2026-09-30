/**
 * Ink outlines (inverted hull).
 *
 * Each outlined object gets a second mesh drawn with back faces only, pushed
 * outward along smooth normals in *screen space*, so lines stay a constant
 * pixel width close up and thin gently with distance. Lines take the scene
 * fog, so far ridges soften into the haze instead of turning into black noise.
 *
 * Colour and width come from palette.outline (live-editable).
 */
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { onPalette } from './paletteRuntime';
import { TREE_DEFORM, TREE_DEFORM_PARS, treeUniforms } from './trees/treeDeform';

export const outlineUniforms = {
  uOutlineColor: { value: new THREE.Color() },
  uOutlineWidth: { value: 1.5 },
  uResolution: { value: new THREE.Vector2(1, 1) },
};

onPalette((p) => {
  outlineUniforms.uOutlineColor.value.set(p.outline.color);
  outlineUniforms.uOutlineWidth.value = p.outline.width;
});

/** Call once per frame with the renderer's drawing-buffer size. */
export function setOutlineResolution(w: number, h: number) {
  outlineUniforms.uResolution.value.set(w, h);
}

/**
 * Smooth-normal copy of a geometry for the hull. Flat-shaded geometry has
 * split normals at every edge, which would crack the outline; welding
 * vertices first gives one averaged normal per corner.
 */
export function makeHullGeometry(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', src.getAttribute('position').clone());
  if (src.index) g.setIndex(src.index.clone());
  const welded = mergeVertices(g, 1e-3);
  welded.computeVertexNormals();
  return welded;
}

const vertexShader = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
uniform vec2 uResolution;
uniform float uOutlineWidth;
uniform float uWidthScale;
uniform float uFadeStart;
uniform float uFadeEnd;
#ifdef TREE
${TREE_DEFORM_PARS}
#endif
void main() {
  vec3 transformed = position;
  vec3 objectNormal = normal;
  float kytVisible = 1.0;
#ifdef TREE
  ${TREE_DEFORM}
  kytVisible = step(0.03, kytG);
#endif
  vec4 local = vec4(transformed, 1.0);
  vec3 n = objectNormal;
#ifdef USE_INSTANCING
  local = instanceMatrix * local;
  n = mat3(instanceMatrix) * n;
#endif
  vec4 mvPosition = modelViewMatrix * local;
  vec3 nView = normalize(normalMatrix * n);
  vec4 clip = projectionMatrix * mvPosition;
  vec2 dir = (projectionMatrix * vec4(nView, 0.0)).xy;
  float len = length(dir);
  dir = len > 1e-5 ? dir / len : vec2(0.0);
  float dist = -mvPosition.z;
  float px = uOutlineWidth * uWidthScale * mix(1.0, 0.3, smoothstep(uFadeStart, uFadeEnd, dist)) * kytVisible;
  clip.xy += dir * px * 2.0 / uResolution * clip.w;
  gl_Position = clip;
  #include <fog_vertex>
}`;

const fragmentShader = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
uniform vec3 uOutlineColor;
void main() {
  gl_FragColor = vec4(uOutlineColor, 1.0);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

interface OutlineOptions {
  /** apply the tree grow/sway deformation (instanced trees) */
  tree?: boolean;
  /** multiply the palette width (e.g. softer lines on terrain) */
  widthScale?: number;
  /** distance range over which lines thin to 30% */
  fade?: [number, number];
  /** override colour uniform (clouds use their own) */
  color?: { value: THREE.Color };
}

export function createOutlineMaterial(o: OutlineOptions = {}): THREE.ShaderMaterial {
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    ...outlineUniforms,
    ...(o.tree ? treeUniforms : {}),
    uWidthScale: { value: o.widthScale ?? 1 },
    uFadeStart: { value: o.fade?.[0] ?? 40 },
    uFadeEnd: { value: o.fade?.[1] ?? 320 },
  } as Record<string, THREE.IUniform>;
  if (o.color) uniforms.uOutlineColor = o.color;
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.BackSide,
    fog: true,
    defines: o.tree ? { TREE: '' } : {},
  });
}
