import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { DirectionalLight, HemisphereLight } from 'three';
import { skyAt, STILL_MS } from './cycle';
import { LIGHT } from './lightUniforms';
import { createSkyMix, lightDirection, mixSky, readSkyPalette } from './skyPalette';

interface Props {
  /** Movimiento reducido: el ciclo queda quieto a media mañana. */
  still: boolean;
  /** Distancia a la que va la luz direccional (≈ radio de la maqueta). */
  radius: number;
}

/**
 * Motor del ciclo de día y noche (gran actualización, D106): en cada cuadro lee skyAt(Date.now()),
 * escribe los uniformes compartidos (LIGHT), el color de la niebla y mueve la luz del sol o de la
 * luna y la luz del cielo. El reloj es el de pared: navegar entre secciones no lo reinicia.
 */
export function SkyDriver({ still, radius }: Props) {
  const scene = useThree((s) => s.scene);
  const palette = useMemo(() => readSkyPalette(), []);
  const mix = useMemo(() => createSkyMix(), []);
  const sun = useRef<DirectionalLight>(null);
  const sky = useRef<HemisphereLight>(null);

  useFrame(() => {
    const now = Date.now();
    const state = skyAt(still ? STILL_MS : now);
    mixSky(state, palette, mix);
    LIGHT.uNight.value = state.night;
    LIGHT.uDusk.value = mix.dusk;
    lightDirection(state, LIGHT.uLightDir.value);
    LIGHT.uLightColor.value.copy(mix.light);
    LIGHT.uAmbient.value.copy(mix.ambient);
    LIGHT.uHorizon.value.copy(mix.horizon);
    LIGHT.uZenith.value.copy(mix.zenith);
    LIGHT.uTime.value = still ? 0 : (now % 3_600_000) / 1000;
    if (scene.fog) scene.fog.color.copy(mix.horizon);
    if (sun.current) {
      sun.current.position.copy(LIGHT.uLightDir.value).multiplyScalar(radius);
      sun.current.color.copy(mix.light);
    }
    if (sky.current) {
      sky.current.color.copy(mix.zenith);
      sky.current.groundColor.copy(mix.ambient);
      sky.current.intensity = 0.6 + 0.6 * (1 - state.night);
    }
  });

  return (
    <>
      <directionalLight ref={sun} intensity={1.6} />
      <hemisphereLight ref={sky} />
    </>
  );
}
