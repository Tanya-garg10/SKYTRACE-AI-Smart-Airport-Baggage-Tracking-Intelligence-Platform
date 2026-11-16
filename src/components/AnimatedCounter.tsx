import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';

export function AnimatedCounter({
  value,
  suffix = '',
  className = '',
}: {
  value: number | null | undefined;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const [display, setDisplay] = useState<number>(0);

  useEffect(() => {
    if (value === null || value === undefined || !inView) return;
    const target = Math.max(0, value);
    if (target === 0) {
      setDisplay(0);
      return;
    }
    const duration = 650;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, inView]);

  return (
    <span ref={ref} className={`font-mono tabular-nums ${className}`}>
      {value === null || value === undefined ? '—' : `${display}${suffix}`}
    </span>
  );
}
