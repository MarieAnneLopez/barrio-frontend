import { useMemo } from 'react';
import type { Tintal3D } from '../data/format';
import { buildNetwork } from './network';
import { readStreetPalette } from './palette';
import { STAGE } from './stages';
import { StreetFurniture } from './StreetFurniture';
import { GroundSurface, PathSurface, RoadSurfaces } from './StreetSurfaces';
import { TreesLayer } from './TreesLayer';
import { useStage } from './useStage';

export interface StreetsProps {
  world: Tintal3D;
}

/**
 * Suelo, vías, andenes, cebras, semáforos, árboles y faroles de El Tintal (datos reales TNT3, D105:
 * OSM y Catastro); las vías brillan de noche (sky/lightUniforms). Lo que no es dato (anchos de
 * calzada, andenes, faroles, árboles de los parques) es regla de dibujo y lo dice cada módulo. Las
 * capas se arman de a una por cuadro (stages.ts) y nada en el cuadro que crea el lienzo.
 */
export function Streets({ world }: StreetsProps) {
  const stage = useStage(STAGE.trees);
  return stage >= STAGE.ground ? <StreetLayers world={world} stage={stage} /> : null;
}

function StreetLayers({ world, stage }: StreetsProps & { stage: number }) {
  const palette = useMemo(() => readStreetPalette(), []);
  const net = useMemo(() => buildNetwork(world.vias), [world]);
  return (
    <group>
      <GroundSurface world={world} palette={palette} />
      {stage >= STAGE.paths && <PathSurface world={world} palette={palette} />}
      {stage >= STAGE.roads && <RoadSurfaces world={world} net={net} palette={palette} />}
      {stage >= STAGE.furniture && <StreetFurniture world={world} net={net} palette={palette} />}
      {stage >= STAGE.treeGround && <TreesLayer world={world} net={net} palette={palette} ready={stage >= STAGE.trees} />}
    </group>
  );
}
