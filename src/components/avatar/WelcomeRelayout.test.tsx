import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderRoute, setViewport } from '../../test/renderRoute';

// Menor aplazado de la etapa 1: si la pantalla cambia con la bienvenida abierta (girar el móvil,
// cruzar 640 px), las asomadas se quedaban ancladas a los bordes de antes.
const SEEN = 'mini-marie:welcome-seen';
const resizeTo = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
};

beforeEach(() => {
  window.sessionStorage.removeItem(SEEN);
  setViewport(false);
  resizeTo(390, 844);
});

afterEach(() => resizeTo(1024, 768));

describe('Bienvenida: se recoloca si cambia el tamaño de la pantalla', () => {
  it('al girar la pantalla, las del borde derecho y las de abajo se anclan a los bordes nuevos', async () => {
    renderRoute('/');
    const welcome = await screen.findByRole('dialog', { name: 'Hola' });
    const peek = (slot: string) => welcome.querySelector<HTMLElement>(`.welcome-peek[data-slot="${slot}"]`) as HTMLElement;
    expect(peek('right').style.left).toBe('390px');
    expect(peek('bottom').style.top).toBe('844px');

    resizeTo(844, 390);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(peek('right').style.left).toBe('844px');
    expect(peek('bottom').style.top).toBe('390px');
  });
});
