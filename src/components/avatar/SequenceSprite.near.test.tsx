import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SequenceSprite } from './SequenceSprite';
import { spriteUrl } from './sequences';

type Callback = (entries: { isIntersecting: boolean }[]) => void;
let notify: Callback = () => undefined;

class FakeObserver {
  constructor(callback: Callback) {
    notify = callback;
  }
  observe() {}
  disconnect() {}
}

afterEach(() => vi.unstubAllGlobals());

describe('SequenceSprite: recursos pesados solo cuando hacen falta (rendimiento)', () => {
  it('en el pie (lazy) no pide el atlas hasta que Mini Marie está cerca de la pantalla', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const { container } = render(<SequenceSprite name="idle" size={140} lazy />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.sequence')).toHaveStyle({ height: '140px' }); // la caja ya ocupa su sitio
    act(() => notify([{ isIntersecting: true }]));
    expect(container.querySelector('img')).toHaveAttribute('src', spriteUrl('idle', 140));
  });

  // Auditoría MM-02: las filas arrancaban al montar y las columnas al llegar la imagen; desfasadas
  // para siempre, el cuadro mostrado (8 · fila + columna) salía fuera de orden.
  it('con lazy, filas y columnas arrancan juntas cuando llega la imagen, con el mismo retraso', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const { container } = render(<SequenceSprite name="idle" size={140} lazy phase={0.4} />);
    const box = container.querySelector('.sequence');
    const rows = () => container.querySelector<HTMLElement>('.sequence__rows');
    expect(box).not.toHaveAttribute('data-playing'); // sin imagen, las filas no corren
    expect(rows()?.style.animationDuration).toBe('');
    act(() => notify([{ isIntersecting: true }]));
    const strip = container.querySelector<HTMLElement>('.sequence__strip');
    expect(box).toHaveAttribute('data-playing');
    expect(rows()?.style.animationDuration).not.toBe('');
    expect(strip?.style.animationDelay).not.toBe('');
    expect(rows()?.style.animationDelay).toBe(strip?.style.animationDelay);
  });

  it('con un atlas fijo usa solo ese archivo, sin fuentes por densidad', () => {
    const { container } = render(<SequenceSprite name="run" size={105} atlas={210} />);
    expect(container.querySelectorAll('source')).toHaveLength(0);
    expect(container.querySelector('img')).toHaveAttribute('src', spriteUrl('run', 210));
  });

  it('sin atlas fijo ofrece el doble y el cuádruple a las pantallas densas', () => {
    const { container } = render(<SequenceSprite name="run" size={105} />);
    expect([...container.querySelectorAll('source')].map((s) => s.getAttribute('srcset'))).toEqual([
      spriteUrl('run', 420), spriteUrl('run', 210),
    ]);
  });
});
