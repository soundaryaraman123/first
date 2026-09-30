import { useEffect, useRef, type ReactNode } from 'react';
import styles from './OverlayPanel.module.css';

interface Props {
  children: ReactNode;
  className?: string;
  /** 'left' | 'right' | 'center' placement within its section */
  align?: 'left' | 'right' | 'center';
  as?: 'div' | 'article';
}

/**
 * Readable panel that floats over the 3D scene. Fades/slides in when it
 * enters the viewport (fade only with reduced motion — see global.css).
 */
export function OverlayPanel({ children, className, align = 'left', as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => el.toggleAttribute('data-visible', entry.isIntersecting),
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`${styles.panel} ${styles[align]} ${className ?? ''}`} data-ui-panel="">
      {children}
    </Tag>
  );
}
