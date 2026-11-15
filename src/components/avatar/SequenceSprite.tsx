import './sequence.css';
import type { CSSProperties } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { FRAME_MS, sequenceSpec, type SequenceName } from './sequences';

interface Props {
  name: SequenceName;
  height: number | string;
  /** Pose fija (índice desde 0) con movimiento reducido o si playing = false. */
  pose?: number;
  playing?: boolean;
  /** Desfase dentro del ciclo (0–1): varias a la vez no se mueven al unísono. */
  phase?: number;
  className?: string;
}

/**
 * Secuencia de Mini Marie dibujada por Marie (H33): una tira de cuadros que se
 * desliza con transform y steps(), así nunca se repinta ni cambia de tamaño.
 * Movimiento reducido: pose estática. Decorativa: el texto lo da quien la usa.
 */
export function SequenceSprite({ name, height, pose = 0, playing = true, phase = 0, className = '' }: Props) {
  const reduced = useReducedMotion();
  const spec = sequenceSpec(name);
  const animate = playing && !reduced;
  const box: CSSProperties = { height, aspectRatio: `${spec.width} / ${spec.height}` };
  const cycle = spec.frames * FRAME_MS[name];
  const strip: CSSProperties = animate
    ? { animationDuration: `${cycle}ms`, animationTimingFunction: `steps(${spec.frames})`, animationDelay: `${-phase * cycle}ms` }
    : { transform: `translateX(${(-100 * pose) / spec.frames}%)` };
  return (
    <span className={`sequence ${className}`} style={box} data-sequence={name} data-playing={animate || undefined} aria-hidden="true">
      <img
        className="sequence__strip"
        src={`/assets/avatar/${name}/${name}_strip.webp`}
        alt=""
        draggable={false}
        style={{ ...strip, width: `${spec.frames * 100}%` }}
      />
    </span>
  );
}
