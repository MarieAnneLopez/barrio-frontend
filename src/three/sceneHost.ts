// Anfitrión único de la maqueta 3D (D83, web3d-integration-patterns: una sola escena viva).
// El lienzo vive en un <div> estable que cada sección con maqueta (Inicio, Mapa 3D) acoge en su
// recuadro: al cambiar de sección el <div> se mueve, pero ni la escena, ni el contexto WebGL, ni
// las geometrías se vuelven a crear. Fuera de esas secciones queda desconectado y sin dibujar.
import { create } from 'zustand';

let element: HTMLDivElement | null = null;

/** Contenedor estable del lienzo (se crea una vez, al primer uso). */
export function sceneHostElement(): HTMLDivElement {
  if (!element) {
    element = document.createElement('div');
    element.dataset.sceneHost = 'true';
    element.style.cssText = 'position:absolute;inset:0';
  }
  return element;
}

interface SceneHost {
  /** Alguna sección pidió la maqueta: desde entonces la escena queda montada. */
  requested: boolean;
  /** El contenedor está dentro de una sección visible en el documento. */
  attached: boolean;
  /** El recuadro está en pantalla (fuera de pantalla no se dibujan cuadros). */
  visible: boolean;
  attach: (slot: HTMLElement) => void;
  detach: () => void;
  setVisible: (visible: boolean) => void;
}

export const useSceneHost = create<SceneHost>()((set) => ({
  requested: false,
  attached: false,
  visible: true,
  attach: (slot) => {
    slot.appendChild(sceneHostElement());
    set({ requested: true, attached: true });
  },
  detach: () => {
    element?.remove();
    set({ attached: false, visible: true });
  },
  setVisible: (visible) => set({ visible }),
}));

/** Para las pruebas: cada una empieza sin escena montada. */
export function resetSceneHost(): void {
  element?.remove();
  element = null;
  useSceneHost.setState({ requested: false, attached: false, visible: true });
}
