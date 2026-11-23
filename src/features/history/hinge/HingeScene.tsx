import { applyProps, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { createFaceLibrary } from './faceTextures';
import { createFrameGate } from './frameGate';
import { HINGE_COLS, HINGE_ROWS } from './hingeMath';
import { createPanelGrid } from './panelGrid';
import { watchPanelHover } from './panelHover';
import { stepSpring } from './spring';
import type { HingePanelCanvasProps } from './types';

interface Resources {
  grid: ReturnType<typeof createPanelGrid>;
  frames: ReturnType<typeof createFrameGate>;
  library: ReturnType<typeof createFaceLibrary>;
}

export function HingeScene({ activeIndex, reducedMotion, faces, onUnavailable }: HingePanelCanvasProps) {
  const { camera, gl, scene, size, invalidate } = useThree();
  const resources = useRef<Resources | null>(null);
  const hover = useRef<ReturnType<typeof watchPanelHover> | null>(null);
  const last = Math.max(0, faces.length - 1);
  const target = Math.min(last, Math.max(0, activeIndex));
  const progress = useRef({ position: target, velocity: 0 });

  // El desmontaje de los efectos de layout libera las mallas y texturas antes del renderer.
  useEffect(() => () => gl.dispose(), [gl]);
  useLayoutEffect(() => {
    const frames = createFrameGate(gl.domElement, invalidate);
    const grid = createPanelGrid();
    const library = createFaceLibrary(frames.refresh, onUnavailable);
    resources.current = { grid, frames, library };
    scene.add(grid.group);
    gl.domElement.addEventListener('webglcontextlost', onUnavailable);
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', onUnavailable);
      resources.current = null;
      frames.dispose();
      scene.remove(grid.group);
      grid.dispose();
      library.dispose();
    };
  }, [gl, invalidate, onUnavailable, scene]);

  useLayoutEffect(() => {
    const engine = resources.current;
    if (!engine) return;
    const syncPalette = () => {
      const style = getComputedStyle(gl.domElement);
      const token = (name: string) => style.getPropertyValue(name).trim();
      engine.grid.edge.color.setStyle(token('--border-strong'));
      engine.library.sync(faces, token('--bg-surface'), token('--text-primary'));
      engine.frames.refresh();
    };
    syncPalette();
    const observer = new MutationObserver(syncPalette);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [faces, gl, onUnavailable]);

  useLayoutEffect(() => {
    if (!('isOrthographicCamera' in camera)) return;
    applyProps(camera, { zoom: Math.min(size.width / HINGE_COLS, size.height / HINGE_ROWS) / 1.14 });
    camera.updateProjectionMatrix();
    resources.current?.frames.refresh();
  }, [camera, size.width, size.height]);

  useLayoutEffect(() => {
    const engine = resources.current;
    if (!engine || reducedMotion) return;
    hover.current = watchPanelHover(gl.domElement, camera, engine.grid.panels, engine.frames.refresh);
    return () => { hover.current?.dispose(); hover.current = null; };
  }, [gl, camera, reducedMotion, onUnavailable]);

  useLayoutEffect(() => {
    if (reducedMotion || progress.current.position > last) {
      progress.current = { position: reducedMotion ? target : last, velocity: 0 };
    }
    resources.current?.frames.refresh();
  }, [target, last, reducedMotion]);

  // Prioridad positiva: incluso los frames internos de R3F por resize pasan por la política de visibilidad.
  useFrame((_, dt) => {
    const engine = resources.current;
    if (!engine || !engine.frames.pending(progress.current.position !== target)) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    if (gl.getPixelRatio() !== ratio) gl.setPixelRatio(ratio);
    progress.current = stepSpring(progress.current, target, dt);
    engine.grid.pose(progress.current.position, engine.library.texture);
    engine.grid.group.updateMatrixWorld(true);
    engine.grid.hover(hover.current?.current());
    gl.render(scene, camera);
    engine.frames.painted(progress.current.position !== target);
  }, 1);
  return null;
}
