// Zonas de clic: cada foto tiene un botón nativo que se coloca sobre su tarjeta, recortado al contorno
// proyectado de la geometría deformada. Los botones de las fotos que no se ven quedan aparcados: siguen
// en el árbol de accesibilidad (se puede llegar a ellos), pero no ocupan sitio ni reciben el puntero.
import { surfaceAt, type RibbonLayout } from './ribbonGeometry';
import { cardZone, onScreen } from './ribbonProject';
import type { Placed } from './ribbonScene';

const px = (value: number) => `${value.toFixed(1)}px`;

export function parkHit(button: HTMLElement): void {
  Object.assign(button.style, { transform: 'translate(0px, 0px)', width: '1px', height: '1px', clipPath: 'inset(50%)', pointerEvents: 'none', zIndex: '' });
  button.dataset.parked = 'true';
}

export interface Hits {
  /** Botones nuevos (se aparcan todos hasta el próximo cuadro). */
  setButtons(buttons: readonly HTMLElement[]): void;
  place(placed: readonly Placed[], layout: RibbonLayout): void;
}

/** `onHidden` avisa si se aparcó el botón que tenía el foco: así no se queda enfocado sin anillo visible. */
export function createHits(onHidden: (index: number) => void = () => undefined): Hits {
  let buttons: readonly HTMLElement[] = [];
  let shown = new Set<number>();
  return {
    setButtons(next) {
      buttons = next;
      shown = new Set();
      buttons.forEach(parkHit);
    },
    place(placed, layout) {
      const now = new Set<number>();
      // De la más honda a la más cercana: z-index 1 … n (locales al escenario), la más cercana encima.
      const depth = (x: number) => surfaceAt(x, layout.halfW).z;
      [...placed].sort((a, b) => depth(a.x) - depth(b.x)).forEach(({ index, x }, rank) => {
        const button = buttons[index];
        const zone = cardZone(x, layout);
        if (!button || !onScreen(zone, layout)) return;
        now.add(index);
        delete button.dataset.parked;
        Object.assign(button.style, {
          transform: `translate(${px(zone.left)}, ${px(zone.top)})`, width: px(zone.width), height: px(zone.height),
          clipPath: `polygon(${zone.points})`, pointerEvents: '', zIndex: String(rank + 1),
        });
      });
      for (const index of shown) {
        const button = buttons[index];
        if (!button || now.has(index)) continue;
        parkHit(button);
        if (button === document.activeElement) onHidden(index);
      }
      shown = now;
    },
  };
}
