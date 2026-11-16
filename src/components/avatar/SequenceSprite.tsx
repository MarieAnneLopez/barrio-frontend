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

/** Densidad de pantalla desde la que conviene cada múltiplo: el cuádruple por encima de 2×, el doble por encima de 1×. */
const DENSER = [[4, 2.01], [2, 1.01]] as const;
const above = (dppx: number) => `(min-resolution: ${dppx}dppx), (-webkit-min-device-pixel-ratio: ${dppx})`;

/**
 * Secuencia de Mini Marie dibujada por Marie (H33): una tira de cuadros que se desliza con
 * transform y steps(), así nunca se repinta. Escala entera (D86): la caja mide exactamente el
 * recurso a 1× y el paso entre cuadros es un número entero de píxeles; en pantallas más densas
 * <picture> elige el doble o el cuádruple exactos (con srcset, a 125 % el navegador se quedaría
 * con el pequeño y lo estiraría). Movimiento reducido: pose estática. Decorativa: el texto lo da
 * quien la usa.
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
  return (
    <span className={`sequence ${className}`} style={{ width, height: size }} data-sequence={name} data-playing={animate || undefined} aria-hidden="true">
      <picture>
        {DENSER.filter(([times]) => sizes.includes(size * times)).map(([times, dppx]) => (
          <source key={times} media={above(dppx)} srcSet={spriteUrl(name, size * times)} />
        ))}
        <img
          className="sequence__strip"
          src={spriteUrl(name, size)}
          alt=""
          draggable={false}
          style={{ ...motion, width: frames * width, height: size }}
        />
      </picture>
    </span>
  );
}
