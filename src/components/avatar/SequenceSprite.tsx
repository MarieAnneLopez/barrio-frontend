import './sequence.css';
import type { CSSProperties } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cellWidth, FRAME_MS, sequenceSpec, spriteUrl, type SequenceName } from './sequences';

interface Props {
  name: SequenceName;
  /** Alto en px: uno de los tamaños fijos de la secuencia (escala entera, D86). */
  size: number;
  /** Pose fija (índice desde 0) con movimiento reducido o si playing = false. */
  pose?: number;
  playing?: boolean;
  /** Desfase dentro del ciclo (0–1): varias a la vez no se mueven al unísono. */
  phase?: number;
  className?: string;
}

/**
 * Secuencia de Mini Marie dibujada por Marie (H33): una tira de cuadros que se desliza con
 * transform y steps(), así nunca se repinta. Escala entera (D86): la caja mide exactamente el
 * recurso (1:1, o 2:1 exacto en pantallas 2×) y el paso entre cuadros es un número entero de
 * píxeles. Movimiento reducido: pose estática. Decorativa: el texto lo da quien la usa.
 */
export function SequenceSprite({ name, size, pose = 0, playing = true, phase = 0, className = '' }: Props) {
  const reduced = useReducedMotion();
  const { frames, sizes } = sequenceSpec(name);
  const width = cellWidth(name, size);
  const animate = playing && !reduced;
  const cycle = frames * FRAME_MS[name];
  const motion: CSSProperties = animate
    ? { animationDuration: `${cycle}ms`, animationTimingFunction: `steps(${frames})`, animationDelay: `${-phase * cycle}ms` }
    : { transform: `translateX(${-pose * width}px)` };
  const twice = sizes.includes(size * 2) ? `${spriteUrl(name, size)} 1x, ${spriteUrl(name, size * 2)} 2x` : undefined;
  return (
    <span className={`sequence ${className}`} style={{ width, height: size }} data-sequence={name} data-playing={animate || undefined} aria-hidden="true">
      <img
        className="sequence__strip"
        src={spriteUrl(name, size)}
        srcSet={twice}
        alt=""
        draggable={false}
        style={{ ...motion, width: frames * width, height: size }}
      />
    </span>
  );
}
