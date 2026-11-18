import { useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { BufferGeometry, Mesh, type Material } from 'three';

/** Si la compilación en segundo plano no avisa en este tiempo (ms), se muestra igual. */
const COMPILE_WAIT_MS = 4000;

/**
 * true cuando el programa del material ya está compilado para esta escena (niebla incluida).
 * Usa compileAsync de three (KHR_parallel_shader_compile cuando existe): la compilación no
 * bloquea el hilo principal y las teselas aparecen sin un cuadro largo.
 */
export function useShaderReady(material: Material): boolean {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const [ready, setReady] = useState<Material | null>(null);

  useEffect(() => {
    let alive = true;
    const probe = new Mesh(new BufferGeometry(), material);
    const done = () => {
      if (alive) setReady(material);
    };
    const timer = window.setTimeout(done, COMPILE_WAIT_MS);
    gl.compileAsync(probe, camera, scene).then(done, done);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      probe.geometry.dispose();
    };
  }, [gl, camera, scene, material]);

  return ready === material;
}
