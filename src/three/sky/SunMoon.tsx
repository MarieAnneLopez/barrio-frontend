import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, CanvasTexture, Color, SRGBColorSpace, type Sprite } from 'three';
import { mapColor } from '../../lib/cssToken';
import { skyAt, STILL_MS } from './cycle';

/** Disco con halo suave, dibujado una vez en un canvas (sin imágenes externas). */
function discTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const glow = ctx.createRadialGradient(64, 64, 18, 64, 64, 64);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.32, 'rgba(255,255,255,1)');
  glow.addColorStop(0.36, 'rgba(255,255,255,0.35)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Posición en la cúpula para una altura y un azimut (este x+, oeste x−, un poco al norte). */
function place(sprite: Sprite | null, elevation: number, azimuth: number, distance: number): void {
  if (!sprite) return;
  const e = Math.max(elevation, -0.3);
  sprite.position.set(Math.cos(azimuth) * Math.cos(e), Math.sin(e), -0.25 * Math.cos(e)).normalize().multiplyScalar(distance);
  sprite.visible = elevation > -0.12;
}

/**
 * El sol de día y la luna de noche (D106), en posiciones coherentes con el ciclo: salen por el
 * este y se ponen por el oeste. Van lejos, detrás de la maqueta, sin niebla ni escritura de
 * profundidad: los edificios los tapan a ellos, nunca al revés.
 */
export function SunMoon({ distance, still }: { distance: number; still: boolean }) {
  const texture = useMemo(() => discTexture(), []);
  const colors = useMemo(() => ({ sun: new Color(mapColor('ciclo-sol')), moon: new Color(mapColor('ciclo-luna')) }), []);
  const sun = useRef<Sprite>(null);
  const moon = useRef<Sprite>(null);
  useFrame(() => {
    const state = skyAt(still ? STILL_MS : Date.now());
    place(sun.current, state.sunElevation, state.sunAzimuth, distance);
    place(moon.current, state.moonElevation, state.moonAzimuth, distance);
  });
  const size = distance * 0.09;
  return (
    <>
      <sprite ref={sun} scale={[size * 1.6, size * 1.6, 1]} renderOrder={-9}>
        <spriteMaterial map={texture} color={colors.sun} blending={AdditiveBlending} depthWrite={false} fog={false} />
      </sprite>
      <sprite ref={moon} scale={[size, size, 1]} renderOrder={-9}>
        <spriteMaterial map={texture} color={colors.moon} depthWrite={false} fog={false} transparent />
      </sprite>
    </>
  );
}
