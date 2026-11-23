/** Tipos públicos del escenario HINGE (congelados en .ai/CONTRACTS.md). */

/** Cara de un hito: imagen si existe; si no, textura con el año sobre el color de superficie. */
export interface HingeFace {
  imageSrc?: string;
  year: string;
}

export interface HingePanelCanvasProps {
  activeIndex: number;
  faces: ReadonlyArray<HingeFace>;
  reducedMotion: boolean;
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
