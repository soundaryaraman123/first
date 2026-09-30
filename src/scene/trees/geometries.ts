/**
 * Procedural low-poly placeholder trees — one merged, vertex-coloured
 * geometry per species with a distinct silhouette:
 *   rounded oaks · tiered conical deodar · bushy red-flecked rhododendron ·
 *   broad walnut · lobed maple · tall domed horse chestnut ·
 *   spiky, bare-trunked chir pine · soft conical blue pine.
 *
 * Units: world units, base at y = 0. Typical tree height 5–9 units.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { TreeId } from '../../content/species';
import { mulberry32, type Rng } from '../../lib/random';
import { TREE_VISUALS } from './speciesVisuals';

export interface TreeGeometry {
  geometry: THREE.BufferGeometry;
  height: number;
  /** canopy centre height and radius — used for cheap picking */
  canopyY: number;
  canopyR: number;
}

interface PartOpts {
  jitter?: number;
  pos?: [number, number, number];
  scale?: [number, number, number];
  rot?: [number, number, number];
}

class TreeBuilder {
  private parts: THREE.BufferGeometry[] = [];
  constructor(private rng: Rng) {}

  add(src: THREE.BufferGeometry, color: string, o: PartOpts = {}) {
    let g = src.index ? src.toNonIndexed() : src;
    g.deleteAttribute('uv');
    g.deleteAttribute('normal');
    if (o.jitter) this.jitter(g, o.jitter);
    if (o.scale) g.scale(...o.scale);
    if (o.rot) g.rotateX(o.rot[0]).rotateY(o.rot[1]).rotateZ(o.rot[2]);
    if (o.pos) g.translate(...o.pos);
    const col = new THREE.Color(color);
    const n = g.getAttribute('position').count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
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
    geometry.computeVertexNormals(); // non-indexed => flat facet normals
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return describe(geometry);
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

type Maker = (b: TreeBuilder, rng: Rng) => void;

const makers: Record<TreeId, Maker> = {
  banjOak: (b) => {
    const c = TREE_VISUALS.banjOak.colors;
    b.add(cyl(0.18, 0.3, 2.3), c.trunk)
      .add(ico(1.75), c.canopy, { jitter: 0.35, pos: [0, 3.3, 0], scale: [1.1, 0.9, 1.1] })
      .add(ico(1.2), c.canopyAlt!, { jitter: 0.3, pos: [1.0, 3.8, 0.3] })
      .add(ico(1.1), c.canopy, { jitter: 0.3, pos: [-0.9, 3.6, -0.4] });
  },
  kharsuOak: (b) => {
    const c = TREE_VISUALS.kharsuOak.colors;
    b.add(cyl(0.18, 0.3, 2.6), c.trunk)
      .add(ico(1.6), c.canopy, { jitter: 0.35, pos: [0, 4.1, 0], scale: [1, 1.45, 1] })
      .add(ico(1.05), c.canopyAlt!, { jitter: 0.25, pos: [0.2, 5.9, 0.1] });
  },
  rhododendron: (b, rng) => {
    const c = TREE_VISUALS.rhododendron.colors;
    b.add(cyl(0.12, 0.2, 1.3), c.trunk, { rot: [0, 0, 0.15] });
    const blobs: [number, number, number][] = [
      [0, 2.2, 0],
      [0.8, 1.9, 0.3],
      [-0.7, 2.0, -0.4],
      [0.2, 1.8, -0.8],
      [-0.3, 2.7, 0.5],
    ];
    for (const p of blobs) b.add(ico(0.85 + rng() * 0.2), c.canopy, { jitter: 0.25, pos: p });
    for (let i = 0; i < 14; i++) {
      const [x, y, z] = onShell(rng, 1.45, -0.1);
      b.add(ico(0.24), c.accent!, { pos: [x, 2.2 + y * 0.75, z] });
    }
  },
  deodar: (b, rng) => {
    const c = TREE_VISUALS.deodar.colors;
    b.add(cyl(0.14, 0.32, 1.8), c.trunk);
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const r = 2.3 - i * 0.4;
      b.add(cone(r, 2.1, 7), i % 2 ? c.canopyAlt! : c.canopy, {
        jitter: 0.2,
        pos: [0, 1.4 + i * 1.3, 0],
        rot: [0, rng() * Math.PI, 0],
      });
    }
    // the drooping leader
    b.add(cone(0.35, 1.3, 5), c.canopy, { pos: [0.15, 1.4 + tiers * 1.3, 0], rot: [0, 0, -0.35] });
  },
  walnut: (b) => {
    const c = TREE_VISUALS.walnut.colors;
    b.add(cyl(0.26, 0.38, 2.3), c.trunk)
      .add(ico(2.3), c.canopy, { jitter: 0.4, pos: [0, 3.8, 0], scale: [1.25, 0.7, 1.25] })
      .add(ico(1.3), c.canopyAlt!, { jitter: 0.3, pos: [1.6, 3.6, 0.6], scale: [1, 0.75, 1] })
      .add(ico(1.2), c.canopyAlt!, { jitter: 0.3, pos: [-1.5, 3.7, -0.7], scale: [1, 0.75, 1] });
  },
  maple: (b) => {
    const c = TREE_VISUALS.maple.colors;
    b.add(cyl(0.16, 0.28, 2.3), c.trunk)
      .add(ico(1.25), c.canopy, { jitter: 0.3, pos: [0, 3.6, 0] })
      .add(ico(1.1), c.canopy, { jitter: 0.3, pos: [1.0, 3.2, 0.2] })
      .add(ico(1.05), c.canopyAlt!, { jitter: 0.3, pos: [-0.8, 3.3, 0.6] })
      .add(ico(1.0), c.canopy, { jitter: 0.3, pos: [0.1, 4.5, -0.5] });
  },
  horseChestnut: (b, rng) => {
    const c = TREE_VISUALS.horseChestnut.colors;
    b.add(cyl(0.22, 0.36, 2.8), c.trunk).add(ico(1.9, 1), c.canopy, {
      jitter: 0.35,
      pos: [0, 4.8, 0],
      scale: [1, 1.3, 1],
    });
    for (let i = 0; i < 5; i++) {
      const [x, y, z] = onShell(rng, 1.8, 0.3);
      b.add(cone(0.2, 0.5, 4), c.accent!, { pos: [x, 4.7 + y * 1.3, z] });
    }
  },
  chirPine: (b, rng) => {
    const c = TREE_VISUALS.chirPine.colors;
    b.add(cyl(0.11, 0.24, 7.2), c.trunk);
    // sparse spiky crown: tufts pointing out and up from the upper trunk
    const tufts = 9;
    for (let i = 0; i < tufts; i++) {
      const a = (i / tufts) * Math.PI * 2 + rng() * 0.5;
      const y = 5.0 + rng() * 2.6;
      const out = 0.6 + rng() * 0.5;
      b.add(cone(0.5, 1.5, 5), i % 2 ? c.canopy : c.canopyAlt!, {
        pos: [Math.cos(a) * out, y, Math.sin(a) * out],
        rot: [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9],
      });
    }
    b.add(cone(0.55, 1.8, 5), c.canopy, { pos: [0, 7.1, 0] });
  },
  bluePine: (b, rng) => {
    const c = TREE_VISUALS.bluePine.colors;
    b.add(cyl(0.12, 0.25, 2.0), c.trunk);
    for (let i = 0; i < 6; i++) {
      b.add(cone(1.8 - i * 0.26, 1.7, 6), i % 2 ? c.canopyAlt! : c.canopy, {
        jitter: 0.25,
        pos: [0, 1.3 + i * 1.05, 0],
        rot: [0, rng() * Math.PI, 0],
      });
    }
  },
};

export function buildProceduralTree(id: TreeId, seed = 1): TreeGeometry {
  const rng = mulberry32(seed * 7919 + id.length * 31);
  const b = new TreeBuilder(rng);
  makers[id](b, rng);
  return b.build();
}
