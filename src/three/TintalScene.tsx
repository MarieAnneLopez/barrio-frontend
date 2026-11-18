import '../components/map/map.css'; // estilo .map-marker de los billboards
import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { mapColor } from '../lib/cssToken';
import { Billboards } from './Billboards';
import { Buildings } from './buildings/Buildings';
import { CameraRig } from './CameraRig';
import { buildCategoryLayer } from './categoryLayers';
import { Clouds } from './clouds/Clouds';
import { useContextRecovery } from './contextRecovery';
import type { Tintal3D } from './data/format';
import { worldFraming } from './data/worldFraming';
import { useHeroStore } from './heroStore';
import { Island } from './island/Island';
import { PerfProbe } from './PerfProbe';
import { ScenePlaces } from './places/ScenePlaces';
import { PlaceLayers } from './PlaceLayers';
import { createProjection } from './projection';
import { QualityProbe } from './quality/QualityProbe';
import { useQualityStore, QUALITY } from './quality/qualityStore';
import { FOV_DEG } from './referenceView';
import { FollowCamera } from './sky/FollowCamera';
import { SkyDome } from './sky/SkyDome';
import { SkyDriver } from './sky/SkyDriver';
import { SunMoon } from './sky/SunMoon';
import { Streets } from './streets/Streets';
import type { CategoryData } from './useTintalData';
import { Vida } from './vida/Vida';

interface Props {
  /** Datos reales del barrio (TNT3, D105): estáticos, no dependen de la API. */
  world: Tintal3D;
  /** Lugares de los 14 módulos (API); null mientras la API no responde: la maqueta no los espera. */
  places: CategoryData[] | null;
  /** false fuera de pantalla: deja de dibujar cuadros (ahorro de CPU/GPU). */
  active: boolean;
  reducedMotion: boolean;
}

/**
 * Maqueta 3D de El Tintal (§11.1.1; gran actualización): el barrio real flota sobre una isla en el
 * cielo, con ciclo de día y noche (D106), nubes por debajo y calidad adaptable. Un solo contexto
 * WebGL para toda la app (ScenePortal); si el navegador lo pierde, se vuelve a crear solo.
 */
export default function TintalScene({ world, places, active, reducedMotion }: Props) {
  const project = useMemo(() => createProjection(world.manifest.proyeccion.bbox), [world]);
  const framing = useMemo(() => worldFraming(world), [world]);
  const radius = Math.max(framing.size[0], framing.size[1]) * 0.95;
  const density = useQualityStore((s) => QUALITY[s.level].density);
  const recovery = useContextRecovery();
  const setInteracting = useHeroStore((s) => s.setInteracting);
  // Los 14 módulos (H34, D69) mientras el carril «mapas» los pasa a ScenePlaces.
  const layers = useMemo(
    () => (places ?? []).flatMap((c) => (c.collection ? [buildCategoryLayer(c.slug, c.emoji, c.collection, project)] : [])),
    [places, project],
  );
  const setDrawn = useHeroStore((s) => s.setDrawn);
  useEffect(() => setDrawn(Object.fromEntries(layers.map((l) => [l.slug, l.drawn]))), [layers, setDrawn]);
  const selected = useHeroStore((s) => s.selected);

  return (
    <Canvas
      key={recovery.key}
      onCreated={recovery.onCreated}
      flat
      style={{ touchAction: 'pan-y' }} // H34: un dedo desplaza la página; dos dedos manejan la maqueta
      dpr={[1, 2]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: FOV_DEG, near: 10, far: radius * 8, position: [0, radius, radius] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      raycaster={{ params: { Points: { threshold: 18 }, Line: { threshold: 1 }, Mesh: {}, LOD: {}, Sprite: {} } }}
      onPointerEnter={() => setInteracting(true)}
      onPointerLeave={() => setInteracting(false)}
    >
      {/* La niebla toma el color del horizonte del ciclo (SkyDriver); CameraRig la ajusta a la distancia. */}
      <fog attach="fog" args={[mapColor('dia-horizonte'), radius, radius * 4]} />
      <SkyDriver still={reducedMotion} radius={radius} />
      <FollowCamera>
        <SkyDome radius={radius * 7} />
        <SunMoon distance={radius * 6} still={reducedMotion} />
      </FollowCamera>
      <Island outline={framing.outline} />
      <Clouds center={framing.center} radius={radius} count={Math.max(8, Math.round(28 * density))} still={reducedMotion} />
      <Streets world={world} />
      <Buildings world={world} />
      <Vida world={world} still={reducedMotion} framing={framing} />
      <ScenePlaces places={places} project={project} />
      <PlaceLayers layers={layers} />
      <Billboards places={selected ? [selected] : []} />
      <CameraRig radius={radius} view={framing} reducedMotion={reducedMotion} />
      <QualityProbe />
      <PerfProbe />
    </Canvas>
  );
}
