import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type { Tintal3D } from '../data/format';
import { useSelectionStore } from '../selection/selectionStore';
import { bridgeHover } from './hud';
import { createBuildingMaterial } from './material';
import { applySelection, createPickHandlers, cursorOf } from './picking';
import { tileRaycast } from './raycast';
import { tileGeometry } from './tileGeometry';
import { useBuildingTiles } from './useBuildingTiles';
import { useShaderReady } from './useShaderReady';

export interface BuildingsProps {
  world: Tintal3D;
}

type SelectionUniforms = Parameters<typeof applySelection>[0];

/**
 * Los 20 394 edificios reales de El Tintal (Catastro UAECD + OSM, D105): volumen por pisos, ventanas,
 * cornisas y pretiles por shader, luz del ciclo (sky/lightUniforms) y selección con el puntero
 * (selectionStore). Las mallas se arman en un Web Worker, una por tesela de 400 m.
 */
export function Buildings({ world }: BuildingsProps) {
  const result = useBuildingTiles(world);
  const material = useMemo(() => createBuildingMaterial(), []);
  const ready = useShaderReady(material);
  const gl = useThree((s) => s.gl);
  const meshes = useMemo(
    () => (result?.tiles ?? []).map((tile) => ({ key: tile.key, geometry: tileGeometry(tile), raycast: tileRaycast(tile) })),
    [result],
  );
  const handlers = useMemo(() => createPickHandlers(cursorOf(gl.domElement)), [gl]);

  useEffect(() => () => meshes.forEach((m) => m.geometry.dispose()), [meshes]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => cursorOf(gl.domElement)(''), [gl]);
  // Resalte: los uniformes siguen a la selección sin volver a pintar el componente.
  useEffect(() => {
    const uniforms = material.uniforms as unknown as SelectionUniforms;
    applySelection(uniforms, useSelectionStore.getState());
    return useSelectionStore.subscribe((state) => applySelection(uniforms, state));
  }, [material]);
  // El HUD de la maqueta (HeroHud) describe el edificio bajo el puntero.
  useEffect(() => bridgeHover(world.edificios), [world]);
  // Diagnóstico (como PerfProbe): cuántos edificios y cuánto tardó la construcción.
  useEffect(() => {
    const host = gl.domElement.closest<HTMLElement>('[data-hero]');
    if (!host || !result) return;
    host.dataset.buildings = String(result.stats.buildings);
    host.dataset.buildingsMs = String(result.stats.ms);
  }, [gl, result]);

  if (!ready) return null;
  return (
    <group onPointerMove={handlers.onPointerMove} onPointerOut={handlers.onPointerOut} onClick={handlers.onClick}>
      {meshes.map((m) => (
        <mesh key={m.key} geometry={m.geometry} material={material} raycast={m.raycast} matrixAutoUpdate={false} />
      ))}
    </group>
  );
}
