import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { SequenceSprite } from './SequenceSprite';

const strip = () => document.querySelector<HTMLImageElement>('.sequence__strip');
const box = () => document.querySelector<HTMLElement>('.sequence');

beforeEach(() => act(() => useA11yStore.getState().reset()));

describe('SequenceSprite a escala entera (D86)', () => {
  it('sirve el recurso de su tamaño 1:1 y el doble exacto para pantallas 2×', () => {
    render(<SequenceSprite name="wave" size={160} />);
    expect(strip()?.getAttribute('src')).toBe('/assets/avatar/wave/wave_160.webp');
    expect(strip()?.getAttribute('srcset')).toBe('/assets/avatar/wave/wave_160.webp 1x, /assets/avatar/wave/wave_320.webp 2x');
  });

  it('la celda y la tira miden píxeles enteros: el paso de la animación no tiembla', () => {
    render(<SequenceSprite name="wave" size={160} />);
    expect(box()?.style.width).toBe('82px');
    expect(box()?.style.height).toBe('160px');
    expect(strip()?.style.width).toBe('574px'); // 7 cuadros × 82 px
    expect(box()).toHaveAttribute('data-playing');
  });

  it.each([['wave', 320], ['run', 420], ['sit', 96]] as const)('%s a %i px (el mayor) no declara 2×', (name, size) => {
    render(<SequenceSprite name={name} size={size} />);
    expect(strip()?.getAttribute('srcset')).toBeNull();
  });

  it('con movimiento reducido queda en la pose pedida, en píxeles enteros', () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    render(<SequenceSprite name="wave" size={160} pose={2} />);
    expect(box()).not.toHaveAttribute('data-playing');
    expect(strip()?.style.transform).toBe('translateX(-164px)');
  });

  it('rechaza un tamaño que no es de la secuencia (nada de escalas intermedias)', () => {
    expect(() => render(<SequenceSprite name="sit" size={36} />)).toThrow(/sit/);
  });
});
