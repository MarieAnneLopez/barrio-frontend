import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentLook, DEFAULT_LOOK, pickLook, refreshTone, registerTone, subscribeLook } from './toneRegistry';

const band = (top: number, bottom: number, tone?: string, float = false) => ({ top, bottom, tone, float });

function section(top: number, bottom: number, attrs: Record<string, string>): HTMLElement {
  const element = document.createElement('section');
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
  element.getBoundingClientRect = () => ({ top, bottom, left: 0, right: 0, width: 0, height: bottom - top, x: 0, y: top, toJSON: () => ({}) });
  return element;
}

describe('tono del header según la sección que pasa por debajo', () => {
  it('manda la sección que cruza la línea media del header (y = 32 px)', () => {
    const bands = [band(-900, 20, 'noche', true), band(20, 900, 'papel', true), band(900, 1800, 'noche')];
    expect(pickLook(bands)).toEqual({ tone: 'papel', float: true });
    expect(pickLook([band(-900, 40, 'noche', true), band(40, 900, 'papel')])).toEqual({ tone: 'noche', float: true });
  });

  it('sin sección bajo el header, tono noche y fondo sólido', () => {
    expect(pickLook([])).toEqual(DEFAULT_LOOK);
    expect(pickLook([band(200, 900, 'papel', true)])).toEqual({ tone: 'noche', float: false });
    expect(pickLook([band(0, 900, 'otro')])).toEqual({ tone: 'noche', float: false }); // un tono desconocido es noche
  });
});

describe('registro de secciones con tono', () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

  it('al registrar y retirar una sección, el aspecto cambia y se avisa a quien escucha', () => {
    const listener = vi.fn();
    cleanups.push(subscribeLook(listener));
    expect(currentLook()).toEqual(DEFAULT_LOOK);
    const unregister = registerTone(section(0, 800, { 'data-tone': 'papel', 'data-header-float': '' }));
    expect(currentLook()).toEqual({ tone: 'papel', float: true });
    expect(listener).toHaveBeenCalledTimes(1);
    unregister();
    expect(currentLook()).toEqual(DEFAULT_LOOK);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('refreshTone vuelve a leer el tono de una sección que lo cambió (fin de una animación)', () => {
    const element = section(0, 800, { 'data-tone': 'noche', 'data-header-float': '' });
    cleanups.push(registerTone(element));
    expect(currentLook()).toEqual({ tone: 'noche', float: true });
    element.dataset.tone = 'papel';
    refreshTone();
    expect(currentLook()).toEqual({ tone: 'papel', float: true });
  });
});
