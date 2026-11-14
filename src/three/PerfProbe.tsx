import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';

const WINDOW = 60;

/**
 * Medición de D12: cada 60 cuadros publica en el contenedor [data-hero]
 * (data-triangles, data-frame-ms) los triángulos dibujados y el frame time
 * medio. Se lee desde el navegador real; nunca se afirma "60 FPS" sin medir.
 */
export function PerfProbe() {
  const gl = useThree((s) => s.gl);
  const acc = useRef({ frames: 0, seconds: 0 });

  useFrame((_, delta) => {
    acc.current.frames += 1;
    acc.current.seconds += delta;
    if (acc.current.frames < WINDOW) return;
    const host = gl.domElement.closest<HTMLElement>('[data-hero]');
    if (host) {
      host.dataset.triangles = String(gl.info.render.triangles);
      host.dataset.frameMs = ((acc.current.seconds / acc.current.frames) * 1000).toFixed(2);
    }
    acc.current = { frames: 0, seconds: 0 };
  });

  return null;
}
