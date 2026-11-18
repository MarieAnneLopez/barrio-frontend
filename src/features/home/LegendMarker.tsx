import { markerShape } from '../../lib/markerShape';

const FRAME = {
  circulo: 'rounded-full',
  cuadrado: 'rounded-[2px]',
  rombo: 'rotate-45 scale-[0.8] rounded-[2px]',
} as const;

/** Muestra de la leyenda para los lugares (D82, opción B): el emoji en la misma forma de placa. */
export function LegendMarker({ slug, emoji }: { slug: string; emoji: string }) {
  const shape = markerShape(slug);
  return (
    <span aria-hidden="true" data-shape={shape} className="relative inline-flex size-6 shrink-0 items-center justify-center">
      <span className={`absolute inset-0 border-2 border-[var(--map-fondo)] bg-[var(--map-contorno)] ${FRAME[shape]}`} />
      <span className="relative text-step--1 leading-none">{emoji}</span>
    </span>
  );
}
