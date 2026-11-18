// Contrato entre la página (que va en el trozo de la Galería) y el motor WebGL de la cinta, que se
// descarga aparte con import() dinámico. Este archivo no importa three, ni nada que lo importe.

/** Lo que el motor necesita de cada foto. */
export interface RibbonItem {
  src: string;
  label: string;
}

export interface RibbonOptions {
  /** Contenedor de la cinta: escucha el puntero, la rueda, los clics y el foco de sus botones. */
  frame: HTMLElement;
  /** Donde se monta el <canvas> (sin hijos de React). */
  host: HTMLElement;
  /** Cambió la foto activa: la más cercana al objetivo (la del roving tabindex). */
  onActive(index: number): void;
  /** La cinta quedó quieta con esta foto en el centro (para anunciarla). */
  onSettle(index: number): void;
  /** Abrir la foto en el visor. */
  onOpen(index: number): void;
  /** Se perdió el contexto WebGL: toca volver a la rejilla. */
  onLost(): void;
}

export interface RibbonEngine {
  setItems(items: readonly RibbonItem[]): void;
  /** Botones nativos de las fotos, en el orden de las fotos (data-ribbon-index). */
  setButtons(buttons: readonly HTMLElement[]): void;
  /** Movimiento reducido: sin suavizado, sin lanzamiento y sin rueda; lo explícito responde al instante. */
  setReduced(reduced: boolean): void;
  /** Tecla con el foco en la cinta; devuelve si la usó (entonces no debe hacer nada más). */
  key(key: string): boolean;
  /** Centra una foto por el camino más corto; `instant`: sin recorrido, ya está ahí. */
  center(index: number, instant?: boolean): void;
  dispose(): void;
}

/** ¿Tiene sentido pedir el motor? jsdom y los navegadores sin WebGL 2 se quedan con la rejilla. */
export const supportsWebGL = (): boolean => typeof WebGL2RenderingContext !== 'undefined';

/**
 * ¿Da el navegador un contexto WebGL 2 de verdad? Se pregunta antes de descargar el motor, para no
 * bajar three en balde; el contexto de prueba se suelta enseguida.
 */
export function canCreateWebGL(): boolean {
  const context = document.createElement('canvas').getContext('webgl2');
  context?.getExtension('WEBGL_lose_context')?.loseContext();
  return context !== null;
}
