import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStore } from '../state/scrollStore';
import { lerp, smoothstep } from '../lib/math';
import { onPalette } from './paletteRuntime';

const SUN_POSITION = new THREE.Vector3(-260, 300, 220);

/**
 * Sky dome (zenith → horizon gradient with a soft sun glow), blue distance
 * haze (fog) for aerial perspective, and the lights. All colours from palette.ts.
 */
export function Atmosphere() {
  const scene = useThree((s) => s.scene);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);

  const sky = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color() },
        uHorizon: { value: new THREE.Color() },
        uSunGlow: { value: new THREE.Color() },
        uSunDir: { value: SUN_POSITION.clone().normalize() },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        uniform vec3 uSunGlow;
        uniform vec3 uSunDir;
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y, 0.0, 1.0);
          vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.55, h));
          float sun = pow(max(dot(normalize(vDir), uSunDir), 0.0), 12.0);
          col = mix(col, uSunGlow, sun * 0.6);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 16), mat);
    mesh.renderOrder = -1;
    mesh.frustumCulled = false;
    return mesh;
  }, []);

  const fog = useMemo(() => new THREE.Fog('#ffffff', 200, 1400), []);
  const background = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    scene.fog = fog;
    scene.background = background;
    const u = (sky.material as THREE.ShaderMaterial).uniforms;
    return onPalette((p) => {
      u.uTop.value.set(p.sky.top);
      u.uHorizon.value.set(p.sky.horizon);
      u.uSunGlow.value.set(p.sky.sunGlow);
      fog.color.set(p.haze);
      background.set(p.sky.horizon);
      if (hemi.current) {
        hemi.current.color.set(p.light.skyFill);
        hemi.current.groundColor.set(p.light.groundFill);
        hemi.current.intensity = p.light.fillIntensity;
      }
      if (sun.current) {
        sun.current.color.set(p.light.sun);
        sun.current.intensity = p.light.sunIntensity;
      }
    });
  }, [scene, fog, background, sky]);

  useFrame(({ camera }) => {
    sky.position.copy(camera.position);
    const { storyPos } = useScrollStore.getState();
    // long clear views above the clouds; a closer haze once down in the valley
    const down = smoothstep(0.3, 1.3, storyPos);
    fog.near = lerp(260, 150, down);
    fog.far = lerp(1900, 1150, down);
  });

  return (
    <>
      <primitive object={sky} />
      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} position={SUN_POSITION.toArray()} />
    </>
  );
}
