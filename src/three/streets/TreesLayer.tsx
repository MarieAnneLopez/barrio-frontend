import { useEffect, useMemo } from 'react';
import type { Tintal3D } from '../data/format';
import { posesToMatrices } from './instances';
import { coneTree, roundTree } from './models';
import type { StreetPalette } from './palette';
import { partsMaterial } from './parts';
import { StaticInstances } from './StaticInstances';
import { treePoses, type TreePose } from './trees';

/** Tono de la copa por árbol (gris que multiplica el verde del tema). */
function tones(trees: readonly TreePose[]): Float32Array {
  const out = new Float32Array(trees.length * 3);
  trees.forEach((t, i) => out.fill(t.tone, 3 * i, 3 * i + 3));
  return out;
}

/** Árboles low-poly instanciados (trees.ts): reales de OSM, hileras y decorativos en parques. */
export function TreesLayer({ world, palette }: { world: Tintal3D; palette: StreetPalette }) {
  const data = useMemo(() => {
    const all = treePoses(world.puntos, world.suelo);
    const [round, cone] = [all.filter((t) => t.kind === 0), all.filter((t) => t.kind === 1)];
    return { round: posesToMatrices(round), cone: posesToMatrices(cone), roundTone: tones(round), coneTone: tones(cone) };
  }, [world]);
  const assets = useMemo(() => ({
    round: roundTree(),
    cone: coneTree(),
    material: partsMaterial([{ ...palette.pista }, { ...palette.verde, tint: true }]),
  }), [palette]);
  useEffect(() => () => Object.values(assets).forEach((a) => a.dispose()), [assets]);
  return (
    <group>
      <StaticInstances geometry={assets.round} material={assets.material} matrices={data.round} colors={data.roundTone} />
      <StaticInstances geometry={assets.cone} material={assets.material} matrices={data.cone} colors={data.coneTone} />
    </group>
  );
}
