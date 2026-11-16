import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

const WINDOW = 60;

/**
 * Medición de D12: cada 60 cuadros publica en el contenedor [data-hero]
 * (data-triangles, data-frame-ms) los triángulos dibujados y el frame time
 * medio. Se lee desde el navegador real; nunca se afirma "60 FPS" sin medir.
 */
export function PerfProbe() {
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);
  const acc = useRef({ frames: 0, seconds: 0 });
  // Solo en desarrollo: los scripts de medición leen el estado del render (D83, diagnóstico de color).
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __tintal3d?: unknown }).__tintal3d = get;
  }, [get]);

  useFrame((_, delta) => {
    acc.current.frames += 1;
    acc.current.seconds += delta;
    if (acc.current.frames < WINDOW) return;
    const host = gl.domElement.closest<HTMLElement>('[data-hero]');
    if (host) {
      host.dataset.triangles = String(gl.info.render.triangles);
      host.dataset.points = String(gl.info.render.points); // H34: sprites de lugares + partículas
      host.dataset.frameMs = ((acc.current.seconds / acc.current.frames) * 1000).toFixed(2);
      // D83: 0 = sin tone mapping; «srgb» = salida correcta (el píxel es el hex del tema).
      host.dataset.toneMapping = String(gl.toneMapping);
      host.dataset.colorSpace = gl.outputColorSpace;
    }
    acc.current = { frames: 0, seconds: 0 };
  });

  return null;
}
