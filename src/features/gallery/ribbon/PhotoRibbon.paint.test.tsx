import { act } from '@testing-library/react';
import type { Mesh, Scene, ShaderMaterial } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderers } from './ribbonGlKit';
import { LABELS, mountRibbon } from './ribbonHarness';
import { coverUv } from './ribbonShader';

vi.mock('three', async (original) => (await import('./ribbonGlKit')).fakeThree(original));
afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
  document.documentElement.className = '';
});

/** Tarjetas que se dibujaron en el último cuadro, con sus uniformes. */
const cards = () => {
  const scene = renderers[0]?.render.mock.calls.at(-1)?.[0] as Scene;
  return scene.children
    .filter((child) => (child as Mesh).isMesh && child.visible && 'uCenter' in ((child as Mesh).material as ShaderMaterial).uniforms)
    .map((child) => ((child as Mesh).material as ShaderMaterial).uniforms);
};
const centered = () => cards().find((uniforms) => Math.abs(uniforms.uCenter?.value as number) < 1e-6);

describe('PhotoRibbon con WebGL: lo que se pinta', () => {
  it('la etiqueta real se pinta en la textura de cada tarjeta visible, en la tipografía de texto', async () => {
    const { painted, advance } = await mountRibbon({ before: () => vi.stubGlobal('devicePixelRatio', 2) });
    advance(2);
    const texts = painted.texts.map((text) => text.text);
    expect(texts).toEqual(expect.arrayContaining([LABELS[0], LABELS[1], LABELS[LABELS.length - 1]]));
    expect(texts).not.toContain(LABELS[3]); // lejos: no se pinta hasta que se vaya a ver
    expect(painted.texts[0]?.font).toMatch(/^400 27px /); // 18 px × pixel ratio 1,5
  });

  it('el anillo de foco doble va en la tarjeta del botón enfocado, solo con foco visible', async () => {
    const { hit, advance } = await mountRibbon();
    act(() => hit(0).focus());
    advance(1);
    expect(centered()?.uFocus?.value).toBe(1);
    expect(cards().filter((uniforms) => uniforms.uFocus?.value === 1)).toHaveLength(1);
    act(() => hit(0).blur());
    advance(1);
    expect(centered()?.uFocus?.value).toBe(0);
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
      return selector === ':focus-visible' ? false : matches.call(this, selector);
    });
    act(() => hit(0).focus()); // con el puntero: sin anillo
    advance(1);
    expect(centered()?.uFocus?.value).toBe(0);
  });

  it('cuando llega la foto, la tarjeta la muestra encuadrada en modo cover; antes, el color de espera', async () => {
    const decoded: (() => void)[] = [];
    HTMLImageElement.prototype.decode = () => new Promise<void>((resolve) => decoded.push(resolve));
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1024);
    vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(768);
    const { advance, frames } = await mountRibbon();
    advance(2);
    expect(centered()?.uHasPhoto?.value).toBe(0);
    await act(async () => decoded.splice(0).forEach((resolve) => resolve()));
    expect(frames.pending.size).toBe(1); // la foto pide un cuadro
    advance(1);
    expect(centered()?.uHasPhoto?.value).toBe(1);
    expect((centered()?.uCover?.value as { toArray(): number[] }).toArray()).toEqual(coverUv(4 / 3, 1.6));
  });

  it('alto contraste: al cambiar la clase de <html> se releen los colores y se repintan las etiquetas', async () => {
    const { painted, advance } = await mountRibbon();
    advance(2);
    const before = painted.texts.length;
    await act(async () => {
      document.documentElement.className = 'high-contrast';
      await Promise.resolve();
    });
    advance(1);
    expect(painted.texts.length).toBeGreaterThan(before);
  });
});
