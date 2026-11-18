import { useMemo } from 'react';
import { Color } from 'three';
import { mapColor } from '../../lib/cssToken';
import type { PlaceLayer } from './placeLayers';
import { shapeOutline } from './placeShapes';
import { noRaycast, usePositionGeometry } from './resources';

interface ShapeHighlightProps {
  layer: PlaceLayer;
  /** Índice de la figura en layer.shapes. */
  shape: number;
  /** Elegida (contorno entero) o solo bajo el puntero (más tenue). */
  strong: boolean;
}

/**
 * Contorno de una figura que se elige en el suelo (un lote o un tramo de calle) con el amarillo del
 * sol del tema de los mapas, encima de todo: así se ve cuál es, sin un marcador por figura.
 */
export function ShapeHighlight({ layer, shape, strong }: ShapeHighlightProps) {
  const segments = useMemo(
    () => (layer.shapes ? shapeOutline(layer.shapes, layer.outline, shape) : new Float32Array()),
    [layer, shape],
  );
  const geometry = usePositionGeometry(segments);
  const color = useMemo(() => new Color(mapColor('ciclo-sol')), []);

  return (
    <lineSegments geometry={geometry} raycast={noRaycast} renderOrder={strong ? 9 : 8}>
      <lineBasicMaterial color={color} transparent opacity={strong ? 1 : 0.7} depthTest={false} depthWrite={false} />
    </lineSegments>
  );
}
