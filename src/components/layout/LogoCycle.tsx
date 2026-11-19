import { useState, type SyntheticEvent } from 'react';
import { FRAME_MS } from '../avatar/sequences';
import { LogoSources } from './LogoSources';

const face = (size: number) => `/assets/brand/marie-face-${size}.webp`;
const ROW_MS = 8 * FRAME_MS.idle; // 8 columnas por fila, a 12 fps
const CYCLE_MS = 32 * FRAME_MS.idle; // 4 filas: una respiración de 2,67 s

/**
 * Ciclo de reposo del logo (auditoría MM-04): los 32 cuadros de Mini Marie respirando, recortados al
 * rostro, en un atlas de 8 × 4 (scripts/build_brand_assets.mjs). Como SequenceSprite, la imagen
 * recorre las columnas y su contenedor baja las filas, solo con transform y a escala entera (el
 * atlas exacto para cada densidad, como el póster). Cubre el póster con el fondo del círculo y se ve
 * cuando su imagen ya está decodificada; entonces arrancan las dos animaciones a la vez, desde el
 * cuadro 0, que es el póster: el cambio no se nota. Si no se puede decodificar, queda el póster.
 */
export function LogoCycle() {
  const [shown, setShown] = useState(false);
  const ready = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const decoded = typeof img.decode === 'function' ? img.decode() : Promise.resolve();
    decoded.then(() => setShown(true), () => undefined);
  };
  return (
    <span className="brand-logo__cycle" data-shown={shown || undefined} aria-hidden="true">
      <span className="brand-logo__rows" style={{ animationDuration: `${CYCLE_MS}ms` }}>
        <picture>
          <LogoSources file={face} />
          <img
            className="brand-logo__atlas"
            src={face(32)}
            alt=""
            draggable={false}
            decoding="async"
            onLoad={ready}
            style={{ animationDuration: `${ROW_MS}ms` }}
          />
        </picture>
      </span>
    </span>
  );
}
