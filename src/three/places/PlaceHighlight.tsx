import { useMemo } from 'react';
import type { MapToken } from '../../lib/cssToken';
import { useSelectionStore, type Selection } from '../selection/selectionStore';
import type { PlaceLayer } from './placeLayers';
import { noRaycast, useMarkerTexture, usePositionGeometry } from './resources';
import { ShapeHighlight } from './ShapeHighlight';

interface Found {
  layer: PlaceLayer;
  at: Float32Array;
  /** Figura que se elige en el suelo (lote o tramo en su sección); undefined si es un marcador. */
  shape?: number;
}

function locate(layers: readonly PlaceLayer[], target: Selection | null): Found | null {
  if (target?.kind !== 'place') return null;
  const layer = layers.find((l) => l.slug === target.slug);
  if (!layer) return null;
  const index = layer.ids.indexOf(target.id);
  if (index >= 0) return { layer, at: layer.markers.slice(index * 3, index * 3 + 3) };
  const shape = layer.shapes ? layer.shapes.ids.indexOf(target.id) : -1;
  return layer.shapes && shape >= 0 ? { layer, at: layer.shapes.centers.slice(shape * 3, shape * 3 + 3), shape } : null;
}

interface SpotProps {
  layer: PlaceLayer;
  at: Float32Array;
  size: number;
  order: number;
  ring?: MapToken;
}

function Spot({ layer, at, size, order, ring }: SpotProps) {
  const geometry = usePositionGeometry(at);
  const texture = useMarkerTexture(layer.emoji, layer.slug, ring);
  return (
    <points geometry={geometry} raycast={noRaycast} renderOrder={order}>
      <pointsMaterial map={texture} size={size} sizeAttenuation={false} transparent alphaTest={0.4}
        depthWrite={false} depthTest={false} />
    </points>
  );
}

const samePlace = (a: Selection | null, b: Selection | null) =>
  a?.kind === 'place' && b?.kind === 'place' && a.slug === b.slug && a.id === b.id;

/**
 * Resalte de los lugares: el elegido, más grande y con el aro del sol del tema de los mapas; el que
 * está bajo el puntero, algo más grande. Se dibujan encima de su marcador. Un lote o un tramo que se
 * elige en el suelo no tiene marcador: elegido, lleva uno en su centro y su contorno resaltado; bajo
 * el puntero, solo el contorno.
 */
export function PlaceHighlight({ layers }: { layers: readonly PlaceLayer[] }) {
  const selected = useSelectionStore((s) => s.selected);
  const hovered = useSelectionStore((s) => s.hovered);
  const picked = useMemo(() => locate(layers, selected), [layers, selected]);
  const under = useMemo(() => (samePlace(selected, hovered) ? null : locate(layers, hovered)), [layers, selected, hovered]);

  return (
    <>
      {picked ? <Spot key={`elegido-${picked.layer.slug}`} layer={picked.layer} at={picked.at} size={44} order={12} ring="ciclo-sol" /> : null}
      {picked?.shape !== undefined ? <ShapeHighlight layer={picked.layer} shape={picked.shape} strong /> : null}
      {under && under.shape === undefined ? (
        <Spot key={`puntero-${under.layer.slug}`} layer={under.layer} at={under.at} size={38} order={11} />
      ) : null}
      {under?.shape !== undefined ? <ShapeHighlight layer={under.layer} shape={under.shape} strong={false} /> : null}
    </>
  );
}
