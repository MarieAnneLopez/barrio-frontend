import type { Feature, Geometry, MultiPolygon, Polygon } from 'geojson';
import { useEffect, useMemo } from 'react';
import type { BaseMapData } from '../components/map/baseMapData';
import { extrudeFeatures, flatFeatures } from './extrude';
import type { Projection } from './projection';
import { LOT_Y, PARK_Y, PODIUM } from './referenceView';
import type { SceneColors } from './sceneColors';
import { paintFaces } from './toon';

type Area = Feature<Polygon | MultiPolygon>;

interface Props {
  base: BaseMapData;
  /** Lotes catastrales reales (datos abiertos de Bogotá): cubren el 79 % del barrio; OSM solo el 23 %. */
  lots: readonly Feature<Geometry | null>[];
  project: Projection;
  colors: SceneColors;
}

/**
 * Suelo de El Tintal (D83): la huella del barrio; encima los lotes catastrales, planos (algunos
 * son espacio público y taparían las calles si se levantaran); las manzanas de OSM como zócalos
 * esquemáticos (todas a la misma altura: OSM no trae la suya, no es un dato) y los parques.
 * Colores planos del tema, horneados por cara.
 */
export function GroundLayer({ base, lots, project, colors }: Props) {
  const geometries = useMemo(() => {
    const footprint = extrudeFeatures([base.polygon as unknown as Area], project, () => 0.5);
    const plots = flatFeatures(lots.filter((f) => f.geometry) as Area[], project, LOT_Y);
    const blocks = extrudeFeatures(base.layers.manzanas.features as Area[], project, () => PODIUM);
    const parks = extrudeFeatures(base.layers.parques.features as Area[], project, () => PARK_Y);
    paintFaces(footprint, () => colors.suelo);
    paintFaces(plots, () => colors.lote);
    paintFaces(blocks, (kind) => (kind === 'top' ? colors.manzana : kind === 'lit' ? colors.edificio[0] : colors.sombra));
    paintFaces(parks, (kind) => (kind === 'top' ? colors.parque : colors.sombra));
    return { footprint, plots, blocks, parks };
  }, [base, lots, project, colors]);
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

  return (
    <group>
      <mesh geometry={geometries.footprint} position-y={-0.5}>
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh geometry={geometries.plots}>
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh geometry={geometries.blocks}>
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh geometry={geometries.parks}>
        <meshBasicMaterial vertexColors />
      </mesh>
    </group>
  );
}
