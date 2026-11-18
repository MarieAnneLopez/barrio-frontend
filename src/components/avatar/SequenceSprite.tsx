import './sequence.css';
import type { CSSProperties } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { denserThan } from '../../lib/density';
import { atlasCellWidth, cellWidth, FRAME_MS, sequenceSpec, spriteUrl, type SequenceName, type SpriteSize } from './sequences';

interface Props<N extends SequenceName> {
  name: N;
  /** Alto en px: uno de los tamaños fijos de la secuencia (escala entera, D86); otro no compila. */
  size: SpriteSize<N>;
  /** Cuadro dibujado (índice desde 0) que queda fijo con movimiento reducido o si playing = false. */
  pose?: number;
  /** Cuadro exacto del ciclo (0–31) cuando playing = false: lo mueve quien la usa (la barra de carga). */
  frame?: number;
  playing?: boolean;
  /** Desfase dentro del ciclo (0–1): varias a la vez no se mueven al unísono. */
  phase?: number;
  /** Lejos de la pantalla (el pie de página): el atlas se baja al acercarse y se decodifica aparte. */
  lazy?: boolean;
  className?: string;
}

/** Densidad de pantalla desde la que conviene cada múltiplo: el cuádruple por encima de 2×, el doble por encima de 1×. */
const DENSER = [[4, 2.01], [2, 1.01]] as const;

/**
 * Secuencia de Mini Marie (H33; sprites32): un ciclo de 32 cuadros en un atlas de 8 columnas ×
 * 4 filas. Dos animaciones con steps() y solo transform, así nunca se repinta: la imagen recorre
 * las columnas de una fila y su contenedor baja de fila en fila, a la misma hora. Escala entera
 * (D86): la caja mide exactamente el recurso a 1× y cada paso es un número entero de píxeles; en
 * pantallas más densas <picture> elige el doble o el cuádruple exactos (con srcset, a 125 % el
 * navegador se quedaría con el pequeño y lo estiraría). La ventana de un cuadro puede ser más ancha
 * que la caja (el brazo del saludo sale por la derecha) sin mover la maqueta. Movimiento reducido:
 * el cuadro dibujado `pose`, quieto. Decorativa: el texto lo da quien la usa.
 */
export function SequenceSprite<N extends SequenceName>(props: Props<N>) {
  const { name, size, pose = 0, playing = true, phase = 0, lazy = false, className = '' } = props;
  const reduced = useReducedMotion();
  const { sizes, grid: [cols, rows], keys } = sequenceSpec(name);
  const width = cellWidth(name, size);
  const cell = atlasCellWidth(name, size);
  const animate = playing && !reduced;
  const rowMs = cols * FRAME_MS[name];
  const delay = `${-phase * rows * rowMs}ms`;
  const drawn = keys[Math.min(Math.max(pose, 0), keys.length - 1)] ?? 0;
  const frame = !reduced && props.frame !== undefined ? props.frame % (cols * rows) : drawn;
  const across: CSSProperties = animate
    ? { animationDuration: `${rowMs}ms`, animationTimingFunction: `steps(${cols})`, animationDelay: delay }
    : { transform: `translateX(${-(frame % cols) * cell}px)` };
  const down: CSSProperties = animate
    ? { animationDuration: `${rows * rowMs}ms`, animationTimingFunction: `steps(${rows})`, animationDelay: delay }
    : { transform: `translateY(${-Math.floor(frame / cols) * size}px)` };
  return (
    <span className={`sequence ${className}`} style={{ width, height: size }} data-sequence={name} data-playing={animate || undefined} aria-hidden="true">
      <span className="sequence__window" style={{ width: cell, height: size }}>
        <span className="sequence__rows" style={down}>
          <picture>
            {DENSER.filter(([times]) => sizes.includes(size * times)).map(([times, dppx]) => (
              <source key={times} media={denserThan(dppx)} srcSet={spriteUrl(name, size * times)} />
            ))}
            <img
              className="sequence__strip"
              src={spriteUrl(name, size)}
              alt=""
              draggable={false}
              loading={lazy ? 'lazy' : undefined}
              decoding={lazy ? 'async' : undefined}
              style={{ ...across, width: cols * cell, height: rows * size }}
            />
          </picture>
        </span>
      </span>
    </span>
  );
}
