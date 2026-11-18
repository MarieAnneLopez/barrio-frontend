import { useEffect, useMemo } from 'react';
import { BufferAttribute, BufferGeometry, type CanvasTexture } from 'three';
import type { MapToken } from '../../lib/cssToken';
import { markerShape } from '../../lib/markerShape';
import { emojiTexture } from '../emojiTexture';

// Recursos de GPU de los lugares: se crean una vez por dato y se liberan al desmontar o al cambiar.

/** Raycast vacío: lo que no se elige con el puntero (contornos, resaltes). */
export const noRaycast = (): void => undefined;

/** Geometría con solo posiciones xyz (marcadores o segmentos de contorno). */
export function usePositionGeometry(positions: Float32Array): BufferGeometry {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(positions, 3));
    g.computeBoundingSphere();
    return g;
  }, [positions]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** Placa del marcador del módulo (forma según el grupo, D82); `ring` para el lugar elegido. */
export function useMarkerTexture(emoji: string, slug: string, ring?: MapToken): CanvasTexture {
  const texture = useMemo(() => emojiTexture(emoji, markerShape(slug), ring), [emoji, slug, ring]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
