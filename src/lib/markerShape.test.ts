import { describe, expect, it } from 'vitest';
import { createEmojiMarker, setMarkerSelected } from '../components/map/EmojiMarker';
import { CATEGORIES } from './categoryConfig';
import { markerShape } from './markerShape';

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

  it('el marcador del mapa lleva su forma y una etiqueta corta con el nombre', () => {
    const marker = createEmojiMarker({ emoji: '🚉', label: 'Portal El Tintal', verified: true, shape: 'rombo' }, () => undefined);
    expect(marker.dataset.shape).toBe('rombo');
    expect(marker.querySelector('.map-marker__label')?.textContent).toBe('Portal El Tintal');
    expect(marker).toHaveAccessibleName('Portal El Tintal');
    setMarkerSelected(marker, true);
    expect(marker.dataset.selected).toBe('true');
  });
});
