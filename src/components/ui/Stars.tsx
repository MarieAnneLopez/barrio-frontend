import { useId } from 'react';
import './stars.css';

const PATH = 'M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z';

/** Una estrella con relleno parcial (0 = vacía, 0.5 = media, 1 = llena). */
export function Star({ fill, size = 20 }: { fill: number; size?: number | undefined }) {
  const clip = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className="stars-icon">
      <defs>
        <clipPath id={clip}>
          <rect x="0" y="0" width={20 * fill} height="20" />
        </clipPath>
      </defs>
      <path d={PATH} className="stars-empty" />
      <path d={PATH} className="stars-full" clipPath={`url(#${clip})`} />
    </svg>
  );
}

interface StarsProps {
  /** Promedio de 0 a 5; null = sin calificaciones. */
  value: number | null;
  /** Texto accesible, p. ej. "4,5 de 5 estrellas". */
  label: string;
  size?: number;
}

/** Calificación de solo lectura (D13: relleno azure, borde sky). */
export function Stars({ value, label, size }: StarsProps) {
  const rounded = value === null ? 0 : Math.round(value * 2) / 2;
  return (
    <span role="img" aria-label={label} className="inline-flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} fill={Math.min(1, Math.max(0, rounded - i))} />
      ))}
    </span>
  );
}
