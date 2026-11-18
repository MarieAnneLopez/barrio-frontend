import { memo, useId } from 'react';

interface HitProps {
  index: number;
  label: string;
  /** «n de N»: distingue las fotos con la misma etiqueta (varias de un mismo lugar). */
  position: string;
  active: boolean;
}

/**
 * Botón nativo de una foto de la cinta: su nombre es la etiqueta real y su descripción, la posición.
 * Roving tabindex: solo la activa entra con Tab. La caja y el recorte los pone el motor en cada cuadro.
 */
export const RibbonHit = memo(function RibbonHit({ index, label, position, active }: HitProps) {
  const described = useId();
  return (
    <button type="button" data-ribbon-index={index} tabIndex={active ? 0 : -1} aria-describedby={described} className="ribbon-hit">
      <span className="sr-only">{label}</span>
      <span id={described} hidden>{position}</span>
    </button>
  );
});
