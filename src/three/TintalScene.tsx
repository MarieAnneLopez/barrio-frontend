import '../components/map/map.css'; // estilo .map-marker de los billboards
import { Canvas } from '@react-three/fiber';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { useMemo } from 'react';
import { Billboards } from './Billboards';
import { BuildingsLayer } from './BuildingsLayer';
import { CameraRig } from './CameraRig';
import { GroundLayer } from './GroundLayer';
import { useHeroStore, type HeroPlace } from './heroStore';
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
  const { base, places } = data;
  const colors = useMemo(() => readSceneColors(), []);
  const project = useMemo(() => createProjection(base.polygon.bbox), [base]);
  const size = useMemo(() => bboxSize(base.polygon.bbox), [base]);
  const radius = Math.max(size[0], size[1]) * 0.95;
  const setInteracting = useHeroStore((s) => s.setInteracting);
  const billboards = useMemo<HeroPlace[]>(
    () =>
      places.features.map((f) => {
        const [x, z] = project(f.geometry.coordinates);
        return { id: f.properties.id, name: String(f.properties.nombre ?? f.properties.id),
          slug: 'centros-educativos', emoji: '🎓', position: [x, 70, z] };
      }),
    [places, project],
  );

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 38, near: 10, far: radius * 6, position: [0, radius, radius] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerEnter={() => setInteracting(true)}
      onPointerLeave={() => setInteracting(false)}
    >
      <color attach="background" args={[colors.ink]} />
      <fog attach="fog" args={[colors.ink, radius * 0.9, radius * 3]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-radius, radius * 1.4, radius * 0.6]} intensity={1.1} color={colors.sky} />
      <directionalLight position={[radius, radius * 0.4, -radius]} intensity={0.9} color={colors.sky} />
      <GroundLayer base={base} project={project} colors={colors} />
      <RoadsLayer features={base.layers.vias.features} project={project} colors={colors} />
      <BuildingsLayer
        features={base.layers.edificios.features as Feature<Polygon | MultiPolygon>[]}
        project={project}
        colors={colors}
      />
      <Particles size={size} colors={colors} still={reducedMotion} />
      <Billboards places={billboards} />
      <CameraRig radius={radius} reducedMotion={reducedMotion} />
      <PerfProbe />
    </Canvas>
  );
}
