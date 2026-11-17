import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlightPhoto } from './FlightPhoto';

const PHOTO = { id: 'biblioteca-exterior', width: 1280, height: 960, author: 'A', license: 'CC BY 4.0', licenseUrl: null, source: 'https://commons.wikimedia.org/' };
const photo = () => screen.getByAltText('Fachada de la biblioteca');
const mount = () => render(<FlightPhoto photo={PHOTO} alt="Fachada de la biblioteca" sizes="90vw" className="marco" />);

/** jsdom no trae `img.decode()`: aquí se pone uno que la prueba resuelve o rechaza cuando quiere. */
function fakeDecode() {
  const calls: { resolve: () => void; reject: (reason: Error) => void }[] = [];
  const decode = vi.fn(() => new Promise<void>((resolve, reject) => calls.push({ resolve, reject })));
  Object.defineProperty(HTMLImageElement.prototype, 'decode', { configurable: true, value: decode });
  return { decode, calls };
}

afterEach(() => void Reflect.deleteProperty(HTMLImageElement.prototype, 'decode'));

describe('foto del vuelo: decodificada antes de mostrarse', () => {
  it('pide la decodificación al montar y no se marca lista hasta que termina', async () => {
    const { decode, calls } = fakeDecode();
    mount();
    expect(decode).toHaveBeenCalledTimes(1);
    expect(decode.mock.contexts[0]).toBe(photo());
    expect(photo()).not.toHaveAttribute('data-ready');

    await act(async () => calls[0]?.resolve());
    expect(photo()).toHaveAttribute('data-ready');
  });

  it('si la decodificación falla no se queda oculta para siempre: se muestra igual', async () => {
    const { calls } = fakeDecode();
    mount();
    await act(async () => calls[0]?.reject(new Error('EncodingError')));
    expect(photo()).toHaveAttribute('data-ready');
  });

  it('sin `decode()` (navegador antiguo) se muestra desde el principio', () => {
    mount();
    expect(photo()).toHaveAttribute('data-ready');
  });

  it('usa los archivos locales de la foto (640 y 1280 px), sus medidas y el texto alternativo', () => {
    mount();
    expect(photo()).toHaveAttribute('src', '/assets/photos/carrusel/biblioteca-exterior-1280.webp');
    expect(photo()).toHaveAttribute(
      'srcset',
      '/assets/photos/carrusel/biblioteca-exterior-640.webp 640w, /assets/photos/carrusel/biblioteca-exterior-1280.webp 1280w',
    );
    expect(photo()).toHaveAttribute('sizes', '90vw');
    expect([photo().getAttribute('width'), photo().getAttribute('height')]).toEqual(['1280', '960']);
    expect(photo()).toHaveClass('marco');
  });
});
