import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, Vector3 } from 'three';
import { useHeroStore } from './heroStore';

const ORBIT_SPEED = 0.035; // rad/s: una vuelta cada ~3 minutos
const PARALLAX_MAX = MathUtils.degToRad(6); // ≤ 6° (§11.1.1)
const EASE = 3; // ease-out exponencial: ~95 % del recorrido en ~1 s (fly-to 800–1200 ms)

interface Props {
  radius: number;
  reducedMotion: boolean;
}

/**
 * Cámara en órbita alrededor de El Tintal: auto-órbita lenta (pausable y
 * detenida mientras se interactúa), parallax suave con el puntero y fly-to
 * interrumpible hacia el lugar seleccionado. Movimiento reducido: sin órbita,
 * sin parallax y saltos directos.
 */
export function CameraRig({ radius, reducedMotion }: Props) {
  const camera = useThree((s) => s.camera);
  const state = useRef({ azimuth: 0.6, elevation: 0.62, radius, target: new Vector3() });
  const goalTarget = useRef(new Vector3());
  const parallax = useRef({ x: 0, y: 0 });

  useFrame(({ pointer }, delta) => {
    const { paused, interacting, selected } = useHeroStore.getState();
    const s = state.current;
    const goalRadius = selected ? radius * 0.28 : radius;
    if (selected) goalTarget.current.set(selected.position[0], selected.position[1], selected.position[2]);
    else goalTarget.current.set(0, 0, 0);
    const k = reducedMotion ? 1 : 1 - Math.exp(-EASE * delta);

    if (!reducedMotion && !paused && !interacting && !selected) s.azimuth += ORBIT_SPEED * delta;
    s.radius = MathUtils.lerp(s.radius, goalRadius, k);
    s.target.lerp(goalTarget.current, k);
    const px = reducedMotion ? 0 : pointer.x * PARALLAX_MAX;
    const py = reducedMotion ? 0 : pointer.y * PARALLAX_MAX * 0.5;
    parallax.current.x = MathUtils.lerp(parallax.current.x, px, k);
    parallax.current.y = MathUtils.lerp(parallax.current.y, py, k);

    const az = s.azimuth + parallax.current.x;
    const el = MathUtils.clamp(s.elevation + parallax.current.y, 0.25, 1.2);
    camera.position.set(
      s.target.x + s.radius * Math.cos(el) * Math.sin(az),
      s.target.y + s.radius * Math.sin(el),
      s.target.z + s.radius * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(s.target);
  });

  return null;
}
