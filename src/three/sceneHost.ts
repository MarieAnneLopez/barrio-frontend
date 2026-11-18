// Anfitrión único de la maqueta 3D (D83, web3d-integration-patterns: una sola escena viva).
// El lienzo vive en un <div> estable que cada sección con maqueta (Inicio, mapas) acoge en su
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

/** Cómo usa la maqueta la sección que la acoge: el Inicio (órbita de cine) o un mapa a pantalla completa. */
export type SceneMode = 'cine' | 'mapa';

interface SceneHost {
  /** Alguna sección pidió la maqueta: desde entonces la escena queda montada. */
  requested: boolean;
  /** El contenedor está dentro de una sección visible en el documento. */
  attached: boolean;
  /** El recuadro está en pantalla (fuera de pantalla no se dibujan cuadros). */
  visible: boolean;
  /** Modo de la sección que la acogió por última vez (CameraRig encuadra según él). */
  mode: SceneMode;
  attach: (slot: HTMLElement, mode?: SceneMode) => void;
  detach: () => void;
  setVisible: (visible: boolean) => void;
}

export const useSceneHost = create<SceneHost>()((set) => ({
  requested: false,
  attached: false,
  visible: true,
  mode: 'cine',
  attach: (slot, mode = 'cine') => {
    slot.appendChild(sceneHostElement());
    set({ requested: true, attached: true, mode });
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
  useSceneHost.setState({ requested: false, attached: false, visible: true, mode: 'cine' });
}
