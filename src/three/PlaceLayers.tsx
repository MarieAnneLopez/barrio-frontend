import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, Color, LineSegments, Points } from 'three';
import { mapColor } from '../lib/cssToken';
import { markerShape } from '../lib/markerShape';
import { emojiTexture } from './emojiTexture';
import { useHeroStore } from './heroStore';
import type { CategoryLayer } from './categoryLayers';
import { DEFAULT_SHAPE, SHAPE_STYLE } from './shapeStyle';

// Oculto = no recibe clics; visible = el raycast normal de Points.
const noRaycast = (): void => undefined;

function useGeometry(positions: Float32Array) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(positions, 3));
    g.computeBoundingSphere();
    return g;
  }, [positions]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** Lugares puntuales de un módulo: un sprite emoji por lugar, una sola llamada de dibujo. */
function PlacePoints({ layer, visible }: { layer: CategoryLayer; visible: boolean }) {
  const geometry = useGeometry(layer.positions);
  const texture = useMemo(() => emojiTexture(layer.emoji, markerShape(layer.slug)), [layer.emoji, layer.slug]);
  useEffect(() => () => texture.dispose(), [texture]);
  const select = useHeroStore((s) => s.select);

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    const index = event.index;
    const item = index === undefined ? undefined : layer.items[index];
    if (!item || index === undefined) return;
    event.stopPropagation();
    const p = layer.positions;
    select({ id: item.id, name: item.name, slug: layer.slug, emoji: layer.emoji,
      position: [p[index * 3] ?? 0, p[index * 3 + 1] ?? 0, p[index * 3 + 2] ?? 0] });
  };

  return (
    <points geometry={geometry} visible={visible} raycast={visible ? Points.prototype.raycast : noRaycast} onClick={onClick}
      userData={{ slug: layer.slug, drawn: layer.drawn }}>
      <pointsMaterial map={texture} size={30} sizeAttenuation={false} transparent alphaTest={0.4} depthWrite={false} />
    </points>
  );
}

/** Figuras de un módulo (zonas, lotes, calles): contornos fundidos en una sola geometría. */
function PlaceShapes({ layer, visible }: { layer: CategoryLayer; visible: boolean }) {
  const geometry = useGeometry(layer.positions);
  const style = SHAPE_STYLE[layer.slug] ?? DEFAULT_SHAPE;
  const color = useMemo(() => new Color(mapColor(style.token)), [style]);
  const lines = useRef<LineSegments>(null);
  // El guion necesita la distancia acumulada de cada vértice (D79: trazo además del color).
  useLayoutEffect(() => void (style.dash && lines.current?.computeLineDistances()), [geometry, style]);
  return (
    <lineSegments ref={lines} geometry={geometry} visible={visible} raycast={noRaycast}
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

/** Los 14 módulos en la maqueta (H34): cada uno se puede ocultar desde la leyenda. */
export function PlaceLayers({ layers }: { layers: CategoryLayer[] }) {
  const hidden = useHeroStore((s) => s.hidden);
  return (
    <>
      {layers.map((layer) => {
        const visible = !hidden.includes(layer.slug);
        return layer.kind === 'points'
          ? <PlacePoints key={layer.slug} layer={layer} visible={visible} />
          : <PlaceShapes key={layer.slug} layer={layer} visible={visible} />;
      })}
    </>
  );
}
