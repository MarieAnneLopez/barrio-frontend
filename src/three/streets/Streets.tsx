import { useMemo } from 'react';
import type { Tintal3D } from '../data/format';
import { buildNetwork } from './network';
import { readStreetPalette } from './palette';
import { StreetFurniture } from './StreetFurniture';
import { GroundSurface, RoadSurfaces } from './StreetSurfaces';
import { TreesLayer } from './TreesLayer';
import { useStage } from './useStage';

export interface StreetsProps {
  world: Tintal3D;
}

/**
 * Suelo, vías, andenes, cebras, semáforos, árboles y faroles de El Tintal (datos reales TNT3, D105:
 * OSM y Catastro); las vías brillan de noche (sky/lightUniforms). Lo que no es dato (anchos de
 * calzada, andenes, faroles, árboles de los parques) es regla de dibujo y lo dice cada módulo. Las
 * capas se montan de a una por cuadro (useStage).
 */
export function Streets({ world }: StreetsProps) {
  const palette = useMemo(() => readStreetPalette(), []);
  const net = useMemo(() => buildNetwork(world.vias), [world]);
  const stage = useStage(3);
  return (
    <group>
      <GroundSurface world={world} palette={palette} />
      {stage >= 1 && <RoadSurfaces world={world} net={net} palette={palette} />}
      {stage >= 2 && <StreetFurniture world={world} net={net} palette={palette} />}
      {stage >= 3 && <TreesLayer world={world} palette={palette} />}
    </group>
  );
}
