/**
 * Procedural placeholder trees in a cel-shaded, storybook style — one merged
 * geometry per species with a distinct silhouette:
 *   puffy rounded oaks · layered drooping deodar · bushy red-flowered
 *   rhododendron · broad walnut · lobed maple · domed horse chestnut ·
 *   spiky, bare-trunked chir pine · soft tiered blue pine.
 *
 * Colours are NOT baked in: every vertex carries `aPart`
 * (0 trunk · 1 canopy · 2 canopy alt · 3 accent) and the shader reads the
 * actual colour from palette.ts, so palette edits apply live.
 *
 * Units: world units, base at y = 0. Typical tree height 5–10 units.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { TreeId } from '../../content/species';
import { mulberry32, type Rng } from '../../lib/random';

export interface TreeGeometry {
  geometry: THREE.BufferGeometry;
  height: number;
  /** canopy centre height and radius — used for cheap picking */
  canopyY: number;
  canopyR: number;
}

/** palette slots (see treeMaterial.ts) */
export const PART = { trunk: 0, canopy: 1, alt: 2, accent: 3 } as const;
type Part = (typeof PART)[keyof typeof PART];

interface PartOpts {
  jitter?: number;
  pos?: [number, number, number];
  scale?: [number, number, number];
  rot?: [number, number, number];
  /** lower the outer rim of a cone (drooping conifer tiers) */
  droop?: number;
}

class TreeBuilder {
  private parts: THREE.BufferGeometry[] = [];
  constructor(private rng: Rng) {}

  add(src: THREE.BufferGeometry, part: Part, o: PartOpts = {}) {
    const g = src.index ? src.toNonIndexed() : src;
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    if (o.droop) droopRim(g, o.droop);
    if (o.jitter) this.jitter(g, o.jitter);
    if (o.scale) g.scale(...o.scale);
    if (o.rot) g.rotateX(o.rot[0]).rotateY(o.rot[1]).rotateZ(o.rot[2]);
    if (o.pos) g.translate(...o.pos);
    const n = g.getAttribute('position').count;
    g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(n).fill(part), 1));
    // white vertex colour: the palette colour is multiplied in by the shader
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
    this.parts.push(g);
    return this;
  }

  /** Displace shared vertices identically so faces stay closed. */
  private jitter(g: THREE.BufferGeometry, amount: number) {
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    const offsets = new Map<string, [number, number, number]>();
    for (let i = 0; i < pos.count; i++) {
      const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
      let o = offsets.get(key);
      if (!o) {
        o = [(this.rng() - 0.5) * amount, (this.rng() - 0.5) * amount, (this.rng() - 0.5) * amount];
        offsets.set(key, o);
      }
      pos.setXYZ(i, pos.getX(i) + o[0], pos.getY(i) + o[1], pos.getZ(i) + o[2]);
    }
  }

  build(): TreeGeometry {
    const geometry = mergeGeometries(this.parts, false)!;
    geometry.computeVertexNormals(); // non-indexed => faceted normals, crisp toon bands
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return describe(geometry);
  }
}

/** Pull a cone's outer base ring down so tiers hang like fir boughs. */
function droopRim(g: THREE.BufferGeometry, amount: number) {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  let maxR = 0;
  for (let i = 0; i < pos.count; i++) maxR = Math.max(maxR, Math.hypot(pos.getX(i), pos.getZ(i)));
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    if (pos.getY(i) < 0.01 && r > maxR * 0.6) pos.setY(i, pos.getY(i) - amount * (r / maxR));
  }
}

/** Derive picking metadata from a geometry's bounds (also used for glTF models). */
export function describe(geometry: THREE.BufferGeometry): TreeGeometry {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const height = bb.max.y;
  const halfW = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2;
  return {
    geometry,
    height,
    canopyY: height * 0.62,
    canopyR: Math.max(halfW, height * 0.3),
  };
}

// primitives, base at y = 0 where it makes sense
const ico = (r: number, detail = 0) => new THREE.IcosahedronGeometry(r, detail);
const oct = (r: number) => new THREE.OctahedronGeometry(r, 0);
const cone = (r: number, h: number, seg = 7) => new THREE.ConeGeometry(r, h, seg, 1).translate(0, h / 2, 0);
const cyl = (rTop: number, rBot: number, h: number, seg = 5) =>
  new THREE.CylinderGeometry(rTop, rBot, h, seg, 1).translate(0, h / 2, 0);

/** random point on a sphere shell */
function onShell(rng: Rng, r: number, minY = -0.2): [number, number, number] {
  const u = rng() * Math.PI * 2;
  const v = minY + rng() * (1 - minY);
  const s = Math.sqrt(1 - v * v);
  return [Math.cos(u) * s * r, v * r, Math.sin(u) * s * r];
}

const { trunk: T, canopy: C, alt: A, accent: X } = PART;
type Maker = (b: TreeBuilder, rng: Rng) => void;

/** Layered fir: drooping tiers stacked up a trunk (deodar, blue pine). */
function fir(b: TreeBuilder, rng: Rng, o: { tiers: number; base: number; step: number; r0: number; shrink: number; droop: number; trunkH: number }) {
  b.add(cyl(0.14, 0.32, o.trunkH), T);
  for (let i = 0; i < o.tiers; i++) {
    const r = o.r0 - i * o.shrink;
    b.add(cone(r, r * 1.05, 8), i % 2 ? A : C, {
      droop: o.droop * (1 - i / o.tiers),
      jitter: 0.12,
      pos: [0, o.base + i * o.step, 0],
      rot: [0, rng() * Math.PI, 0],
    });
  }
}

const makers: Record<TreeId, Maker> = {
  banjOak: (b) => {
    b.add(cyl(0.18, 0.32, 2.4), T)
      .add(ico(1.8, 1), C, { jitter: 0.3, pos: [0, 3.5, 0], scale: [1.1, 0.88, 1.1] })
      .add(ico(1.2), A, { jitter: 0.25, pos: [1.1, 4.0, 0.3] })
      .add(ico(1.1), A, { jitter: 0.25, pos: [-1.0, 3.8, -0.5] });
  },
  kharsuOak: (b) => {
    b.add(cyl(0.18, 0.3, 2.6), T)
      .add(ico(1.6, 1), C, { jitter: 0.3, pos: [0, 4.2, 0], scale: [1, 1.4, 1] })
      .add(ico(1.05), A, { jitter: 0.2, pos: [0.2, 6.1, 0.1] });
  },
  rhododendron: (b, rng) => {
    b.add(cyl(0.12, 0.2, 1.3), T, { rot: [0, 0, 0.15] });
    const blobs: [number, number, number][] = [
      [0, 2.2, 0],
      [0.8, 1.9, 0.3],
      [-0.7, 2.0, -0.4],
      [-0.2, 2.7, 0.5],
    ];
    blobs.forEach((p, i) => b.add(ico(0.95 + rng() * 0.2), i % 2 ? A : C, { jitter: 0.2, pos: p }));
    for (let i = 0; i < 12; i++) {
      const [x, y, z] = onShell(rng, 1.5, -0.1);
      b.add(oct(0.28), X, { pos: [x, 2.2 + y * 0.75, z] });
    }
  },
  deodar: (b, rng) => {
    fir(b, rng, { tiers: 6, base: 1.3, step: 1.15, r0: 2.4, shrink: 0.34, droop: 0.7, trunkH: 1.8 });
    // the nodding leader
    b.add(cone(0.35, 1.3, 5), C, { pos: [0.15, 1.3 + 6 * 1.15, 0], rot: [0, 0, -0.35] });
  },
  walnut: (b) => {
    b.add(cyl(0.26, 0.4, 2.3), T)
      .add(ico(2.3, 1), C, { jitter: 0.35, pos: [0, 3.9, 0], scale: [1.25, 0.7, 1.25] })
      .add(ico(1.3), A, { jitter: 0.25, pos: [1.7, 3.6, 0.6], scale: [1, 0.75, 1] })
      .add(ico(1.2), A, { jitter: 0.25, pos: [-1.6, 3.7, -0.7], scale: [1, 0.75, 1] });
  },
  maple: (b) => {
    b.add(cyl(0.16, 0.28, 2.3), T)
      .add(ico(1.3, 1), C, { jitter: 0.25, pos: [0, 3.7, 0] })
      .add(ico(1.1), C, { jitter: 0.25, pos: [1.0, 3.3, 0.2] })
      .add(ico(1.05), A, { jitter: 0.25, pos: [-0.8, 3.4, 0.6] })
      .add(ico(1.0), A, { jitter: 0.25, pos: [0.1, 4.6, -0.5] });
  },
  horseChestnut: (b, rng) => {
    b.add(cyl(0.22, 0.36, 2.8), T).add(ico(1.9, 1), C, { jitter: 0.3, pos: [0, 4.8, 0], scale: [1, 1.3, 1] });
    b.add(ico(1.1), A, { jitter: 0.2, pos: [0.9, 5.6, 0.4] });
    for (let i = 0; i < 3; i++) {
      const [x, y, z] = onShell(rng, 1.8, 0.3);
      b.add(oct(0.24), X, { pos: [x, 4.7 + y * 1.3, z], scale: [1, 1.6, 1] });
    }
  },
  chirPine: (b, rng) => {
    b.add(cyl(0.11, 0.24, 7.2), T);
    // sparse, spiky crown: tufts pointing out and up from the upper trunk
    const tufts = 9;
    for (let i = 0; i < tufts; i++) {
      const a = (i / tufts) * Math.PI * 2 + rng() * 0.5;
      const y = 5.0 + rng() * 2.6;
      const out = 0.6 + rng() * 0.5;
      b.add(cone(0.55, 1.5, 5), i % 2 ? C : A, {
        pos: [Math.cos(a) * out, y, Math.sin(a) * out],
        rot: [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9],
      });
    }
    b.add(cone(0.6, 1.8, 5), C, { pos: [0, 7.1, 0] });
  },
  bluePine: (b, rng) => {
    fir(b, rng, { tiers: 7, base: 1.2, step: 0.95, r0: 1.9, shrink: 0.24, droop: 0.55, trunkH: 2.0 });
  },
};

export function buildProceduralTree(id: TreeId, seed = 1): TreeGeometry {
  const rng = mulberry32(seed * 7919 + id.length * 31);
  const b = new TreeBuilder(rng);
  makers[id](b, rng);
  return b.build();
}
