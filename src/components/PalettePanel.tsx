/**
 * Live colour panel for the 3D scene — open the site with ?palette.
 *
 * Every entry in scene/palette.ts gets a control (colour picker or slider).
 * Changes apply instantly and are remembered in this browser. When you like
 * the result, "Copy palette" puts a ready-to-paste `export const palette = …`
 * block on the clipboard: replace the object in src/scene/palette.ts with it.
 */
import { useReducer, useState } from 'react';
import { livePalette, resetPalette, setPaletteValue } from '../scene/paletteRuntime';
import styles from './PalettePanel.module.css';

type Path = (string | number)[];

/** slider ranges for numeric entries (by key) */
const RANGES: Record<string, [number, number, number]> = {
  sunIntensity: [0, 5, 0.05],
  fillIntensity: [0, 3, 0.05],
  width: [0, 4, 0.1],
  flowerDensity: [0, 1, 0.01],
  steps: [0, 1, 0.01],
};

const GROUP_LABELS: Record<string, string> = {
  sky: 'Sky',
  haze: 'Distance haze',
  clouds: 'Clouds',
  light: 'Light',
  toon: 'Cel shading bands',
  outline: 'Outlines',
  terrain: 'Ground',
  trees: 'Trees',
  brush: 'Brush ring',
};

const humanize = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

export default function PalettePanel() {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const set = (path: Path, value: unknown) => {
    setPaletteValue(path, value);
    rerender();
  };

  const copy = async () => {
    const text = `export const palette = ${JSON.stringify(livePalette, null, 2)};\n`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy the palette:', text);
    }
  };

  function control(key: string, value: unknown, path: Path, label = humanize(key)): React.ReactNode {
    const id = `pal-${path.join('-')}`;
    if (typeof value === 'string' && value.startsWith('#')) {
      return (
        <label key={id} className={styles.row} htmlFor={id}>
          <span>{label}</span>
          <input id={id} type="color" value={value} onChange={(e) => set(path, e.target.value)} />
        </label>
      );
    }
    if (typeof value === 'number') {
      const [min, max, step] = RANGES[key] ?? RANGES[String(path[path.length - 2])] ?? [0, 1, 0.01];
      return (
        <label key={id} className={styles.row} htmlFor={id}>
          <span>{label}</span>
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => set(path, Number(e.target.value))}
          />
          <output className={styles.num}>{value.toFixed(2)}</output>
        </label>
      );
    }
    if (Array.isArray(value)) {
      return (
        <div key={id} className={styles.subgroup}>
          <p className={styles.subhead}>{label}</p>
          {value.map((v, i) => control(key, v, [...path, i], `${label} ${i + 1}`))}
        </div>
      );
    }
    if (value && typeof value === 'object') {
      return (
        <div key={id} className={styles.subgroup}>
          <p className={styles.subhead}>{label}</p>
          {Object.entries(value).map(([k, v]) => control(k, v, [...path, k]))}
        </div>
      );
    }
    return null;
  }

  return (
    <aside className={styles.panel} data-ui-panel="" data-lenis-prevent="" data-open={open || undefined} aria-label="Scene colours">
      <header className={styles.header}>
        <button type="button" className={styles.toggle} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          Scene colours
        </button>
        {open && (
          <div className={styles.actions}>
            <button type="button" onClick={copy}>
              {copied ? 'Copied' : 'Copy palette'}
            </button>
            <button
              type="button"
              onClick={() => {
                resetPalette();
                rerender();
              }}
            >
              Reset
            </button>
          </div>
        )}
      </header>
      {open && (
        <div className={styles.body}>
          <p className={styles.help}>
            Changes apply live and are saved in this browser. Copy the palette and paste it into{' '}
            <code>src/scene/palette.ts</code> to keep it.
          </p>
          {Object.entries(livePalette).map(([group, value]) => (
            <details key={group} className={styles.group} open={group === 'sky' || group === 'trees'}>
              <summary>{GROUP_LABELS[group] ?? humanize(group)}</summary>
              {value && typeof value === 'object' && !Array.isArray(value)
                ? Object.entries(value).map(([k, v]) => control(k, v, [group, k]))
                : control(group, value, [group])}
            </details>
          ))}
        </div>
      )}
    </aside>
  );
}
