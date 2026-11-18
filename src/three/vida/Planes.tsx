import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Vector3 } from 'three';
import { writePose } from '../streets/instances';
import { partsMaterial } from '../streets/parts';
import { planeModel } from './models';
import { activeFlights, flightAltitude, flightPose, MAX_FLIGHTS, sightAnchor } from './flights';
import type { VidaPalette } from './vidaPalette';

interface Props {
  center: readonly [number, number];
  radius: number;
  palette: VidaPalette;
}

const ACTIVE: number[] = [];
const POSE = { x: 0, y: 0, z: 0, yaw: 0 };
const LOOK = new Vector3();

/**
 * Aviones (decorativos) que cruzan alto sobre la isla cada 1–3 min con el reloj de pared (planes.ts):
 * cada uno pasa por donde mira la cámara cuando despega, y de noche lleva sus luces de posición y
 * destellos que parpadean. No se monta con movimiento reducido.
 */
export function Planes({ center, radius, palette: p }: Props) {
  const assets = useMemo(() => ({
    model: planeModel(),
    material: partsMaterial([
      { ...p.avion },
      { ...p.ala },
      { day: p.babor, night: p.babor, glow: p.babor, glowDay: 0.3, glowNight: 2.4 },
      { day: p.estribor, night: p.estribor, glow: p.estribor, glowDay: 0.3, glowNight: 2.4 },
      { day: p.destello, night: p.destello, glow: p.destello, glowDay: 1, glowNight: 3.2, blink: 1.1 },
    ]),
  }), [p]);
  const mesh = useMemo(() => {
    const m = new InstancedMesh(assets.model, assets.material, MAX_FLIGHTS);
    [m.frustumCulled, m.count] = [false, 0];
    return m;
  }, [assets]);
  const anchors = useRef(new Map<number, [number, number]>());
  const ref = useRef<InstancedMesh>(null);
  useEffect(() => () => void mesh.dispose(), [mesh]);
  useEffect(() => () => {
    assets.model.dispose();
    assets.material.dispose();
  }, [assets]);

  useFrame(({ camera }) => {
    const m = ref.current;
    if (!m) return;
    const t = Date.now() / 1000;
    const n = activeFlights(t, ACTIVE);
    const out = m.instanceMatrix.array as Float32Array;
    for (let i = 0; i < n; i++) {
      const k = ACTIVE[i] ?? 0;
      let over = anchors.current.get(k);
      if (!over) {
        camera.getWorldDirection(LOOK);
        const at = camera.position;
        over = sightAnchor([at.x, at.y, at.z], [LOOK.x, LOOK.y, LOOK.z], flightAltitude(k), center, radius);
        anchors.current.set(k, over);
      }
      flightPose(k, t, over, radius, POSE);
      writePose(out, i, POSE.x, POSE.y, POSE.z, POSE.yaw, 1);
    }
    const oldest = n > 0 ? (ACTIVE[0] ?? 0) : Infinity; // los vuelos salen en orden: los anteriores ya aterrizaron
    for (const k of anchors.current.keys()) if (k < oldest) anchors.current.delete(k);
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  });

  return <primitive ref={ref} object={mesh} />;
}
