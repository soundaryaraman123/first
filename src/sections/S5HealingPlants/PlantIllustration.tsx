/**
 * PLACEHOLDER botanical line drawings (swap for Figma exports: put SVGs in
 * /public/plates/<id>.svg and set `plateImages` in content/healingPlants.ts).
 * Ink outlines with muted washes, in a 200×240 box; ground line at y=190.
 */
import type { PlantId } from '../../content/species';

const INK = '#4a4336';
const LEAF = '#8f9f6a';
const LEAF_DARK = '#6f7f52';
const ROOT = '#a0784c';

const G = 190; // ground line

function Ground() {
  return (
    <>
      <path d={`M20 ${G} H180`} stroke={INK} strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
    </>
  );
}

function Kutki() {
  return (
    <g stroke={INK} strokeWidth="1.2" strokeLinejoin="round">
      {/* creeping rhizome */}
      <path d={`M40 ${G + 12} C70 ${G + 4} 110 ${G + 20} 160 ${G + 10}`} fill="none" stroke={ROOT} strokeWidth="5" strokeLinecap="round" />
      {[60, 90, 125].map((x) => (
        <path key={x} d={`M${x} ${G + 10} l-6 18 M${x} ${G + 10} l5 16`} fill="none" stroke={ROOT} />
      ))}
      {/* spoon-shaped basal leaves */}
      {[-60, -30, 0, 30, 60].map((a, i) => (
        <path key={a} transform={`rotate(${a} 100 ${G})`} d={`M100 ${G} C92 ${G - 20} 90 ${G - 45} 100 ${G - 55} C110 ${G - 45} 108 ${G - 20} 100 ${G}Z`} fill={i % 2 ? LEAF : LEAF_DARK} />
      ))}
      {/* short flower spike */}
      <path d={`M100 ${G - 40} V${G - 110}`} fill="none" />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={100 + (i % 2 ? 5 : -5)} cy={G - 72 - i * 5} r="4" fill="#c9d3e6" />
      ))}
    </g>
  );
}

function Jatamansi() {
  return (
    <g stroke={INK} strokeWidth="1.2">
      {/* hairy rhizome */}
      <path d={`M100 ${G - 4} V${G + 38}`} stroke={ROOT} strokeWidth="10" strokeLinecap="round" />
      {Array.from({ length: 14 }, (_, i) => (
        <path key={i} d={`M${95 + (i % 2) * 10} ${G + i * 2.5} l${i % 2 ? 9 : -9} ${4 + (i % 3)}`} stroke={ROOT} strokeWidth="0.8" />
      ))}
      {/* long basal leaves */}
      {[-24, -10, 8, 22].map((a, i) => (
        <path key={a} transform={`rotate(${a} 100 ${G})`} d={`M100 ${G} C94 ${G - 40} 94 ${G - 80} 100 ${G - 100} C106 ${G - 80} 106 ${G - 40} 100 ${G}Z`} fill={i % 2 ? LEAF : LEAF_DARK} />
      ))}
      {/* flowering stem with rosy cyme */}
      <path d={`M100 ${G - 60} C104 ${G - 100} 98 ${G - 130} 100 ${G - 150}`} fill="none" />
      {Array.from({ length: 11 }, (_, i) => (
        <circle key={i} cx={100 + Math.cos(i * 0.9) * 12} cy={G - 156 + Math.sin(i * 0.9) * 8} r="4.5" fill="#d9a1a8" />
      ))}
    </g>
  );
}

function Dhoop() {
  return (
    <g stroke={INK} strokeWidth="1.2">
      <path d={`M100 ${G} V${G + 42}`} stroke={ROOT} strokeWidth="8" strokeLinecap="round" />
      {/* rosette of deeply lobed leaves, lying flat */}
      {[-80, -45, -15, 15, 45, 80].map((a, i) => (
        <path
          key={a}
          transform={`rotate(${a} 100 ${G - 6})`}
          d={`M100 ${G - 6} l-8 -14 l6 -2 l-8 -16 l7 -1 l-6 -18 l9 6 l9 -6 l-6 18 l7 1 l-8 16 l6 2 z`}
          fill={i % 2 ? LEAF : LEAF_DARK}
        />
      ))}
      {/* stemless purple flower head in the centre */}
      <circle cx="100" cy={G - 12} r="14" fill="#8a6f94" />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M100 ${G - 12} l${Math.cos(i * 0.4) * 18} ${Math.sin(i * 0.4) * 18 - 6}`} stroke="#6d5478" />
      ))}
    </g>
  );
}

function Atish() {
  return (
    <g stroke={INK} strokeWidth="1.2">
      {/* paired tubers */}
      <ellipse cx="92" cy={G + 22} rx="9" ry="16" fill={ROOT} />
      <ellipse cx="110" cy={G + 20} rx="8" ry="13" fill="#b88d5d" />
      <path d={`M100 ${G} C98 ${G - 60} 102 ${G - 110} 100 ${G - 170}`} fill="none" />
      {/* heart-shaped clasping leaves */}
      {[40, 80].map((dy, i) => (
        <path key={dy} d={`M100 ${G - dy} c${i ? -30 : 30} -8 ${i ? -34 : 34} -30 ${i ? -8 : 8} -32 c-8 6 -4 20 0 32z`} fill={LEAF} />
      ))}
      {/* hooded flowers */}
      {[120, 140, 158, 174].map((dy, i) => (
        <g key={dy} transform={`translate(${100 + (i % 2 ? 10 : -10)} ${G - dy})`}>
          <path d="M0 0 c-4 -14 6 -20 12 -12 c2 6 -2 12 -12 12z" fill="#a9a1c9" />
          <path d="M2 -4 c2 -5 5 -8 8 -7" stroke="#6b5f99" fill="none" />
        </g>
      ))}
    </g>
  );
}

function Banafsha() {
  return (
    <g stroke={INK} strokeWidth="1.2">
      <path d={`M100 ${G} v18 M100 ${G} l-10 14 M100 ${G} l9 16`} stroke={ROOT} strokeWidth="2" />
      {/* heart-shaped leaves */}
      {[-50, -18, 18, 50].map((a, i) => (
        <g key={a} transform={`rotate(${a} 100 ${G})`}>
          <path d={`M100 ${G} V${G - 40}`} fill="none" />
          <path d={`M100 ${G - 36} c-20 -4 -22 -30 -6 -34 c4 0 6 2 6 6 c0 -4 2 -6 6 -6 c16 4 14 30 -6 34z`} fill={i % 2 ? LEAF : LEAF_DARK} />
        </g>
      ))}
      {/* nodding violets on slender stalks */}
      {[
        [70, 110],
        [128, 100],
        [100, 130],
      ].map(([x, h], i) => (
        <g key={i}>
          <path d={`M100 ${G} C${x} ${G - h * 0.6} ${x} ${G - h} ${x + 6} ${G - h}`} fill="none" />
          <g transform={`translate(${x + 8} ${G - h + 4})`} fill="#8d6fb0">
            <ellipse cx="-5" cy="-5" rx="5" ry="7" transform="rotate(-30)" />
            <ellipse cx="5" cy="-5" rx="5" ry="7" transform="rotate(30)" />
            <ellipse cx="0" cy="5" rx="6" ry="6" fill="#a58bc4" />
          </g>
        </g>
      ))}
    </g>
  );
}

function Guchhi() {
  const cells = [];
  // honeycomb pits, narrowing toward the tip of the cap
  for (let r = 0; r < 7; r++) {
    const y = G - 124 + r * 9.5;
    const half = 5 + r * 1.6;
    const n = r < 2 ? 2 : r < 4 ? 3 : 4;
    for (let c = 0; c < n; c++) {
      const x = 101 - half + ((c + 0.5) / n) * half * 2 + (r % 2 ? 1 : -1);
      cells.push(<ellipse key={`${r}-${c}`} cx={x} cy={y} rx={Math.min(3.2, half / n)} ry="3.6" fill="#5e4632" />);
    }
  }
  return (
    <g stroke={INK} strokeWidth="1.2">
      {/* hollow white stem */}
      <path d={`M88 ${G} C86 ${G - 30} 88 ${G - 50} 90 ${G - 58} H112 C114 ${G - 50} 116 ${G - 30} 114 ${G}Z`} fill="#efe6d2" />
      {/* honeycombed conical cap */}
      <path d={`M88 ${G - 56} C82 ${G - 90} 90 ${G - 130} 101 ${G - 140} C112 ${G - 130} 120 ${G - 90} 114 ${G - 56}Z`} fill="#a7835a" />
      {cells}
      <path d={`M60 ${G} q40 -8 80 0`} stroke="#8a6a3c" fill="none" />
    </g>
  );
}

const DRAWINGS: Record<PlantId, () => React.JSX.Element> = {
  kutki: Kutki,
  jatamansi: Jatamansi,
  dhoop: Dhoop,
  atish: Atish,
  banafsha: Banafsha,
  guchhi: Guchhi,
};

export function PlantIllustration({ id, src }: { id: PlantId; src?: string | null }) {
  if (src) return <img src={src} alt="" loading="lazy" />;
  const Drawing = DRAWINGS[id];
  return (
    <svg viewBox="0 0 200 240" aria-hidden="true">
      <Ground />
      <Drawing />
    </svg>
  );
}
