import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import type { DirectionalLight, HemisphereLight } from 'three';
import { LIGHT } from './lightUniforms';
import { createSkyMix, lightDirection, mixSky, readSkyPalette } from './skyPalette';
import { NIGHT_SKY } from './useSkyClock';

export function SkyDriver({ still, radius }: { still: boolean; radius: number }) {
  const scene = useThree((s) => s.scene);
  const mix = useMemo(() => mixSky(NIGHT_SKY, readSkyPalette(), createSkyMix()), []);
  const moon = useRef<DirectionalLight>(null);
  const sky = useRef<HemisphereLight>(null);

  useLayoutEffect(() => {
    LIGHT.uNight.value = NIGHT_SKY.night;
    LIGHT.uDusk.value = 0;
    lightDirection(NIGHT_SKY, LIGHT.uLightDir.value);
    LIGHT.uLightColor.value.copy(mix.light).multiplyScalar(1.24);
    LIGHT.uAmbient.value.copy(mix.ambient).multiplyScalar(1.18);
    LIGHT.uHorizon.value.copy(mix.horizon);
    LIGHT.uZenith.value.copy(mix.zenith);
    scene.fog?.color.copy(mix.horizon);
    moon.current?.position.copy(LIGHT.uLightDir.value).multiplyScalar(radius);
    moon.current?.color.copy(mix.light);
    sky.current?.color.copy(mix.zenith);
    sky.current?.groundColor.copy(mix.ambient);
  }, [mix, scene, radius]);

  // Tiempo visible: volver de otra pestaña no salta la animación del cielo.
  useFrame((_, delta) => {
    LIGHT.uTime.value = still ? 0 : LIGHT.uTime.value + Math.min(delta, 0.1);
  });
  return <><directionalLight ref={moon} intensity={2} /><hemisphereLight ref={sky} intensity={0.8} /></>;
}
