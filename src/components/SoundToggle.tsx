import { useUiStore } from '../state/uiStore';
import { setSoundEnabled } from '../audio/audio';
import { site } from '../content/site';
import styles from './SoundToggle.module.css';

/** Fixed sound on/off switch. Sound is off by default. */
export function SoundToggle() {
  const soundOn = useUiStore((s) => s.soundOn);
  const toggle = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    useUiStore.getState().set({ soundOn: next });
  };
  return (
    <button type="button" className={styles.toggle} aria-pressed={soundOn} onClick={toggle}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {soundOn ? (
          <path d="M16 8.5c1.2 1 1.8 2.2 1.8 3.5s-.6 2.5-1.8 3.5M18.5 6c2 1.6 3 3.7 3 6s-1 4.4-3 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        ) : (
          <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </svg>
      <span>{soundOn ? site.soundOn : site.soundOff}</span>
    </button>
  );
}
