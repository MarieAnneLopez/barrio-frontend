import { useCallback, useEffect, useMemo } from 'react';
import type { Tintal3D } from '../data/format';
import { pushBridges } from './bridgeParts';
import { pushGround } from './groundAreas';
import type { Network } from './network';
import type { StreetPalette } from './palette';
import { pushFootways, pushWaterLines } from './pathways';
import { asphaltMaterial, sidewalkMaterial } from './roadMaterials';
import { buildRoads, roadGeometry } from './roadRibbons';
import { dayNightMaterial } from './shading';
import { Sink } from './sink';

interface Props {
  world: Tintal3D;
  palette: StreetPalette;
}

/** Una malla fusionada armada con `fill` sobre un Sink, con el material de día y noche. */
function SinkMesh({ fill }: { fill: (sink: Sink) => void }) {
  const geometry = useMemo(() => {
    const sink = new Sink();
    fill(sink);
    return sink.toGeometry();
  }, [fill]);
  const material = useMemo(() => dayNightMaterial(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={geometry} material={material} />;
}

/** El suelo en una malla fusionada: barrio (superficie de la isla en y = 0), verdes, canchas, agua y canales. */
export function GroundSurface({ world, palette }: Props) {
  const fill = useCallback((sink: Sink) => {
    pushGround(sink, world.suelo, palette);
    pushWaterLines(sink, world.suelo, palette.agua);
  }, [world, palette]);
  return <SinkMesh fill={fill} />;
}

/** Senderos, ciclorrutas y plazas de OSM y la estructura de los puentes, en otra malla (otro cuadro). */
export function PathSurface({ world, palette }: Props) {
  const fill = useCallback((sink: Sink) => {
    pushFootways(sink, world.vias, palette);
    pushBridges(sink, world.vias, palette.concreto);
  }, [world, palette]);
  return <SinkMesh fill={fill} />;
}

/** Andenes y calzadas (con marcas y brillo de noche por shader): dos mallas fusionadas. */
export function RoadSurfaces({ world, net, palette }: Props & { net: Network }) {
  const roads = useMemo(() => {
    const { asphalt, sidewalks } = buildRoads(world.vias, net);
    return { asphalt: roadGeometry(asphalt), sidewalks: roadGeometry(sidewalks) };
  }, [world, net]);
  const materials = useMemo(() => ({ asphalt: asphaltMaterial(palette), sidewalk: sidewalkMaterial(palette) }), [palette]);
  useEffect(() => () => Object.values(roads).forEach((g) => g.dispose()), [roads]);
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);
  return (
    <group>
      <mesh geometry={roads.sidewalks} material={materials.sidewalk} />
      <mesh geometry={roads.asphalt} material={materials.asphalt} />
    </group>
  );
}
