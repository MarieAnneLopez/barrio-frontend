import { describe, expect, it } from 'vitest';
import { placePeeks, SLOTS, visibleBox, type Rect, type Size } from './welcomePeeks';

// D82: 8 Mini Marie, ninguna tapa letrero, botón ni chat, ni se pisan; ≤ 12 % de la pantalla.
/** Igual que la bienvenida (D86): 82 × 160 px desde 640 px de ancho de pantalla; 41 × 80 px por debajo. */
const spriteFor = ({ w }: Size): Size => (w >= 640 ? { w: 82, h: 160 } : { w: 41, h: 80 });
const rect = (left: number, top: number, width: number, height: number): Rect =>
  ({ left, top, right: left + width, bottom: top + height });

// Obstáculos medidos en el sitio (2026-11-16, interfaz elegante): barra de accesibilidad, chat,
// WhatsApp, letrero y botón; en móvil cuenta además el panel lateral, que espera fuera de pantalla.
const CASES: [Size, Rect[]][] = [
  [{ w: 1440, h: 900 }, [rect(1386, 315, 54, 270), rect(1292, 817, 56, 56), rect(1360, 820, 56, 56),
    rect(580, 344, 281, 144), rect(607, 512, 227, 44)]],
  [{ w: 390, h: 844 }, [rect(-280, 64, 280, 780), rect(336, 692, 54, 56), rect(250, 770, 56, 56),
    rect(318, 772, 56, 56), rect(133, 356, 125, 64), rect(87, 444, 217, 44)]],
  [{ w: 360, h: 640 }, [rect(-280, 64, 280, 576), rect(306, 488, 54, 56), rect(220, 566, 56, 56),
    rect(288, 568, 56, 56), rect(118, 254, 125, 64), rect(72, 342, 216, 44)]],
];
const area = (r: Rect) => (r.right - r.left) * (r.bottom - r.top);
const overlap = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

describe.each(CASES)('bienvenida a %o', (view, obstacles) => {
  const sprite = spriteFor(view);
  const placed = placePeeks(view, sprite, obstacles);
  const boxes = SLOTS.map((slot) => visibleBox(placed[slot].rotation, placed[slot].x, placed[slot].y, sprite, view));

  it('son exactamente 8 y todas asoman', () => {
    expect(Object.keys(placed)).toHaveLength(8);
    expect(boxes.every(Boolean)).toBe(true);
  });

  it('ninguna tapa el letrero, el botón, el chat ni la barra; tampoco se pisan entre sí', () => {
    const shown = boxes.filter((b): b is Rect => b !== null);
    for (const [i, box] of shown.entries()) {
      for (const obstacle of obstacles) expect(overlap(box, obstacle)).toBe(false);
      for (const other of shown.slice(i + 1)) expect(overlap(box, other)).toBe(false);
    }
  });

  it('la suma de lo visible es ≤ 12 % de la pantalla', () => {
    const total = boxes.reduce((sum, box) => sum + (box ? area(box) : 0), 0);
    expect(total / (view.w * view.h)).toBeLessThanOrEqual(0.12);
  });
});
