import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStore } from '../state/scrollStore';
import { COLORS } from './config';
import { lerp, smoothstep } from '../lib/math';

/** Sky dome, distance fog and lights. Fog is thick on arrival and thins as you descend. */
export function Atmosphere() {
  const scene = useThree((s) => s.scene);

  const sky = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(COLORS.skyTop) },
        uHorizon: { value: new THREE.Color(COLORS.mist) },
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
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y, 0.0, 1.0);
          vec3 col = mix(uHorizon, uTop, pow(h, 0.55));
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1800, 24, 12), mat);
    mesh.renderOrder = -1;
    return mesh;
  }, []);

  const fog = useMemo(() => new THREE.Fog(COLORS.mist, 80, 700), []);
  scene.fog = fog;
  scene.background = new THREE.Color(COLORS.mist);

  useFrame(({ camera }) => {
    sky.position.copy(camera.position);
    const { storyPos } = useScrollStore.getState();
    // thick mist at arrival (0) -> clear by the old forest (1.2)
    const clear = smoothstep(0.1, 1.2, storyPos);
    fog.near = lerp(60, 170, clear);
    fog.far = lerp(620, 1250, clear);
  });

  return (
    <>
      <primitive object={sky} />
      <hemisphereLight args={[COLORS.hemiSky, COLORS.hemiGround, 1.35]} />
      <directionalLight color={COLORS.sun} intensity={2.1} position={[-260, 300, 220]} />
    </>
  );
}
