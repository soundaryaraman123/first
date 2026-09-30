/**
 * PLACEHOLDER illustrations for the oak/pine comparison (swap for Figma exports).
 * Both share one 800×400 viewBox and the same ground line (GROUND_Y) so the
 * droplet canvas can line up with them.
 */
import { mulberry32 } from '../../lib/random';

export const VIEW_W = 800;
export const VIEW_H = 400;
export const GROUND_Y = 262;

function Sky({ id, top, bottom }: { id: string; top: string; bottom: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width={VIEW_W} height={GROUND_Y} fill={`url(#${id})`} />
    </>
  );
}

export function OakScene() {
  const rng = mulberry32(11);
  const trees = [70, 190, 330, 470, 600, 730];
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Oak forest: layered canopy, shrubs and deep leafy soil">
      <Sky id="oakSky" top="#dfe6de" bottom="#eef0e8" />
      {/* distant ridge */}
      <path d="M0 170 Q120 120 240 150 T480 140 T800 150 V262 H0Z" fill="#c9d1c2" />
      {trees.map((x, i) => {
        const h = 120 + rng() * 40;
        const r = 52 + rng() * 14;
        return (
          <g key={x}>
            <path d={`M${x - 7} ${GROUND_Y} L${x - 4} ${GROUND_Y - h + 30} L${x + 4} ${GROUND_Y - h + 30} L${x + 7} ${GROUND_Y} Z`} fill="#5a4636" />
            <circle cx={x} cy={GROUND_Y - h} r={r} fill={i % 2 ? '#56693f' : '#6c7c55'} />
            <circle cx={x - r * 0.6} cy={GROUND_Y - h + 18} r={r * 0.62} fill="#61744a" />
            <circle cx={x + r * 0.6} cy={GROUND_Y - h + 14} r={r * 0.66} fill="#4f6139" />
            {i % 3 === 1 &&
              [0, 1, 2, 3, 4].map((k) => (
                <circle key={k} cx={x - 30 + k * 15} cy={GROUND_Y - h - 20 + (k % 2) * 22} r={5} fill="#c2382c" />
              ))}
          </g>
        );
      })}
      {/* understory: shrubs, ferns */}
      {Array.from({ length: 16 }, (_, i) => {
        const x = 20 + i * 50 + rng() * 20;
        return <ellipse key={i} cx={x} cy={GROUND_Y - 8} rx={22 + rng() * 10} ry={14 + rng() * 6} fill={i % 2 ? '#7c8f58' : '#6a7d4c'} />;
      })}
      {Array.from({ length: 10 }, (_, i) => {
        const x = 40 + i * 78;
        return (
          <path key={`f${i}`} d={`M${x} ${GROUND_Y} q-12 -22 -26 -26 M${x} ${GROUND_Y} q2 -26 -4 -34 M${x} ${GROUND_Y} q12 -20 26 -24`} stroke="#4f6a35" strokeWidth="3" fill="none" strokeLinecap="round" />
        );
      })}
      {/* deep humus + leaf litter */}
      <rect y={GROUND_Y} width={VIEW_W} height={40} fill="#4a3a2a" />
      {Array.from({ length: 60 }, (_, i) => (
        <ellipse key={`l${i}`} cx={rng() * VIEW_W} cy={GROUND_Y + 3 + rng() * 10} rx={6} ry={2.5} fill={i % 3 ? '#8a6a3c' : '#6f5a33'} />
      ))}
      <rect y={GROUND_Y + 40} width={VIEW_W} height={VIEW_H - GROUND_Y - 40} fill="#6d5842" />
      {/* roots */}
      {trees.map((x) => (
        <path key={`r${x}`} d={`M${x} ${GROUND_Y} q-20 30 -40 50 M${x} ${GROUND_Y} q6 40 -4 70 M${x} ${GROUND_Y} q24 26 44 44`} stroke="#3f3022" strokeWidth="3" fill="none" opacity="0.6" />
      ))}
      {/* spring */}
      <path d={`M0 ${VIEW_H - 38} q40 -10 80 0 v38 h-80z`} fill="#5b8791" opacity="0.8" />
    </svg>
  );
}

export function PineScene() {
  const rng = mulberry32(23);
  const trees = [60, 150, 250, 340, 440, 540, 630, 720];
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Pine forest: tall straight trunks, sparse crowns, bare ground and a thin needle layer">
      <Sky id="pineSky" top="#e6e2d6" bottom="#f1ede2" />
      <path d="M0 170 Q120 120 240 150 T480 140 T800 150 V262 H0Z" fill="#d4ccb8" />
      {trees.map((x, i) => {
        const h = 190 + rng() * 30;
        return (
          <g key={x}>
            <rect x={x - 4} y={GROUND_Y - h} width={8} height={h} fill="#8b5a3a" />
            {[0, 1, 2, 3].map((k) => {
              const y = GROUND_Y - h + k * 18;
              const w = 26 + k * 4;
              return <path key={k} d={`M${x} ${y - 18} L${x - w} ${y + 16} L${x + w} ${y + 16} Z`} fill={(i + k) % 2 ? '#8e9b44' : '#7c8a3c'} />;
            })}
          </g>
        );
      })}
      {/* sparse understory */}
      {[120, 480, 690].map((x) => (
        <ellipse key={x} cx={x} cy={GROUND_Y - 4} rx={12} ry={6} fill="#9a9a62" />
      ))}
      {/* thin needle layer over compact soil */}
      <rect y={GROUND_Y} width={VIEW_W} height={9} fill="#b98a4a" />
      {Array.from({ length: 90 }, (_, i) => {
        const x = rng() * VIEW_W;
        const a = rng() * 0.8 - 0.4;
        return <line key={i} x1={x} y1={GROUND_Y + 3} x2={x + 14 * Math.cos(a)} y2={GROUND_Y + 3 + 6 * Math.sin(a)} stroke="#8f6632" strokeWidth="1.5" />;
      })}
      <rect y={GROUND_Y + 9} width={VIEW_W} height={VIEW_H - GROUND_Y - 9} fill="#a88d6a" />
      <path d={`M0 ${GROUND_Y + 60} h${VIEW_W}`} stroke="#977b58" strokeWidth="2" strokeDasharray="10 14" />
    </svg>
  );
}
