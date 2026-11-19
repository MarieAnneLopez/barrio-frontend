import { act, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderRoute, setViewport } from '../test/renderRoute';

// Al navegar, la página nueva empieza arriba (si no, se abría con el desplazamiento de la anterior y
// la entrada de la sección quedaba fuera de vista); un #ancla va a su sitio, y atrás y adelante
// vuelven a donde se estaba. jsdom no desplaza: se mira qué le pide la app al navegador.
const scrollTo = vi.fn();
const intoView = vi.fn();
const scrolled = (y: number) => Object.defineProperty(window, 'scrollY', { configurable: true, value: y });

beforeEach(() => {
  setViewport(true);
  vi.stubGlobal('scrollTo', scrollTo);
  Element.prototype.scrollIntoView = intoView;
});

afterEach(() => {
  scrollTo.mockClear();
  intoView.mockClear();
  Reflect.deleteProperty(window, 'scrollY');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
});

describe('desplazamiento al cambiar de ruta', () => {
  it('una ruta nueva empieza arriba; atrás y adelante vuelven a donde se estaba', async () => {
    const { router } = renderRoute('/ayuda');
    await screen.findByRole('heading', { level: 1, name: 'Ayuda' });
    scrolled(1200); // se bajó por Ayuda y se eligió Preguntas en el menú fijo o en el pie
    await act(() => router.navigate('/preguntas'));
    await screen.findByRole('heading', { level: 1, name: 'Preguntas Frecuentes' });
    await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith(0, 0));
    scrolled(300);
    await act(() => router.navigate(-1));
    await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith(0, 1200));
    await act(() => router.navigate(1));
    await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith(0, 300));
  });

  it('con #ancla lleva al ancla en vez de arriba', async () => {
    const { router } = renderRoute('/ayuda');
    await screen.findByRole('heading', { level: 1, name: 'Ayuda' });
    scrollTo.mockClear();
    await act(() => router.navigate('/creditos-fotos#contenido'));
    await waitFor(() => expect(intoView).toHaveBeenCalledTimes(1));
    expect(intoView.mock.contexts[0]).toBe(screen.getByRole('main'));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
