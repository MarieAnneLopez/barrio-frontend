import { cssColorOf, swatchDash, type ShapeStyle } from '../../three/shapeStyle';

const WIDTH = { fino: 1, grueso: 4, relleno: 0, rayado: 0 } as const;

/** Muestra de la leyenda (D79): mismo color, trazo y grosor que la figura en la maqueta. */
export function ShapeSwatch({ style }: { style: ShapeStyle }) {
  const color = cssColorOf(style);
  return (
    <svg aria-hidden="true" viewBox="0 0 20 8" className="h-2 w-5 shrink-0 bg-surface">
      {style.swatch === 'relleno' ? (
        <rect x="1" y="1" width="18" height="6" fill={color} />
      ) : style.swatch === 'rayado' ? (
        // Rayado (D82, opción B): como el relleno de datos catastrales en el mapa temático.
        <path d="M1 7l6-6M6 7l6-6M11 7l6-6M16 7l3-3" stroke={color} strokeWidth={1.4} fill="none" />
      ) : (
        <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth={WIDTH[style.swatch]}
          strokeDasharray={swatchDash(style)} />
      )}
    </svg>
  );
}
