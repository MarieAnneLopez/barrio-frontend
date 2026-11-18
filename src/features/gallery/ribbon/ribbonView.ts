// Lienzo WebGL de la cinta: un renderer transparente de three con su propio <canvas>, que se crea al
// montar y se destruye del todo al desmontar (en la app ya vive otro contexto, el de la maqueta 3D).
import { WebGLRenderer } from 'three';
import type { RibbonItem } from './ribbonContract';
import type { RibbonLayout } from './ribbonGeometry';
import { createRibbonScene, type Placed } from './ribbonScene';
import { createPhotoCache } from './ribbonTextures';
import { readTheme } from './ribbonTheme';

/** Tope del pixel ratio: más no se nota en fotos que se mueven y cuesta mucho más. */
export const MAX_PIXEL_RATIO = 1.5;
/** Contexto transparente (el fondo crema es CSS) y sin lo que no se usa: no hay profundidad. */
const CONTEXT = { alpha: true, antialias: false, depth: false, stencil: false } as const;
/** Fotos decodificadas que se guardan: las visibles más unas pocas vecinas. */
const CACHED_PHOTOS = 10;

export interface RibbonView {
  readonly layout: RibbonLayout;
  /** Ajusta el lienzo a su contenedor; false si aún no mide nada. */
  resize(): boolean;
  setItems(items: readonly RibbonItem[]): void;
  /** Vuelve a leer los colores y la tipografía (alto contraste, fuente cargada). */
  setTheme(): void;
  draw(offset: number, focused: number): Placed[];
  dispose(): void;
}

/** Lanza un error, sin ruido en la consola, si el navegador no da un contexto WebGL 2. */
export function createRibbonView(host: HTMLElement, onLost: () => void, onPhoto: () => void): RibbonView {
  const canvas = document.createElement('canvas');
  // Se pide aquí el contexto (three recibe luego ese mismo): si el navegador lo niega, se sabe sin que three lo grite.
  if (!canvas.getContext('webgl2', CONTEXT)) throw new Error('WebGL 2 no disponible');
  const renderer = new WebGLRenderer({ canvas, ...CONTEXT });
  // Un programa que no enlaza en esta GPU dejaría la cinta en blanco (three solo lo registra): queda la rejilla.
  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    const logs = [gl.getProgramInfoLog(program), gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment)];
    console.error('Cinta de la Galería: un shader no compiló; se muestra la rejilla.', ...logs);
    onLost();
  };
  canvas.setAttribute('aria-hidden', 'true');
  canvas.addEventListener('webglcontextlost', onLost);
  host.appendChild(canvas);
  const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const cache = createPhotoCache(CACHED_PHOTOS, anisotropy, onPhoto);
  const ribbon = createRibbonScene(cache, anisotropy);

  return {
    get layout() {
      return ribbon.layout;
    },
    resize() {
      const [width, height] = [host.clientWidth, host.clientHeight];
      if (width === 0 || height === 0) return false;
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO); // sigue al zoom y al monitor
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      ribbon.resize(width, height, ratio);
      return true;
    },
    setItems: (items) => ribbon.setPhotos(items),
    setTheme: () => ribbon.setTheme(readTheme()),
    draw(offset, focused) {
      const placed = ribbon.update(offset, focused);
      renderer.render(ribbon.scene, ribbon.camera);
      return placed;
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      ribbon.dispose();
      cache.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
