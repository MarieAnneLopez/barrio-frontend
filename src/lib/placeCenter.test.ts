import { describe, expect, it } from 'vitest';
import { geometryBounds, placeCenter } from './placeCenter';

describe('centro de un lugar (marcador y enfoque de la maqueta)', () => {
  it('un punto es su propio centro', () => {
    expect(placeCenter({ type: 'Point', coordinates: [-74.157404, 4.653067] })).toEqual({ lat: 4.653067, lon: -74.157404 });
  });

  it('el centro de un tramo o un parque es el del rectángulo que lo contiene', () => {
    expect(placeCenter({ type: 'LineString', coordinates: [[-74.16, 4.65], [-74.15, 4.66]] })).toEqual({
      lat: 4.655, lon: -74.155,
    });
    const ring = [[-74.2, 4.6], [-74.1, 4.6], [-74.1, 4.7], [-74.2, 4.6]];
    expect(placeCenter({ type: 'MultiPolygon', coordinates: [[ring]] })).toEqual({ lat: 4.65, lon: -74.15 });
  });

  it('sin geometría o vacía no hay centro', () => {
    expect(placeCenter(null)).toBeNull();
    expect(placeCenter({ type: 'MultiPoint', coordinates: [] })).toBeNull();
  });

  it('el rectángulo va de suroeste a noreste, también en colecciones', () => {
    expect(geometryBounds({ type: 'GeometryCollection', geometries: [
      { type: 'Point', coordinates: [1, 5] }, { type: 'LineString', coordinates: [[-2, 3], [4, -1]] },
    ] })).toEqual([[-2, -1], [4, 5]]);
  });
});
