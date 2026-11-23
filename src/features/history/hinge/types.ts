/** Tipos públicos de la cubierta HINGE de cada tarjeta de la línea de tiempo. */

export interface HingePanelCanvasProps {
  /** Tarjeta real (HTML) que la cubierta tapa y descubre; de ella salen tamaño, colores y progreso. */
  card: HTMLElement;
  /** Año del hito, dibujado en la cara frontal (la capa es aria-hidden: no se duplica para lectores). */
  year: string;
  /** Progreso visual al montar: 1 si la tarjeta ya se veía abierta, para no dar saltos. */
  start: number;
  /** La tarjeta quedó abierta y quieta: el lienzo puede desmontarse y liberar la GPU. */
  onRest: () => void;
  onUnavailable: () => void;
  className?: string;
}

/** Estado de un panel para una fracción de giro dada (unidades de panel y radianes). */
export interface HingePanelState {
  rotX: number;
  rotY: number;
  posZ: number;
  outward: number;
}

export interface RenderInput {
  animating: boolean;
  hoverDirty: boolean;
  hidden: boolean;
  inViewport: boolean;
}
