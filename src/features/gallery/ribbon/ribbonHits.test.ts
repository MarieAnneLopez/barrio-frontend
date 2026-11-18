import { describe, expect, it } from 'vitest';
import { layoutFor, surfaceAt } from './ribbonGeometry';
import { createHits } from './ribbonHits';

const layout = layoutFor(1440, 836);
const mount = () => {
  const buttons = Array.from({ length: 7 }, () => document.createElement('button'));
  const hits = createHits();
  hits.setButtons(buttons);
  return { buttons, hits };
};
const zOf = (button: HTMLElement | undefined) => Number(button?.style.zIndex);

describe('zonas de clic de la cinta', () => {
  it('z-index pequeños (1 … n), locales al escenario: la tarjeta más cercana a la cámara queda encima', () => {
    const { buttons, hits } = mount();
    const placed = [{ index: 6, x: -layout.pitch }, { index: 0, x: 0 }, { index: 1, x: layout.pitch }];
    hits.place(placed, layout);
    const byDepth = [...placed].sort((a, b) => surfaceAt(a.x, layout.halfW).z - surfaceAt(b.x, layout.halfW).z);
    expect(byDepth.map(({ index }) => zOf(buttons[index]))).toEqual([1, 2, 3]);
  });

  it('las que dejan de verse quedan aparcadas: sin z-index, sin puntero y con su marca', () => {
    const { buttons, hits } = mount();
    hits.place([{ index: 0, x: 0 }, { index: 1, x: layout.pitch }], layout);
    hits.place([{ index: 0, x: 0 }], layout);
    expect(buttons[1]?.style.zIndex).toBe('');
    expect(buttons[1]?.style.pointerEvents).toBe('none');
    expect(buttons[1]).toHaveAttribute('data-parked', 'true');
    expect(zOf(buttons[0])).toBe(1);
  });
});
