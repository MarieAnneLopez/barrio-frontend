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

export function createHits(): Hits {
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
      for (const { index, x } of placed) {
        const button = buttons[index];
        const zone = cardZone(x, layout);
        if (!button || !onScreen(zone, layout)) continue;
        now.add(index);
        delete button.dataset.parked;
        Object.assign(button.style, {
          transform: `translate(${px(zone.left)}, ${px(zone.top)})`, width: px(zone.width), height: px(zone.height),
          clipPath: `polygon(${zone.points})`, pointerEvents: '',
          zIndex: String(Math.round(1000 + 10 * surfaceAt(x, layout.halfW).z)), // la más cercana, encima
        });
      }
      for (const index of shown) {
        const button = buttons[index];
        if (button && !now.has(index)) parkHit(button);
      }
      shown = now;
    },
  };
}
