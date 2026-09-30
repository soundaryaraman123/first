/**
 * Tree vertex deformation shared by the toon tree material and its outline:
 *   aGrow  0..1  scale + sink (conversion / clearing animations)
 *   aHover 0..1  extra sway when the pointer is over this tree
 *   uWind        gentle wind sway (0 under reduced motion, which also stills hover sway)
 * Operates on `transformed` (local position) before the instance matrix.
 */
export const treeUniforms = {
  uTime: { value: 0 },
  uWind: { value: 1 },
};

export const TREE_DEFORM_PARS = /* glsl */ `
attribute float aGrow;
attribute float aHover;
uniform float uTime;
uniform float uWind;`;

export const TREE_DEFORM = /* glsl */ `
float kytG = clamp(aGrow, 0.0, 1.0);
float kytH = max(transformed.y, 0.0);
vec3 kytIP = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
float kytPh = kytIP.x * 0.13 + kytIP.z * 0.07;
float kytAmp = kytH * kytH * uWind * (0.0016 + 0.018 * aHover);
transformed.x += sin(uTime * (1.3 + aHover * 3.2) + kytPh) * kytAmp;
transformed.z += cos(uTime * (1.1 + aHover * 2.7) + kytPh) * kytAmp * 0.6;
// shrinking trees lean as they go
transformed.x += (1.0 - kytG) * kytH * 0.35;
transformed *= kytG;
transformed.y -= (1.0 - kytG) * 2.5;`;
