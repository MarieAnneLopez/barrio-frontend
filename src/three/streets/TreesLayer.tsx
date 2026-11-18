import { useEffect, useMemo } from 'react';
import type { Tintal3D } from '../data/format';
import { posesToMatrices } from './instances';
import { coneTree, roundTree } from './models';
import type { Network } from './network';
import type { StreetPalette } from './palette';
import { partsMaterial } from './parts';
import { StaticInstances } from './StaticInstances';
import { decorBlocker } from './treeGround';
import { treePoses, type TreePose } from './trees';

/** Tono de la copa por árbol (gris que multiplica el verde del tema). */
function tones(trees: readonly TreePose[]): Float32Array {
  const out = new Float32Array(trees.length * 3);
  trees.forEach((t, i) => out.fill(t.tone, 3 * i, 3 * i + 3));
  return out;
}

interface Props {
  world: Tintal3D;
  net: Network;
  palette: StreetPalette;
  /** false en el cuadro en que se arma dónde no van (treeGround); los árboles, en el siguiente. */
  ready: boolean;
}

/**
 * Árboles low-poly instanciados (trees.ts): reales de OSM, hileras y decorativos en parques, estos
 * fuera de canchas, agua, vías y edificios (treeGround).
 */
export function TreesLayer({ world, net, palette, ready }: Props) {
  const blocked = useMemo(() => decorBlocker(world, net), [world, net]);
  const data = useMemo(() => {
    if (!ready) return null;
    const all = treePoses(world.puntos, world.suelo, blocked);
    const [round, cone] = [all.filter((t) => t.kind === 0), all.filter((t) => t.kind === 1)];
    return { round: posesToMatrices(round), cone: posesToMatrices(cone), roundTone: tones(round), coneTone: tones(cone) };
  }, [world, blocked, ready]);
  const assets = useMemo(() => ({
    round: roundTree(),
    cone: coneTree(),
    material: partsMaterial([{ ...palette.pista }, { ...palette.verde, tint: true }]),
  }), [palette]);
  useEffect(() => () => Object.values(assets).forEach((a) => a.dispose()), [assets]);
  if (!data) return null;
  return (
    <group>
      <StaticInstances geometry={assets.round} material={assets.material} matrices={data.round} colors={data.roundTone} />
      <StaticInstances geometry={assets.cone} material={assets.material} matrices={data.cone} colors={data.coneTone} />
    </group>
  );
}
