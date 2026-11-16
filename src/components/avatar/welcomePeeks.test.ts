import { describe, expect, it } from 'vitest';
import { placePeeks, SLOTS, visibleBox, type Rect, type Size } from './welcomePeeks';

// D82: 8 Mini Marie, ninguna tapa letrero, botón ni chat, ni se pisan; ≤ 12 % de la pantalla.
const ASPECT = 327 / 640; // cuadro del saludo
/** Igual que .welcome-peek: --peek-h: clamp(96px, 20vmin, 190px). */
const spriteFor = ({ w, h }: Size): Size => {
  const height = Math.min(190, Math.max(96, 0.2 * Math.min(w, h)));
  return { w: height * ASPECT, h: height };
};
const rect = (left: number, top: number, width: number, height: number): Rect =>
  ({ left, top, right: left + width, bottom: top + height });

/** Obstáculos medidos en el sitio (letrero, botón, chat, WhatsApp, barra de accesibilidad). */
const CASES: [Size, Rect[]][] = [
  [{ w: 1440, h: 900 }, [rect(560, 360, 320, 110), rect(600, 494, 240, 48), rect(1290, 820, 56, 56),
    rect(1360, 820, 56, 56), rect(1386, 316, 54, 268)]],
  [{ w: 390, h: 844 }, [rect(40, 360, 310, 60), rect(80, 444, 230, 48), rect(250, 772, 56, 56),
    rect(318, 772, 56, 56), rect(336, 690, 54, 60)]],
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
