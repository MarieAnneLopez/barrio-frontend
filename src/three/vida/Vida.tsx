import { useMemo } from 'react';
import type { Tintal3D } from '../data/format';
import type { WorldFraming } from '../data/worldFraming';
import { QUALITY, useQualityStore } from '../quality/qualityStore';
import { STAGE } from '../streets/stages';
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
  /** El encuadre que ya calculó TintalScene (centro y tamaño del barrio): no se vuelve a calcular. */
  framing: Pick<WorldFraming, 'center' | 'size'>;
}

/**
 * La vida del barrio: carros por las vías reales respetando sentidos, personitas low-poly y aviones
 * cada 1–3 min, todo instanciado y actualizado por lotes en un useFrame por capa. Cuántos carros y
 * personas se mueven lo fija la calidad adaptable (QUALITY[level].density); las mallas se crean
 * para la densidad máxima y solo cambia cuántas instancias se dibujan. Se arma de a una pieza por
 * cuadro, después de las calles (streets/stages.ts).
 */
export function Vida({ world, still, framing }: VidaProps) {
  const density = useQualityStore((s) => QUALITY[s.level].density);
  const palette = useMemo(() => readVidaPalette(), []);
  const stage = useStage(STAGE.people);
  const { cars, people } = vidaCounts(density);
  const radius = Math.max(framing.size[0], framing.size[1]) / 2;
  const common = { still, palette };
  return (
    <group>
      {stage >= STAGE.lanes && <Cars vias={world.vias} capacity={BASE_CARS} count={cars} ready={stage >= STAGE.cars} {...common} />}
      {stage >= STAGE.walks && (
        <People world={world} capacity={BASE_PEOPLE} count={people} clip={stage >= STAGE.clip} ready={stage >= STAGE.people} {...common} />
      )}
      {!still && stage >= STAGE.people && <Planes center={framing.center} radius={radius} palette={palette} />}
    </group>
  );
}
