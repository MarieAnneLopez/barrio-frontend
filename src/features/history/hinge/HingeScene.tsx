import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { SRGBColorSpace, type Texture } from 'three';
import { cardTarget } from './cardProgress';
import { createCoverTexture, toRgb } from './faceTextures';
import { createFrameGate } from './frameGate';
import { HINGE_COLS, HINGE_ROWS } from './hingeMath';
import { createPanelGrid } from './panelGrid';
import { stepSpring } from './spring';
import type { HingePanelCanvasProps } from './types';

// Una tarjeta gira entera en ~1 s: ni varios gestos rápidos de scroll aceleran la cascada.
const SPRING_FREQUENCY = 6;
const SPRING_MAX_SPEED = 1.25;
const EDGE_INK = 0.38;

interface Engine {
  grid: ReturnType<typeof createPanelGrid>;
  frames: ReturnType<typeof createFrameGate>;
  cover: Texture | null;
}

export function HingeScene({ card, year, start, onRest, onUnavailable }: HingePanelCanvasProps) {
  const { camera, gl, scene, size, invalidate } = useThree();
  const engine = useRef<Engine | null>(null);
  const progress = useRef({ position: start, velocity: 0 });
  const goal = useRef(start); // último destino: decide dentro de la franja de histéresis
  const handlers = useRef({ onRest, onUnavailable });
  useLayoutEffect(() => { handlers.current = { onRest, onUnavailable }; });

  // El desmontaje de los efectos de layout libera mallas y texturas antes que el renderer.
  useEffect(() => () => gl.dispose(), [gl]);
  useLayoutEffect(() => {
    const frames = createFrameGate(gl.domElement, invalidate);
    const grid = createPanelGrid();
    const current: Engine = { grid, frames, cover: null };
    engine.current = current;
    scene.add(grid.group);
    // Pasivos: solo despiertan el render si el destino cambió; nunca frenan scroll, toque ni foco.
    const wake = () => { if (cardTarget(card, goal.current) !== progress.current.position) frames.refresh(); };
    const lost = () => handlers.current.onUnavailable();
    window.addEventListener('scroll', wake, { passive: true });
    card.addEventListener('focusin', wake);
    card.addEventListener('focusout', wake);
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      window.removeEventListener('scroll', wake);
      card.removeEventListener('focusin', wake);
      card.removeEventListener('focusout', wake);
      gl.domElement.removeEventListener('webglcontextlost', lost);
      engine.current = null;
      frames.dispose();
      scene.remove(grid.group);
      grid.dispose();
      current.cover?.dispose();
    };
  }, [card, gl, invalidate, scene]);

  // Cubierta con el fondo, la tinta y la línea fuerte de la propia tarjeta (tokens ya resueltos).
  useLayoutEffect(() => {
    const current = engine.current;
    if (!current || !size.width || !size.height) return undefined;
    let alive = true;
    const paint = () => {
      if (!alive) return;
      const style = getComputedStyle(card);
      // Canto: el fondo de la tarjeta oscurecido con su tinta; se lee como grosor, no como barra negra.
      const surface = toRgb(style.backgroundColor);
      const [r, g, b] = toRgb(style.color).map((ink, i) => ((surface[i] ?? 0) * (1 - EDGE_INK) + ink * EDGE_INK) / 255);
      current.grid.edge.color.setRGB(r ?? 0, g ?? 0, b ?? 0, SRGBColorSpace);
      const next = createCoverTexture(size.width, size.height, { surface: style.backgroundColor, ink: style.color, year });
      current.cover?.dispose();
      current.cover = next;
      current.grid.setCover(next);
      current.frames.refresh();
    };
    paint();
    void document.fonts?.load('400 100px Anton').then(paint, () => undefined);
    const observer = new MutationObserver(paint); // tema y alto contraste de la barra de accesibilidad
    observer.observe(document.documentElement, { attributes: true });
    return () => { alive = false; observer.disconnect(); };
  }, [card, year, size.width, size.height]);

  // Prioridad positiva: R3F no pinta solo; cada frame pasa por la política de visibilidad.
  useFrame((_, dt) => {
    const current = engine.current;
    if (!current || !size.width || !size.height) return;
    const target = cardTarget(card, goal.current);
    goal.current = target;
    if (!current.frames.pending(progress.current.position !== target)) return;
    progress.current = stepSpring(progress.current, target, dt, SPRING_FREQUENCY, SPRING_MAX_SPEED);
    current.grid.pose(progress.current.position, (size.width / HINGE_COLS) / (size.height / HINGE_ROWS));
    // Los límites de error de React no ven fallos dentro de useFrame: aquí se activa el fallback.
    try { gl.render(scene, camera); } catch { handlers.current.onUnavailable(); return; }
    const moving = progress.current.position !== target;
    current.frames.painted(moving);
    if (!moving && target === 1) handlers.current.onRest();
  }, 1);
  return null;
}
