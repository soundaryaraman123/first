import { useRef, useState } from 'react';
import type { SectionProps } from '../registry';
import { useSectionProgress } from '../../scroll/useSectionProgress';
import { healingPlants } from '../../content/healingPlants';
import { species, type PlantId } from '../../content/species';
import { DraftTag } from '../../components/DraftTag';
import { PlantIllustration } from './PlantIllustration';
import styles from './S5HealingPlants.module.css';

/**
 * Section 5 — Healing plants. DOM-only (the 3D canvas pauses underneath).
 * Botanical plates flip open on hover/focus, or on tap/Enter via the toggle.
 * No harvesting locations — by design.
 */
function Plate({ id, numeral, aside = false }: { id: PlantId; numeral: string; aside?: boolean }) {
  const s = species[id];
  const [open, setOpen] = useState(false);
  const backId = `plate-${id}-back`;
  const L = healingPlants.labels;
  return (
    <article className={`${styles.plate} ${aside ? styles.aside : ''}`} data-open={open || undefined}>
      <div className={styles.flipper}>
        <div className={styles.front}>
          <p className={styles.numeral}>Pl. {numeral}</p>
          <div className={styles.drawing}>
            <PlantIllustration id={id} src={healingPlants.plateImages[id]} />
          </div>
          <h3 className={styles.name}>{s.localName}</h3>
          <p className={styles.sci}>{s.scientificName}</p>
        </div>
        <div className={styles.back} id={backId}>
          <p className={styles.numeral}>Pl. {numeral}</p>
          <h3 className={styles.backName}>{s.commonName}</h3>
          <p className={styles.desc}>{s.description}</p>
          <dl className={styles.facts}>
            <div>
              <dt>{L.traditionalUse}</dt>
              <dd>
                {s.traditionalUse} <DraftTag />
              </dd>
            </div>
            <div>
              <dt>{L.altitude}</dt>
              <dd>
                c. {s.altitudeM[0].toLocaleString()}–{s.altitudeM[1].toLocaleString()} m <DraftTag />
              </dd>
            </div>
            <div>
              <dt>{L.conservation}</dt>
              <dd>
                {s.conservation} <DraftTag />
              </dd>
            </div>
          </dl>
        </div>
      </div>
      {/* One real control per plate: toggles the unfolded state for touch & keyboard.
          Hover and focus also unfold it via CSS. */}
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={backId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="visually-hidden">
          {open ? 'Fold' : 'Unfold'} plate: {s.localName}
        </span>
      </button>
    </article>
  );
}

export function S5HealingPlants({ index }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useSectionProgress(ref, index);
  const H = healingPlants;
  return (
    <section ref={ref} id="healing-plants" className={styles.section} aria-labelledby="healing-title">
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>Field notes</p>
          <h2 id="healing-title" className={styles.title}>
            {H.heading}
          </h2>
          <p className={styles.intro}>
            {H.intro} <DraftTag />
          </p>
          <p className={styles.hint}>{H.plateHint}</p>
        </header>

        <div className={styles.grid}>
          {H.order.map((id, i) => (
            <Plate key={id} id={id} numeral={H.romanNumerals[i]} />
          ))}
        </div>

        <div className={styles.asideRow}>
          <div className={styles.asideText}>
            <h3 className={styles.asideHeading}>{H.asideHeading}</h3>
            <p>{species[H.asideId].description}</p>
            <p className={styles.fun}>{species[H.asideId].funFact}</p>
          </div>
          <Plate id={H.asideId} numeral={H.romanNumerals[H.order.length]} aside />
        </div>

        <aside className={styles.note} aria-labelledby="look-dont-pick">
          <svg viewBox="0 0 48 48" className={styles.noteIcon} aria-hidden="true">
            <path d="M4 24 C12 12 36 12 44 24 C36 36 12 36 4 24Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="24" cy="24" r="6" fill="currentColor" />
          </svg>
          <div>
            <h3 id="look-dont-pick" className={styles.noteTitle}>
              {H.lookDontPick.title}
            </h3>
            <p>{H.lookDontPick.body}</p>
          </div>
        </aside>
        <p className={styles.medical}>{H.medicalNote}</p>
      </div>
    </section>
  );
}
