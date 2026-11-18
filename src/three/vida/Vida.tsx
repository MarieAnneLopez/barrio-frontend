import { useMemo } from 'react';
import type { Tintal3D } from '../data/format';
import { worldFraming } from '../data/worldFraming';
import { QUALITY, useQualityStore } from '../quality/qualityStore';
import { useStage } from '../streets/useStage';
import { Cars } from './Cars';
import { BASE_CARS, BASE_PEOPLE, vidaCounts } from './density';
import { People } from './People';
import { Planes } from './Planes';
import { readVidaPalette } from './vidaPalette';

export interface VidaProps {
  world: Tintal3D;
  /** Movimiento reducido: todo quieto (carros parados, personas de pie, sin aviones). */
  still: boolean;
}

/** Etapas de montaje: después de las calles (streets/Streets monta las suyas en los cuadros 0–3). */
const CARS_STAGE = 5;
const PEOPLE_STAGE = 6;

/**
 * La vida del barrio: carros por las vías reales respetando sentidos, personitas low-poly y aviones
 * cada 1–3 min, todo instanciado y actualizado por lotes en un useFrame por capa. Cuántos carros y
 * personas se mueven lo fija la calidad adaptable (QUALITY[level].density); las mallas se crean
 * para la densidad máxima y solo cambia cuántas instancias se dibujan.
 */
export function Vida({ world, still }: VidaProps) {
  const density = useQualityStore((s) => QUALITY[s.level].density);
  const palette = useMemo(() => readVidaPalette(), []);
  const framing = useMemo(() => worldFraming(world), [world]);
  const stage = useStage(PEOPLE_STAGE);
  const { cars, people } = vidaCounts(density);
  const radius = Math.max(framing.size[0], framing.size[1]) / 2;
  return (
    <group>
      {stage >= CARS_STAGE && <Cars vias={world.vias} capacity={BASE_CARS} count={cars} still={still} palette={palette} />}
      {stage >= PEOPLE_STAGE && <People world={world} capacity={BASE_PEOPLE} count={people} still={still} palette={palette} />}
      {!still && stage >= PEOPLE_STAGE && <Planes center={framing.center} radius={radius} palette={palette} />}
    </group>
  );
}
