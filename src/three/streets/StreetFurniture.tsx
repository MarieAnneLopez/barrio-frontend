import { useEffect, useMemo } from 'react';
import type { Tintal3D } from '../data/format';
import { allCrossingMarks } from './crossings';
import { flatSquare, streetLamp, trafficLight } from './models';
import { markMaterial, poolMaterial } from './flatMaterials';
import { marksToMatrices, posesToMatrices } from './instances';
import { lampPoses } from './lamps';
import { LEVEL } from './levels';
import type { Network } from './network';
import type { StreetPalette } from './palette';
import { partsMaterial } from './parts';
import { roadIndex } from './segmentIndex';
import { signalPoses } from './signals';
import { StaticInstances } from './StaticInstances';

interface Props {
  world: Tintal3D;
  net: Network;
  palette: StreetPalette;
}

/** Brazo del farol: la lámpara queda a 1,6 m del poste (models.streetLamp). */
const LAMP_REACH = 1.6;

/**
 * Cebras y cruces de ciclorruta (OSM), semáforos (OSM) y faroles DECORATIVOS (regla, D105) con su
 * halo cálido en el suelo de noche. Todo instanciado: un dibujo por tipo.
 */
export function StreetFurniture({ world, net, palette: p }: Props) {
  const data = useMemo(() => {
    const roads = roadIndex(world.vias, net);
    const marks = allCrossingMarks(world.vias, roads);
    const lamps = lampPoses(world.vias, net, roads);
    const pools = lamps.map((l) => ({ ...l, x: l.x + Math.cos(l.yaw) * LAMP_REACH, z: l.z - Math.sin(l.yaw) * LAMP_REACH, y: LEVEL.marks + 0.02, scale: 24 }));
    return {
      white: marksToMatrices(marks.white, LEVEL.marks),
      cycle: marksToMatrices(marks.cycle, LEVEL.marks - 0.01),
      signals: posesToMatrices(signalPoses(world.vias, roads)),
      lamps: posesToMatrices(lamps),
      pools: posesToMatrices(pools),
    };
  }, [world, net]);
  const assets = useMemo(() => ({
    square: flatSquare(),
    lamp: streetLamp(),
    signal: trafficLight(),
    white: markMaterial(p.linea),
    cycle: markMaterial(p.ciclo),
    pool: poolMaterial(p.farol, 0.32),
    lampParts: partsMaterial([{ ...p.metal }, { ...p.linea, glow: p.farol, glowDay: 0, glowNight: 1.6 }]),
    signalParts: partsMaterial([
      { ...p.metal }, { ...p.oscuro },
      { ...p.oscuro, glow: p.alto, glowDay: 0.7, glowNight: 1.5, blink: -1 },
      { ...p.oscuro, glow: p.atencion, glowDay: 0.7, glowNight: 1.5, blink: -2 },
      { ...p.oscuro, glow: p.brillo, glowDay: 0.7, glowNight: 1.5, blink: -3 },
    ]),
  }), [p]);
  useEffect(() => () => Object.values(assets).forEach((a) => a.dispose()), [assets]);

  return (
    <group>
      <StaticInstances geometry={assets.square} material={assets.cycle} matrices={data.cycle} />
      <StaticInstances geometry={assets.square} material={assets.white} matrices={data.white} />
      <StaticInstances geometry={assets.signal} material={assets.signalParts} matrices={data.signals} />
      <StaticInstances geometry={assets.lamp} material={assets.lampParts} matrices={data.lamps} />
      <StaticInstances geometry={assets.square} material={assets.pool} matrices={data.pools} nightOnly />
    </group>
  );
}
