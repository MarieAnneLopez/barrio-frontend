import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, type LineSegments } from 'three';
import { mapColor } from '../../lib/cssToken';
import { DEFAULT_SHAPE, SHAPE_STYLE } from '../shapeStyle';
import type { PlaceLayer } from './placeLayers';
import { noRaycast, usePositionGeometry } from './resources';

/**
 * Contorno de las figuras de un módulo (zonas, canchas, calles, lotes): segmentos fundidos en una sola
 * geometría, con el trazo de la leyenda (D79: guion además del color). No se elige con el puntero: lo
 * hace el marcador del centro de cada figura o, en la sección de lotes y calles, ShapePicker.
 */
export function PlaceOutline({ layer }: { layer: PlaceLayer }) {
  const geometry = usePositionGeometry(layer.outline);
  const style = SHAPE_STYLE[layer.slug] ?? DEFAULT_SHAPE;
  const color = useMemo(() => new Color(mapColor(style.token)), [style]);
  const lines = useRef<LineSegments>(null);
  // El guion necesita la distancia acumulada de cada vértice.
  useLayoutEffect(() => void (style.dash && lines.current?.computeLineDistances()), [geometry, style]);

  return (
    <lineSegments ref={lines} geometry={geometry} raycast={noRaycast}
      userData={{ slug: layer.slug, drawn: layer.drawn, dash: style.dash }}>
      {style.dash ? (
        <lineDashedMaterial color={color} transparent opacity={style.opacity} depthWrite={false}
          dashSize={style.dash[0]} gapSize={style.dash[1]} />
      ) : (
        <lineBasicMaterial color={color} transparent opacity={style.opacity} depthWrite={false} />
      )}
    </lineSegments>
  );
}
