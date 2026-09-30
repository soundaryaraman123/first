import styles from './ScrollCue.module.css';

/**
 * Scroll cue styled as a painted trail marker: a weathered stone with a
 * red-and-white blaze, and a painted chevron that bobs downward.
 */
export function ScrollCue({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button type="button" className={styles.cue} onClick={onClick}>
      <svg className={styles.stone} viewBox="0 0 64 56" aria-hidden="true">
        <path
          d="M6 44 C4 30 10 14 24 9 C36 5 52 9 58 22 C62 32 60 44 52 49 C40 54 16 54 6 44 Z"
          fill="#a39d90"
          stroke="#6f695d"
          strokeWidth="1.5"
        />
        <path d="M14 36 C22 34 40 34 50 37" stroke="#8b8578" strokeWidth="1" fill="none" opacity="0.6" />
        {/* painted blaze: white – red – white, slightly uneven like brushwork */}
        <path d="M19 17.5 L45 16.5 L45.5 21 L19.5 22 Z" fill="#f3efe6" />
        <path d="M19.5 22.5 L45.5 21.5 L46 27 L19 28 Z" fill="var(--color-accent)" />
        <path d="M19 28.5 L46 27.5 L45.5 32 L19.5 33 Z" fill="#f3efe6" />
      </svg>
      <svg className={styles.chevron} viewBox="0 0 24 14" aria-hidden="true">
        <path d="M2 2 L12 11 L22 2" fill="none" stroke="var(--color-accent)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={styles.label}>{label}</span>
    </button>
  );
}
