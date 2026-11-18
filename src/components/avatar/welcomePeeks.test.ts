import { describe, expect, it } from 'vitest';
import { anchorOf, centerOf, placePeeks, ROTATION, SLOTS, visibleBox, type Rect, type Size } from './welcomePeeks';

// Gran actualización: 8 asomadas FIJAS, 4 en las esquinas exactas y 4 en el centro de cada borde.
/** Igual que la bienvenida (D86): 82 × 160 px desde 640 px de ancho de pantalla; 41 × 80 px por debajo. */
const spriteFor = ({ w }: Size): Size => (w >= 640 ? { w: 82, h: 160 } : { w: 41, h: 80 });
const VIEWS: Size[] = [{ w: 390, h: 844 }, { w: 768, h: 1024 }, { w: 1440, h: 900 }, { w: 1920, h: 1080 }];
const area = (r: Rect) => (r.right - r.left) * (r.bottom - r.top);
const overlap = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

describe.each(VIEWS)('bienvenida a %o', (view) => {
  const sprite = spriteFor(view);
  const placed = placePeeks(view);
  const boxes = SLOTS.map((slot) => visibleBox(placed[slot].rotation, placed[slot].x, placed[slot].y, sprite, view));

  it('son exactamente 8, cada una en su esquina o en el centro de su borde, con la cabeza hacia adentro', () => {
    expect(Object.keys(placed)).toHaveLength(8);
    for (const slot of SLOTS) {
      expect([placed[slot].x, placed[slot].y]).toEqual(anchorOf(slot, view));
      expect(placed[slot].rotation).toBe(ROTATION[slot]);
    }
    expect(anchorOf('tl', view)).toEqual([0, 0]);
    expect(anchorOf('br', view)).toEqual([view.w, view.h]);
    expect(anchorOf('top', view)).toEqual([view.w / 2, 0]);
    expect(anchorOf('left', view)).toEqual([0, view.h / 2]);
  });

  it('todas asoman y el centro de lo que se ve queda centrado en su borde o en la diagonal de su esquina', () => {
    for (const [i, slot] of SLOTS.entries()) {
      const box = boxes[i];
      expect(box, slot).not.toBeNull();
      const center = centerOf(box as Rect);
      const [ax, ay] = anchorOf(slot, view);
      if (slot === 'top' || slot === 'bottom') expect(Math.abs(center.x - ax)).toBeLessThanOrEqual(1);
      if (slot === 'left' || slot === 'right') expect(Math.abs(center.y - ay)).toBeLessThanOrEqual(1);
      if (slot.length === 2) expect(Math.abs(Math.abs(center.x - ax) - Math.abs(center.y - ay))).toBeLessThanOrEqual(1);
    }
  });

  it('no se pisan entre sí y lo visible suma ≤ 12 % de la pantalla', () => {
    const shown = boxes.filter((b): b is Rect => b !== null);
    for (const [i, box] of shown.entries()) for (const other of shown.slice(i + 1)) expect(overlap(box, other)).toBe(false);
    expect(shown.reduce((sum, box) => sum + area(box), 0) / (view.w * view.h)).toBeLessThanOrEqual(0.12);
  });
});
