/**
 * Procedural placeholder illustrations for the no-WebGL fallback: layered
 * ridges and a forested slope drawn as tree silhouettes, in five states.
 * Deterministic (seeded) so it looks the same every time.
 */
import { useMemo } from 'react';
import { mulberry32 } from '../lib/random';

export type FallbackVariant = 'arrival' | 'oldForest' | 'turn' | 'conversion' | 'whatChanged';

const W = 1600;
const H = 1000;
const NATIVE_COLORS = ['#6c7c55', '#445632', '#3f5631', '#35503f', '#7c9150', '#949a46', '#4d6c38'];

function ridge(rng: () => number, baseY: number, amp: number, step = 80) {
  let d = `M0 ${H} L0 ${baseY}`;
  for (let x = 0; x <= W; x += step) d += ` L${x} ${(baseY - rng() * amp).toFixed(0)}`;
  return `${d} L${W} ${H} Z`;
}

/** y of the forested slope's upper edge at x */
const slopeTop = (x: number) => 420 + Math.sin(x * 0.004) * 30;

export function FallbackLandscape({ variant }: { variant: FallbackVariant }) {
  const content = useMemo(() => {
    const rng = mulberry32(42);
    const ridges = [
      { d: ridge(rng, 300, 140, 60), fill: '#dfe3e0' },
      { d: ridge(rng, 360, 90, 90), fill: '#c6cec6' },
    ];
    const trees: { x: number; y: number; s: number; kind: number; cleared: boolean }[] = [];
    for (let i = 0; i < 520; i++) {
      const x = rng() * W;
      const top = slopeTop(x);
      const y = top + 20 + rng() * (H - top - 60);
      const cleared = (x * 0.013 + y * 0.021) % 3 < 1.1 && rng() > 0.2;
      trees.push({ x, y, s: 0.6 + (y / H) * 0.9, kind: Math.floor(rng() * NATIVE_COLORS.length), cleared });
    }
    trees.sort((a, b) => a.y - b.y);
    const slope =
      `M0 ${slopeTop(0)} ` +
      Array.from({ length: 21 }, (_, i) => `L${i * 80} ${slopeTop(i * 80).toFixed(0)}`).join(' ') +
      ` L${W} ${H} L0 ${H}Z`;
    return { ridges, trees, slope };
  }, []);

  const pine = variant === 'conversion' || variant === 'whatChanged';
  const turn = variant === 'turn';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`fbSky-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c3cdcf" />
          <stop offset="1" stopColor="#e6e9e3" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#fbSky-${variant})`} />
      {content.ridges.map((r, i) => (
        <path key={i} d={r.d} fill={r.fill} />
      ))}
      <path d={content.slope} fill={pine ? '#9b8c63' : '#6b7a4f'} />
      {content.trees.map((t, i) => {
        const g = `translate(${t.x.toFixed(0)} ${t.y.toFixed(0)}) scale(${t.s.toFixed(2)})`;
        if (turn && t.cleared) return <ellipse key={i} cx={t.x} cy={t.y} rx={10 * t.s} ry={3 * t.s} fill="#a88d5f" />;
        if (pine)
          return (
            <g key={i} transform={g}>
              <rect x="-1.5" y="-44" width="3" height="44" fill="#8b5a3a" />
              <path d="M0 -58 L-9 -36 L9 -36Z M0 -46 L-11 -28 L11 -28Z" fill={i % 2 ? '#8e9b44' : '#7c8a3c'} />
            </g>
          );
        return (
          <g key={i} transform={g}>
            <rect x="-2" y="-16" width="4" height="16" fill="#5a4636" />
            {t.kind === 3 ? (
              <path d="M0 -50 L-12 -14 L12 -14Z" fill={NATIVE_COLORS[t.kind]} />
            ) : (
              <circle cx="0" cy="-26" r="15" fill={NATIVE_COLORS[t.kind]} />
            )}
            {t.kind === 2 && <circle cx="5" cy="-30" r="3" fill="#c2382c" />}
          </g>
        );
      })}
      {turn && (
        <path
          d={`M0 ${H - 90} C400 ${H - 120} 900 ${H - 60} ${W} ${H - 100}`}
          stroke="#3b332c"
          strokeWidth="5"
          fill="none"
          strokeDasharray="14 5"
        />
      )}
      {variant === 'arrival' && <rect width={W} height={H} fill="#eef0ec" opacity="0.55" />}
      {variant === 'whatChanged' && <rect width={W} height={H} fill="#eef0ec" opacity="0.35" />}
    </svg>
  );
}
