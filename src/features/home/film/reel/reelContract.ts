// Contrato entre el componente (que va en el trozo inicial del sitio) y el motor WebGL del reel, que
// se descarga aparte con import() dinámico. Este archivo no importa three, ni nada que lo importe.
import type { Cover } from './coverLayout';

export interface ReelOptions {
  section: HTMLElement;
  stage: HTMLElement;
  frame: HTMLElement;
  count: number;
  /** Cambió el módulo que queda en el centro. */
  onIndex(index: number): void;
  /** Clic o Enter sobre la tarjeta central. */
  onOpen(index: number): void;
  /** Se perdió el contexto WebGL: toca volver a la rejilla. */
  onLost(): void;
}

export interface ReelEngine {
  setCovers(covers: readonly Cover[]): void;
  /** Movimiento reducido: sin recorrido ni animación; la navegación explícita responde al instante. */
  setReduced(reduced: boolean): void;
  /** Tecla pulsada con el foco en el reel; devuelve si la usó. */
  key(key: string): boolean;
  dispose(): void;
}

/** ¿Tiene sentido pedir el motor? jsdom y los navegadores sin WebGL 2 se quedan con la rejilla de enlaces. */
export const supportsWebGL = (): boolean => typeof WebGL2RenderingContext !== 'undefined';

/**
 * ¿Da el navegador un contexto WebGL 2 de verdad? (puede existir la API y estar apagada o vetada).
 * Se pregunta justo antes de descargar el motor, para no bajar three en balde; el contexto de
 * prueba se suelta enseguida.
 */
export function canCreateWebGL(): boolean {
  const context = document.createElement('canvas').getContext('webgl2');
  context?.getExtension('WEBGL_lose_context')?.loseContext();
  return context !== null;
}
