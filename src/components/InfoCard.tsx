import { useEffect, useRef } from 'react';
import { useUiStore } from '../state/uiStore';
import { species } from '../content/species';
import { DraftTag } from './DraftTag';
import styles from './InfoCard.module.css';

/**
 * Species info card. A native <dialog> opened modally: focus is trapped
 * inside, Esc closes it, and focus returns to where it was.
 */
export function InfoCard() {
  const id = useUiStore((s) => s.infoSpecies);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (id && !d.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      d.showModal();
    } else if (!id && d.open) {
      d.close();
    }
  }, [id]);

  const close = () => useUiStore.getState().set({ infoSpecies: null });

  const onClose = () => {
    close();
    returnFocus.current?.focus?.();
  };

  const s = id ? species[id] : null;
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="info-card-title"
      onClose={onClose}
      onClick={(e) => {
        // click on the backdrop closes
        if (e.target === dialogRef.current) close();
      }}
    >
      {s && (
        <article className={styles.card}>
          <form method="dialog" className={styles.closeForm}>
            <button className={styles.close} autoFocus aria-label="Close species card">
              <span aria-hidden="true">×</span>
              <span className={styles.kbd} aria-hidden="true">
                Esc
              </span>
            </button>
          </form>
          <header className={styles.header}>
            <p className={styles.kicker}>{s.kind === 'pine' ? 'Species card · pine' : 'Species card'}</p>
            <h2 id="info-card-title" className={styles.title}>
              {s.commonName}
              <span className={styles.local}> · {s.localName}</span>
            </h2>
            <p className={styles.sci}>{s.scientificName}</p>
          </header>
          <p>
            {s.description} <DraftTag />
          </p>
          {s.traits && (
            <dl className={styles.traits}>
              {s.traits.map((t) => (
                <div key={t.label} className={styles.trait}>
                  <dt>{t.label}</dt>
                  <dd>{t.text}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className={styles.meta}>
            <span>Grows roughly</span> {s.altitudeM[0].toLocaleString()}–{s.altitudeM[1].toLocaleString()} m <DraftTag />
          </p>
          <p className={styles.fun}>{s.funFact}</p>
        </article>
      )}
    </dialog>
  );
}
