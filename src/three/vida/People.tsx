import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Color, InstancedBufferAttribute, InstancedMesh } from 'three';
import type { Tintal3D } from '../data/format';
import { writePose } from '../streets/instances';
import { partsMaterial } from '../streets/parts';
import { personModel } from './models';
import { instanceColors, type VidaPalette } from './vidaPalette';
import { packPaths } from './pathPack';
import { clipDrafts, walkDrafts } from './walkPaths';
import { createWalkers, frameWalkers } from './walkers';

/** Más grandes que las reales para que se lean a la distancia de la maqueta (≈ 3 m). */
export const PERSON_SCALE = 2.1;
// Dos tonos del mismo color (como las personitas del Messenger antiguo): factores sobre el color de
// la instancia, la cabeza más clara que el cuerpo; de noche más oscuras.
const HEAD = new Color(1, 1, 1);
const BODY = new Color(0.66, 0.66, 0.66);
const NIGHT = 0.42;

interface Props {
  world: Tintal3D;
  capacity: number;
  count: number;
  still: boolean;
  palette: VidaPalette;
  /** Cada paso en su cuadro: los caminos al montarse, su recorte con `clip` y la gente con `ready`. */
  clip: boolean;
  ready: boolean;
}

/** Personitas low-poly instanciadas que caminan por andenes, senderos y parques (walkers.ts). */
export function People({ world, capacity, count: wanted, still, palette, clip, ready }: Props) {
  const drafts = useMemo(() => walkDrafts(world.vias, world.suelo), [world]);
  const clipped = useMemo(() => (clip ? clipDrafts(drafts, world.edificios) : null), [drafts, world, clip]);
  const paths = useMemo(() => (clipped && ready ? packPaths(clipped) : null), [clipped, ready]);
  const walkers = useMemo(() => (paths ? createWalkers(paths, capacity) : null), [paths, capacity]);
  const count = paths && paths.count > 0 ? Math.min(wanted, capacity) : 0; // sin caminos no hay gente
  const assets = useMemo(() => ({
    model: personModel(),
    material: partsMaterial([
      { day: HEAD, night: HEAD.clone().multiplyScalar(NIGHT), tint: true },
      { day: BODY, night: BODY.clone().multiplyScalar(NIGHT), tint: true },
    ]),
  }), []);
  const mesh = useMemo(() => {
    const m = new InstancedMesh(assets.model, assets.material, capacity);
    m.instanceColor = new InstancedBufferAttribute(instanceColors(capacity, palette.people, 23), 3);
    [m.frustumCulled, m.count] = [false, 0];
    return m;
  }, [assets, capacity, palette]);
  const ref = useRef<InstancedMesh>(null);
  useEffect(() => () => void mesh.dispose(), [mesh]);
  useEffect(() => () => {
    assets.model.dispose();
    assets.material.dispose();
  }, [assets]);

  useFrame((state, delta) => {
    const m = ref.current;
    if (!m || !paths || !walkers) return;
    if (!frameWalkers(paths, walkers, count, Math.min(delta, 0.1), state.clock.elapsedTime, still)) return;
    const out = m.instanceMatrix.array as Float32Array;
    const s = PERSON_SCALE;
    for (let i = 0; i < count; i++) {
      const [x, y, z] = [walkers.x[i] ?? 0, walkers.y[i] ?? 0, walkers.z[i] ?? 0];
      writePose(out, i, x, y, z, walkers.yaw[i] ?? 0, s, s, s, walkers.roll[i] ?? 0);
    }
    m.instanceMatrix.needsUpdate = true;
    m.count = count;
  });

  return <primitive ref={ref} object={mesh} />;
}
