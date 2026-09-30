/**
 * Cel-shaded cumulus clouds.
 *
 *  - Each cloud is a cluster of instanced puffs; puff bottoms are clamped to
 *    the cloud's base height in the shader, giving flat cumulus undersides.
 *  - Three flat tones (shadow / mid / light) from palette.clouds, plus an ink
 *    outline in palette.clouds.outline.
 *  - Layers: a "sea of clouds" over the valley (the camera starts above it and
 *    descends through it; it dissolves as you pass), clouds snagged on the
 *    back peaks, and tall cumulus on the horizon. The last two stay.
 *  - Puffs close to the camera dissolve with an ordered dither (no sorting,
 *    no transparency), and puffs drift apart around the pointer in section 0.
 */
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStore } from '../../state/scrollStore';
import { useUiStore } from '../../state/uiStore';
import { mulberry32, range } from '../../lib/random';
import { smoothstep } from '../../lib/math';
import { onPalette } from '../paletteRuntime';
import { outlineUniforms } from '../outline';
import { pointer } from '../interaction/pointer';

interface CloudSpec {
  count: number;
  x: [number, number];
  z: [number, number];
  base: [number, number];
  size: [number, number];
  layer: number; // 0 = sea of clouds (dissolves on descent), 1 = stays
}

const LAYERS: CloudSpec[] = [
  { count: 115, x: [-620, 620], z: [-280, 420], base: [186, 214], size: [22, 42], layer: 0 },
  { count: 26, x: [-600, 600], z: [-560, -300], base: [230, 290], size: [26, 46], layer: 1 },
  { count: 14, x: [-1300, 1300], z: [-1500, -1000], base: [260, 380], size: [70, 120], layer: 1 },
];

const uniforms = {
  uTime: { value: 0 },
  uLight: { value: new THREE.Color() },
  uShadow: { value: new THREE.Color() },
  uCloudOutline: { value: new THREE.Color() },
  uSunDir: { value: new THREE.Vector3(-260, 300, 220).normalize() },
  uSeaFade: { value: 0 },
  uPointer: { value: new THREE.Vector2() },
  uPart: { value: 0 },
  uAspect: { value: 1 },
};

onPalette((p) => {
  uniforms.uLight.value.set(p.clouds.light);
  uniforms.uShadow.value.set(p.clouds.shadow);
  uniforms.uCloudOutline.value.set(p.clouds.outline);
});

/** Shared vertex logic for the puffs and their outline. Produces `mvPosition` and `vNormalW`. */
const CLOUD_VERTEX = /* glsl */ `
attribute float aBase;
attribute float aLayer;
attribute float aSeed;
uniform float uTime;
uniform float uSeaFade;
uniform vec2 uPointer;
uniform float uPart;
uniform float uAspect;
varying float vFade;
vec4 cloudPosition(vec3 p, out vec3 worldPos) {
  vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
  // slow drift
  world.x += uTime * (1.2 + aSeed * 0.8);
  // flat cumulus bottoms
  world.y = max(world.y, aBase);
  worldPos = world.xyz;
  vec4 mv = viewMatrix * world;
  // part around the pointer (screen space, section 0)
  vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec4 cc = projectionMatrix * viewMatrix * vec4(c, 1.0);
  vec2 ndc = cc.xy / max(cc.w, 1e-3);
  vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
  float fall = 1.0 - smoothstep(0.0, 0.45, length(d));
  mv.xy += normalize(d + 1e-4) * fall * uPart * (-mv.z) * 0.07;
  // dissolve: near the camera, and the sea of clouds once we've descended
  float camFade = smoothstep(25.0, 90.0, -mv.z);
  float layerFade = aLayer < 0.5 ? 1.0 - uSeaFade : 1.0;
  vFade = camFade * layerFade;
  return mv;
}`;

const DITHER = /* glsl */ `
float bayer4(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  int i = int(q.x + q.y * 4.0);
  float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
  return (m[i] + 0.5) / 16.0;
}`;

const puffMaterial = () =>
  new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...uniforms },
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      ${CLOUD_VERTEX}
      varying vec3 vNormalW;
      void main() {
        vec3 wp;
        vec4 mvPosition = cloudPosition(position, wp);
        vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        // flattened undersides face down
        if (wp.y <= aBase + 0.01) vNormalW = vec3(0.0, -1.0, 0.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uLight;
      uniform vec3 uShadow;
      uniform vec3 uSunDir;
      varying vec3 vNormalW;
      varying float vFade;
      ${DITHER}
      void main() {
        if (vFade < bayer4(gl_FragCoord.xy)) discard;
        float ndl = dot(normalize(vNormalW), uSunDir);
        float tone = ndl > 0.25 ? 1.0 : ndl > -0.15 ? 0.55 : 0.0;
        gl_FragColor = vec4(mix(uShadow, uLight, tone), 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });

const outlineMaterial = () =>
  new THREE.ShaderMaterial({
    fog: true,
    side: THREE.BackSide,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      ...uniforms,
      uResolution: outlineUniforms.uResolution,
      uOutlineWidth: outlineUniforms.uOutlineWidth,
    },
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      ${CLOUD_VERTEX}
      uniform vec2 uResolution;
      uniform float uOutlineWidth;
      void main() {
        vec3 wp;
        vec4 mvPosition = cloudPosition(position, wp);
        vec3 nView = normalize(mat3(viewMatrix) * mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vec4 clip = projectionMatrix * mvPosition;
        vec2 dir = (projectionMatrix * vec4(nView, 0.0)).xy;
        float len = length(dir);
        dir = len > 1e-5 ? dir / len : vec2(0.0);
        float px = uOutlineWidth * 1.1 * mix(1.0, 0.45, smoothstep(100.0, 1600.0, -mvPosition.z));
        clip.xy += dir * px * 2.0 / uResolution * clip.w;
        gl_Position = clip;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uCloudOutline;
      varying float vFade;
      ${DITHER}
      void main() {
        if (vFade < bayer4(gl_FragCoord.xy)) discard;
        gl_FragColor = vec4(uCloudOutline, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });

export function Clouds() {
  const tier = useUiStore((s) => s.tier);

  const { puffs, outlines } = useMemo(() => {
    const rng = mulberry32(2718);
    const matrices: THREE.Matrix4[] = [];
    const base: number[] = [];
    const layer: number[] = [];
    const seed: number[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scaleFactor = tier === 'low' ? 0.6 : 1;

    for (const spec of LAYERS) {
      const count = Math.round(spec.count * scaleFactor);
      for (let c = 0; c < count; c++) {
        const cx = range(rng, ...spec.x);
        const cz = range(rng, ...spec.z);
        const cb = range(rng, ...spec.base);
        const size = range(rng, ...spec.size);
        const s = rng();
        const puffCount = 6 + Math.floor(rng() * 7);
        for (let p = 0; p < puffCount; p++) {
          // bigger, taller puffs in the middle; smaller ones at the edges
          const t = p / puffCount;
          const spread = size * (0.35 + t * 0.9);
          const a = rng() * Math.PI * 2;
          const r = size * (0.55 - t * 0.25) * (0.7 + rng() * 0.5);
          const px = cx + Math.cos(a) * spread * 0.9;
          const pz = cz + Math.sin(a) * spread * 0.45;
          const py = cb + r * (0.35 + (1 - t) * 0.5);
          q.setFromEuler(new THREE.Euler(rng() * 3, rng() * 3, rng() * 3));
          m.compose(new THREE.Vector3(px, py, pz), q, new THREE.Vector3(r, r * 0.85, r));
          matrices.push(m.clone());
          base.push(cb);
          layer.push(spec.layer);
          seed.push(s);
        }
      }
    }

    const make = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
      const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
      matrices.forEach((mat, i) => mesh.setMatrixAt(i, mat));
      geometry.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(base), 1));
      geometry.setAttribute('aLayer', new THREE.InstancedBufferAttribute(new Float32Array(layer), 1));
      geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seed), 1));
      mesh.frustumCulled = false;
      return mesh;
    };
    // smooth-normal sphere: rounder toon bands, and a crack-free outline hull
    const puffs = make(new THREE.IcosahedronGeometry(1, 2), puffMaterial());
    const outlines = make(new THREE.IcosahedronGeometry(1, 1), outlineMaterial());
    return { puffs, outlines };
  }, [tier]);

  useEffect(
    () => () => {
      [puffs, outlines].forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
    },
    [puffs, outlines],
  );

  useFrame((state, delta) => {
    const { storyPos } = useScrollStore.getState();
    const { reducedMotion } = useUiStore.getState();
    uniforms.uTime.value = reducedMotion ? 0 : state.clock.elapsedTime;
    uniforms.uAspect.value = state.size.width / Math.max(state.size.height, 1);
    // the sea of clouds dissolves as the camera passes down through it
    uniforms.uSeaFade.value = reducedMotion ? (storyPos > 0.5 ? 1 : 0) : smoothstep(0.45, 0.95, storyPos);
    const wantPart = pointer.inside && !pointer.overUi && !reducedMotion && storyPos < 0.8 ? 1 : 0;
    uniforms.uPart.value += (wantPart - uniforms.uPart.value) * Math.min(1, delta * 3);
    uniforms.uPointer.value.lerp(pointer.ndc, Math.min(1, delta * 5));
    const visible = storyPos < 4.6;
    puffs.visible = visible;
    outlines.visible = visible;
  });

  return (
    <>
      <primitive object={puffs} />
      <primitive object={outlines} />
    </>
  );
}
