import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhotoFlight } from './PhotoFlight';
import { fakeViewport } from './testDoubles';

// D113: las 9 fotos (~1,8 MB en un celular) no se piden en el arranque, que es del manifiesto. Se
// piden cuando el manifiesto termina o cuando el visitante entra en el vuelo, de dos en dos y en orden.
const cards = () => [...screen.getByRole('region', { name: 'Fotos de El Tintal' }).querySelectorAll('[data-flight="card"] img')];
const asked = () => cards().map((img) => img.hasAttribute('src'));
const backdrop = () => document.querySelector('.flight__backdrop');

/** `img.decode()` de mentira: cada foto queda lista cuando la prueba la resuelve. */
function fakeDecode() {
  const pending: { img: HTMLImageElement; done: () => void }[] = [];
  const decode = vi.fn(function (this: HTMLImageElement) {
    return new Promise<void>((done) => pending.push({ img: this, done }));
  });
  Object.defineProperty(HTMLImageElement.prototype, 'decode', { configurable: true, value: decode });
  return { ready: (index: number) => pending.find(({ img }) => img === cards()[index])?.done() };
}

afterEach(() => void Reflect.deleteProperty(HTMLImageElement.prototype, 'decode'));

describe('Vuelo entre fotos: las fotos se piden cuando hacen falta (rendimiento)', () => {
  it('en el arranque no pide ninguna; la caja de cada foto ya ocupa su sitio', () => {
    fakeViewport();
    fakeDecode();
    render(<PhotoFlight />);
    expect(asked()).toEqual(Array(9).fill(false));
    expect(backdrop()).not.toHaveAttribute('src');
    expect(cards().every((img) => img.getAttribute('width') && img.getAttribute('height'))).toBe(true);
  });

  it('al terminar el manifiesto pide las dos primeras (y el fondo); cada foto lista suelta la siguiente', async () => {
    fakeViewport();
    const decode = fakeDecode();
    const { rerender } = render(<PhotoFlight />);
    rerender(<PhotoFlight warm />);
    expect(asked()).toEqual([true, true, false, false, false, false, false, false, false]);
    expect(backdrop()).toHaveAttribute('src', cards()[1]?.getAttribute('src'));
    await act(async () => decode.ready(0));
    expect(asked().slice(0, 4)).toEqual([true, true, true, false]);
    await act(async () => decode.ready(1));
    expect(asked().slice(0, 5)).toEqual([true, true, true, true, false]);
  });

  it('si el visitante entra en el vuelo antes de que acabe el manifiesto, empieza igual', () => {
    const viewport = fakeViewport();
    fakeDecode();
    render(<PhotoFlight />);
    act(() => viewport.show(true));
    expect(asked().slice(0, 3)).toEqual([true, true, false]);
  });
});
