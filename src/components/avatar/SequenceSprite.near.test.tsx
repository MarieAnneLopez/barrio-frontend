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
