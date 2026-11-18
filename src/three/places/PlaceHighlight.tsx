import { useMemo } from 'react';
import type { MapToken } from '../../lib/cssToken';
import { useSelectionStore, type Selection } from '../selection/selectionStore';
import type { PlaceLayer } from './placeLayers';
import { noRaycast, useMarkerTexture, usePositionGeometry } from './resources';

interface Found {
  layer: PlaceLayer;
  at: Float32Array;
}

function locate(layers: readonly PlaceLayer[], target: Selection | null): Found | null {
  if (target?.kind !== 'place') return null;
  const layer = layers.find((l) => l.slug === target.slug);
  const index = layer ? layer.ids.indexOf(target.id) : -1;
  return layer && index >= 0 ? { layer, at: layer.markers.slice(index * 3, index * 3 + 3) } : null;
}

interface SpotProps extends Found {
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

/**
 * Resalte de los lugares: el elegido, más grande y con el aro del sol del tema de los mapas; el que
 * está bajo el puntero, algo más grande. Se dibujan encima de su marcador.
 */
export function PlaceHighlight({ layers }: { layers: readonly PlaceLayer[] }) {
  const selected = useSelectionStore((s) => s.selected);
  const hovered = useSelectionStore((s) => s.hovered);
  const picked = useMemo(() => locate(layers, selected), [layers, selected]);
  const under = useMemo(() => locate(layers, hovered), [layers, hovered]);
  const same = picked && under && picked.layer === under.layer && picked.at.join() === under.at.join();

  return (
    <>
      {picked ? <Spot key={`elegido-${picked.layer.slug}`} {...picked} size={44} order={12} ring="ciclo-sol" /> : null}
      {under && !same ? <Spot key={`puntero-${under.layer.slug}`} {...under} size={38} order={11} /> : null}
    </>
  );
}
