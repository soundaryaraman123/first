/**
 * Section 0 mist: a few camera-facing planes at increasing depth, each
 * shading drifting fBm noise. Near the pointer the mist thins and swirls
 * aside (screen-space, so it's cheap). As section 0 scrolls, the mist
 * lifts (rises + fades); after the old forest arrives the layers are hidden.
 *
 * Cost: N full-screen-ish transparent quads with 3-octave value noise.
 * Low tier uses fewer layers and octaves.
 */
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStore } from '../../state/scrollStore';
import { useUiStore } from '../../state/uiStore';
import { pointer } from '../interaction/pointer';
import { COLORS } from '../config';
import { smoothstep } from '../../lib/math';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;
  uniform float uScale;
  uniform vec2 uPointer;      // 0..1 screen
  uniform float uPointerAmt;  // 0..1
  uniform vec2 uResolution;
  uniform vec3 uColor;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < OCTAVES; i++) {
      s += a * vnoise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return s;
  }

  void main() {
    vec2 screen = gl_FragCoord.xy / uResolution;
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 toP = (screen - uPointer) * aspect;
    float d = length(toP);
    float part = 1.0 - smoothstep(0.0, 0.22, d);      // 1 at the pointer
    float swirl = part * uPointerAmt;

    vec2 uv = vUv * uScale * vec2(aspect.x, 1.0);
    // push the noise field away from the pointer, with a slight curl
    uv += normalize(toP + 1e-4) * swirl * 0.35 + vec2(-toP.y, toP.x) * swirl * 0.25;
    uv += vec2(uTime * 0.018, uTime * 0.006) + uSeed;

    float n = fbm(uv);
    float wisps = smoothstep(0.32, 0.78, n);
    // denser toward the bottom of each layer
    float vertical = smoothstep(1.05, 0.3, vUv.y) * smoothstep(0.0, 0.18, vUv.y);
    float alpha = wisps * vertical * uOpacity * (1.0 - swirl * 0.85);
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }`;

const DEPTHS = [22, 45, 80, 130, 200];
const tmpPointer = new THREE.Vector2();
const forward = new THREE.Vector3();

export function FogLayers() {
  const tier = useUiStore((s) => s.tier);
  const size = useThree((s) => s.size);
  const group = useRef<THREE.Group>(null);
  const lift = useRef(0);
  const pointerAmt = useRef(0);
  const smoothPointer = useRef(new THREE.Vector2(0.5, 0.5));

  const layers = useMemo(() => {
    const depths = tier === 'low' ? [30, 90, 180] : DEPTHS;
    return depths.map((depth, i) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        fog: false,
        defines: { OCTAVES: tier === 'low' ? 3 : 4 },
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0.78 - i * 0.06 },
          uSeed: { value: i * 13.7 },
          uScale: { value: 2.2 + i * 0.5 },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uPointerAmt: { value: 0 },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uColor: { value: new THREE.Color(COLORS.mist) },
        },
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      mesh.renderOrder = 10 + (depths.length - i); // far layers first
      mesh.frustumCulled = false;
      return { mesh, mat, depth, baseOpacity: mat.uniforms.uOpacity.value as number };
    });
  }, [tier]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const { storyPos, activeIndex } = useScrollStore.getState();
    const { reducedMotion } = useUiStore.getState();
    const cam = state.camera as THREE.PerspectiveCamera;

    // lift: scrubbed by scroll, or a simple timed fade with reduced motion
    const target = reducedMotion ? (activeIndex > 0 ? 1 : 0) : smoothstep(0.02, 0.85, storyPos);
    lift.current = reducedMotion
      ? lift.current + Math.sign(target - lift.current) * Math.min(Math.abs(target - lift.current), delta * 2)
      : target;
    g.visible = lift.current < 0.999;
    if (!g.visible) return;

    // pointer influence eases in when the pointer moves over the scene
    const wantPointer = pointer.inside && !pointer.overUi && !reducedMotion ? 1 : 0;
    pointerAmt.current += (wantPointer - pointerAmt.current) * Math.min(1, delta * 3);
    tmpPointer.set(pointer.clientX / size.width, 1 - pointer.clientY / size.height);
    smoothPointer.current.lerp(tmpPointer, Math.min(1, delta * 6));

    const dpr = state.gl.getPixelRatio();
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    cam.getWorldDirection(forward);

    for (const { mesh, mat, depth, baseOpacity } of layers) {
      const h = 2 * depth * halfH * 1.7;
      const w = h * cam.aspect;
      mesh.position.copy(cam.position).addScaledVector(forward, depth);
      mesh.quaternion.copy(cam.quaternion);
      // rise as it lifts (in view space, so it looks like the mist drifting upward)
      mesh.translateY(lift.current * h * 0.55);
      mesh.scale.set(w, h, 1);
      const u = mat.uniforms;
      u.uTime.value = t;
      u.uOpacity.value = baseOpacity * (1 - lift.current);
      u.uPointer.value.copy(smoothPointer.current);
      u.uPointerAmt.value = pointerAmt.current;
      u.uResolution.value.set(size.width * dpr, size.height * dpr);
    }
  });

  return (
    <group ref={group}>
      {layers.map(({ mesh }, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </group>
  );
}
