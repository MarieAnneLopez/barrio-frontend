import { SRGBColorSpace } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COVER } from './coverLayout';
import { createCoverTexture, paintCover, readPalette } from './coverTexture';
import { fakeCanvas2d } from './glKit';

const palette = { card: 'noche', ink: 'papel', accent: 'ambar', line: 'acero', gap: 'papel', display: 'Anton, sans-serif' };
const cover = { number: '03', name: 'Cámaras de Seguridad' };

afterEach(() => vi.restoreAllMocks());

describe('portada tipográfica de un módulo', () => {
  it('pinta el fondo, el número y el nombre en mayúsculas, con los colores de la paleta', () => {
    const { texts, rects } = fakeCanvas2d();
    const canvas = document.createElement('canvas');
    paintCover(canvas, cover, palette);

    expect([canvas.width, canvas.height]).toEqual([1024, 678]); // la proporción del plano
    expect(rects[0]).toEqual({ fill: 'noche', x: 0, y: 0, width: 1024, height: 678 });
    expect(texts[0]).toMatchObject({ text: '03', fill: 'ambar', x: COVER.margin });
    expect(texts[0]?.font).toMatch(/^400 \d+px Anton, sans-serif$/); // Anton solo tiene el peso 400
    const name = texts.slice(1);
    expect(name.map((line) => line.text).join(' ')).toBe('CÁMARAS DE SEGURIDAD');
    for (const line of name) expect(line).toMatchObject({ fill: 'papel', x: COVER.margin });
  });

  it('el nombre se apoya en el margen inferior y una regla fina lo separa del número', () => {
    const { texts, rects } = fakeCanvas2d();
    paintCover(document.createElement('canvas'), cover, palette);
    const [number, ...name] = texts;
    expect(name.at(-1)?.y).toBe(COVER.height - COVER.margin);
    const rule = rects.find((rect) => rect.fill === 'acero');
    expect(rule).toMatchObject({ x: COVER.margin, width: COVER.width - COVER.margin * 2, height: 2 });
    expect(rule?.y).toBeGreaterThan(number?.y ?? Infinity);
    expect(rule?.y).toBeLessThan((name[0]?.y ?? 0) - Number(/(\d+)px/.exec(name[0]?.font ?? '')?.[1]) * 0.8);
  });

  it('sin contexto 2D no falla', () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext') as unknown as { mockReturnValue(value: null): void };
    getContext.mockReturnValue(null);
    expect(() => paintCover(document.createElement('canvas'), cover, palette)).not.toThrow();
  });

  it('lee colores y tipografía de los tokens al pintar: así sigue al alto contraste', () => {
    const style = { getPropertyValue: (name: string) => ` token(${name}) ` };
    vi.spyOn(window, 'getComputedStyle').mockReturnValue(style as unknown as CSSStyleDeclaration);
    expect(readPalette()).toEqual({
      card: 'token(--bg-accent)',
      ink: 'token(--text-primary)',
      accent: 'token(--text-highlight)',
      line: 'token(--border-ink)',
      gap: 'token(--bg-primary)',
      display: 'token(--ff-display)',
    });
  });

  it('la textura es un canvas propio, en sRGB y con el filtrado anisótropo que se le pida', () => {
    const texture = createCoverTexture(4);
    expect(texture.image).toBeInstanceOf(HTMLCanvasElement);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.anisotropy).toBe(4);
    expect(createCoverTexture(4).image).not.toBe(texture.image);
  });
});
