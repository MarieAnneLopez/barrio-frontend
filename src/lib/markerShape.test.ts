import { describe, expect, it } from 'vitest';
import { CATEGORIES } from './categoryConfig';
import { markerShape } from './markerShape';

// La forma la dibujan los marcadores de la maqueta (three/emojiTexture) y la leyenda de Mapa 3D.
describe('Forma del marcador por grupo (D82, opción B)', () => {
  it('círculo = servicios, cuadrado = seguridad, rombo = movilidad', () => {
    expect(markerShape('centros-educativos')).toBe('circulo');
    expect(markerShape('barberias')).toBe('circulo');
    expect(['camaras-seguridad', 'robos', 'atencion-inmediata'].map(markerShape)).toEqual(['cuadrado', 'cuadrado', 'cuadrado']);
    expect(markerShape('estaciones-transporte')).toBe('rombo');
  });

  it('las categorías de puntos usan las 3 formas', () => {
    const shapes = CATEGORIES.filter((c) => c.geometry === 'POINT').map((c) => markerShape(c.slug));
    expect(new Set(shapes)).toEqual(new Set(['circulo', 'cuadrado', 'rombo']));
  });
});
