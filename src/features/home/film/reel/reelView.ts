// Lienzo WebGL del reel: un renderer transparente de three con su propio <canvas>, que se crea al
// montar y se destruye del todo al desmontar (en la app ya vive otro contexto, el de la maqueta 3D).
import { WebGLRenderer } from 'three';
import type { Cover } from './coverLayout';
import { readPalette } from './coverTexture';
import { createReelScene } from './reelScene';

/** Tope del pixel ratio: más no se nota y cuesta el cuádruple de píxeles. */
const MAX_PIXEL_RATIO = 2;
/** Contexto transparente y sin lo que el reel no usa: el borde lo suaviza el shader y no hay profundidad. */
const CONTEXT = { alpha: true, antialias: false, depth: false, stencil: false } as const;

export interface ReelView {
  /** Ancho del lienzo en px. */
  width(): number;
  /** Ajusta el lienzo a su contenedor y publica el tamaño de la tarjeta central para el titular. */
  resize(): void;
  /** Portadas nuevas, o las mismas con los colores de ahora (cambio de idioma o de contraste). */
  setCovers(covers: readonly Cover[]): void;
  draw(phase: number, bend: number, tilt: number, time: number): void;
  pick(x: number, y: number): number | null;
  dispose(): void;
}

/**
 * Crea el lienzo dentro de `frame`. Lanza un error, sin ruido en la consola, si el navegador no da
 * un contexto WebGL 2. `stage` recibe --reel-card-w, --reel-card-h y --reel-room (el hueco a cada
 * lado de la tarjeta central); `onLost` avisa si el contexto se pierde.
 */
export function createReelView(frame: HTMLElement, stage: HTMLElement, count: number, onLost: () => void): ReelView {
  const canvas = document.createElement('canvas');
  // Se pide aquí el contexto (three recibe luego ese mismo): si el navegador lo niega, se sabe sin que three lo grite.
  if (!canvas.getContext('webgl2', CONTEXT)) throw new Error('WebGL 2 no disponible');
  const renderer = new WebGLRenderer({ canvas, ...CONTEXT });
  canvas.setAttribute('aria-hidden', 'true');
  canvas.addEventListener('webglcontextlost', onLost);
  frame.appendChild(canvas);
  const reel = createReelScene(count, Math.min(4, renderer.capabilities.getMaxAnisotropy()));
  const published = ['--reel-card-w', '--reel-card-h', '--reel-room'] as const;
  let width = 0;

  return {
    width: () => width,
    resize() {
      const height = frame.clientHeight;
      width = frame.clientWidth;
      if (width === 0 || height === 0) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)); // sigue al zoom y al monitor
      renderer.setSize(width, height, false);
      const layout = reel.resize(width, height);
      const sizes = [layout.cardWidth, layout.cardHeight, (width - layout.cardWidth) / 2];
      published.forEach((name, at) => stage.style.setProperty(name, `${(sizes[at] ?? 0).toFixed(1)}px`));
    },
    setCovers: (covers) => reel.setCovers(covers, readPalette()),
    draw(phase, bend, tilt, time) {
      reel.update(phase, bend, tilt, time);
      renderer.render(reel.scene, reel.camera);
    },
    pick: reel.pick,
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      reel.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      published.forEach((name) => stage.style.removeProperty(name));
    },
  };
}
