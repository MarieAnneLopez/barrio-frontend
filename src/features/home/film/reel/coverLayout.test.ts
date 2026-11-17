import { describe, expect, it } from 'vitest';
import en from '../../../../i18n/en.json';
import es from '../../../../i18n/es.json';
import { CATEGORIES } from '../../../../lib/categoryConfig';
import { coverNumber, fitLines, NAME_BOX, wrapWords } from './coverLayout';

// Medida de mentira: cada letra ocupa medio cuerpo (Anton es condensada; la real la da el canvas).
const measure = (text: string, size: number) => text.length * size * 0.5;
const widthAt = (size: number) => (text: string) => measure(text, size);

describe('reparto de palabras', () => {
  it('llena cada línea sin pasarse del ancho', () => {
    expect(wrapWords(['CENTROS', 'EDUCATIVOS'], widthAt(100), 600)).toEqual(['CENTROS', 'EDUCATIVOS']);
    expect(wrapWords(['ZONAS', 'VERDES'], widthAt(100), 600)).toEqual(['ZONAS VERDES']);
    expect(wrapWords(['INFORMACIÓN', 'DE', 'LA', 'LOCALIDAD'], widthAt(100), 700)).toEqual(['INFORMACIÓN DE', 'LA LOCALIDAD']);
  });

  it('una palabra más ancha que la caja se queda sola en su línea', () => {
    expect(wrapWords(['VETERINARIAS', 'YA'], widthAt(200), 600)).toEqual(['VETERINARIAS', 'YA']);
    expect(wrapWords([], widthAt(100), 600)).toEqual([]);
  });
});

describe('ajuste del nombre a la portada', () => {
  const box = { width: 600, height: 300, maxLines: 3, leading: 1, sizes: [200, 150, 100, 50] };

  it('elige el cuerpo más grande con el que cabe a lo ancho, a lo alto y en líneas', () => {
    expect(fitLines(['LIBRERÍAS'], measure, box)).toEqual({ size: 100, lines: ['LIBRERÍAS'] }); // 9 letras
    expect(fitLines(['ZONAS', 'VERDES'], measure, box)).toEqual({ size: 150, lines: ['ZONAS', 'VERDES'] });
    expect(fitLines(['A', 'B', 'C', 'D'], measure, box)).toEqual({ size: 150, lines: ['A B C D'] }); // a 200, dos líneas no caben a lo alto
  });

  it('si nada cabe, usa el cuerpo menor en vez de dejar la portada vacía', () => {
    const fit = fitLines(['SUPERCALIFRAGILISTICOESPIALIDOSO', 'Y', 'MÁS'], measure, box);
    expect(fit.size).toBe(50);
    expect(fit.lines.join(' ')).toBe('SUPERCALIFRAGILISTICOESPIALIDOSO Y MÁS');
  });

  it.each([['es', es.categories], ['en', en.categories]] as const)('los 14 nombres en %s caben en la portada real', (_lang, names) => {
    for (const { slug } of CATEGORIES) {
      const name = (names as unknown as Record<string, { name: string }>)[slug]?.name ?? '';
      const fit = fitLines(name.toUpperCase().split(' '), measure, NAME_BOX);
      expect(fit.lines.length, name).toBeLessThanOrEqual(NAME_BOX.maxLines);
      expect(fit.size, name).toBeGreaterThanOrEqual(96); // se lee en la tarjeta central y en las vecinas
      for (const line of fit.lines) expect(measure(line, fit.size), name).toBeLessThanOrEqual(NAME_BOX.width);
    }
  });
});

describe('número del módulo', () => {
  it('siempre con dos cifras', () => {
    expect([1, 9, 10, 14].map(coverNumber)).toEqual(['01', '09', '10', '14']);
  });
});
