import '../components/map/map.css'; // estilo .map-marker de los billboards
import { Canvas } from '@react-three/fiber';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { useEffect, useMemo } from 'react';
import { Billboards } from './Billboards';
import { BuildingsLayer } from './BuildingsLayer';
import { CameraRig } from './CameraRig';
import { GroundLayer } from './GroundLayer';
import { useHeroStore } from './heroStore';
import { PlaceLayers } from './PlaceLayers';
import { buildCategoryLayer } from './categoryLayers';
import { Particles } from './Particles';
import { PerfProbe } from './PerfProbe';
import { bboxSize, createProjection } from './projection';
import { RoadsLayer } from './RoadsLayer';
import { readSceneColors } from './sceneColors';
import type { TintalData } from './useTintalData';

interface Props {
  data: TintalData;
  /** false fuera de pantalla: deja de dibujar cuadros (ahorro de CPU/GPU). */
  active: boolean;
  reducedMotion: boolean;
}

/** Maqueta 3D de El Tintal (§11.1.1) con datos OSM reales servidos por la API. */
export default function TintalScene({ data, active, reducedMotion }: Props) {
  const { base, categories } = data;
  const colors = useMemo(() => readSceneColors(), []);
  const project = useMemo(() => createProjection(base.polygon.bbox), [base]);
  const size = useMemo(() => bboxSize(base.polygon.bbox), [base]);
  const radius = Math.max(size[0], size[1]) * 0.95;
  const setInteracting = useHeroStore((s) => s.setInteracting);
  // Los 14 módulos (H34, D69); un módulo cuya API falló no se dibuja y la leyenda lo dice.
  const layers = useMemo(
    () => categories.flatMap((c) => (c.collection ? [buildCategoryLayer(c.slug, c.emoji, c.collection, project)] : [])),
    [categories, project],
  );
  const setDrawn = useHeroStore((s) => s.setDrawn);
  useEffect(() => setDrawn(Object.fromEntries(layers.map((l) => [l.slug, l.drawn]))), [layers, setDrawn]);
  const selected = useHeroStore((s) => s.selected);

  return (
    <Canvas
      style={{ touchAction: 'pan-y' }} // H34: un dedo desplaza la página; dos dedos manejan la maqueta
      dpr={[1, 2]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 38, near: 10, far: radius * 6, position: [0, radius, radius] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      raycaster={{ params: { Points: { threshold: 18 }, Line: { threshold: 1 }, Mesh: {}, LOD: {}, Sprite: {} } }}
      onPointerEnter={() => setInteracting(true)}
      onPointerLeave={() => setInteracting(false)}
    >
      <color attach="background" args={[colors.fondo]} />
      <fog attach="fog" args={[colors.fondo, radius * 0.9, radius * 3]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-radius, radius * 1.4, radius * 0.6]} intensity={1.1} color={colors.linea} />
      <directionalLight position={[radius, radius * 0.4, -radius]} intensity={0.9} color={colors.linea} />
      <GroundLayer base={base} project={project} colors={colors} />
      <RoadsLayer features={base.layers.vias.features} project={project} colors={colors} />
      <BuildingsLayer
        features={base.layers.edificios.features as Feature<Polygon | MultiPolygon>[]}
        project={project}
        colors={colors}
      />
      <Particles size={size} colors={colors} still={reducedMotion} />
      <PlaceLayers layers={layers} />
      <Billboards places={selected ? [selected] : []} />
      <CameraRig radius={radius} reducedMotion={reducedMotion} />
      <PerfProbe />
    </Canvas>
  );
}
