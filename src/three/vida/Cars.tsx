import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Color, InstancedBufferAttribute, InstancedMesh } from 'three';
import { LIGHT } from '../sky/lightUniforms';
import { poolMaterial } from '../streets/flatMaterials';
import { writePose } from '../streets/instances';
import { partsMaterial } from '../streets/parts';
import type { Vias } from '../data/format';
import { buildLaneGraph } from './laneGraph';
import { carModel, headlightBeam } from './models';
import { createTraffic, stepTraffic } from './traffic';
import { instanceColors, type VidaPalette } from './vidaPalette';

/** Un poco más grandes que los reales para que se lean a la distancia de la maqueta. */
export const CAR_SCALE = 1.35;
const WHITE = new Color(1, 1, 1);
const DIM = new Color(0.42, 0.42, 0.42);

interface Props {
  vias: Vias;
  /** Carros creados (densidad 1) y cuántos se animan y dibujan ahora (calidad). */
  capacity: number;
  count: number;
  still: boolean;
  palette: VidaPalette;
}

/**
 * Carros instanciados por el grafo vial real (traffic.ts), todos en un solo useFrame: avanzan,
 * giran en los cruces y de noche encienden los faros, con su abanico de luz en el suelo.
 */
export function Cars({ vias, capacity, count: wanted, still, palette: p }: Props) {
  const graph = useMemo(() => buildLaneGraph(vias), [vias]);
  const count = graph.edges > 0 ? Math.min(wanted, capacity) : 0; // sin vías vehiculares no hay carros
  const traffic = useMemo(() => createTraffic(graph, capacity), [graph, capacity]);
  const assets = useMemo(() => ({
    car: carModel(),
    beam: headlightBeam(),
    body: partsMaterial([
      { day: WHITE, night: DIM, tint: true },
      { ...p.vidrio },
      { day: p.farol, night: p.farol, glow: p.farol, glowDay: 0.1, glowNight: 1.8 },
      { day: p.freno, night: p.freno, glow: p.freno, glowDay: 0.1, glowNight: 1.4 },
    ]),
    light: poolMaterial(p.farol, 0.42, 1),
  }), [p]);
  const meshes = useMemo(() => {
    const cars = new InstancedMesh(assets.car, assets.body, capacity);
    cars.instanceColor = new InstancedBufferAttribute(instanceColors(capacity, p.cars, 17), 3);
    const beams = new InstancedMesh(assets.beam, assets.light, capacity);
    beams.instanceMatrix = cars.instanceMatrix; // las mismas matrices: los faros van con su carro
    for (const m of [cars, beams]) [m.frustumCulled, m.count] = [false, 0];
    return { cars, beams };
  }, [assets, capacity, p]);
  const carsRef = useRef<InstancedMesh>(null);
  const beamsRef = useRef<InstancedMesh>(null);
  const written = useRef(-1);
  useEffect(() => () => Object.values(meshes).forEach((m) => m.dispose()), [meshes]);
  useEffect(() => () => Object.values(assets).forEach((a) => a.dispose()), [assets]);

  useFrame((_, delta) => {
    const [cars, beams] = [carsRef.current, beamsRef.current];
    if (!cars || !beams) return;
    if (!still) stepTraffic(graph, traffic, count, Math.min(delta, 0.1));
    if (!still || written.current !== count) {
      const m = cars.instanceMatrix.array as Float32Array;
      for (let i = 0; i < count; i++) {
        writePose(m, i, traffic.x[i] ?? 0, traffic.y[i] ?? 0, traffic.z[i] ?? 0, traffic.yaw[i] ?? 0, (traffic.scale[i] ?? 1) * CAR_SCALE);
      }
      cars.instanceMatrix.needsUpdate = true;
      written.current = count;
    }
    cars.count = count;
    beams.count = count;
    beams.visible = LIGHT.uNight.value > 0.02;
  });

  return (
    <>
      <primitive ref={carsRef} object={meshes.cars} />
      <primitive ref={beamsRef} object={meshes.beams} />
    </>
  );
}
