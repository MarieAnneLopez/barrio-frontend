import { describe, expect, it } from 'vitest';
import { SHAPE_STYLE } from './shapeStyle';

describe('Figuras de la maqueta (D79): no se distinguen solo por color', () => {
  it('cada categoría tiene una combinación única de color, trazo y muestra', () => {
    const keys = Object.values(SHAPE_STYLE).map((s) => `${s.token}|${s.dash?.join('-') ?? 'continuo'}|${s.swatch}`);
    expect(new Set(keys).size).toBe(Object.keys(SHAPE_STYLE).length);
  });

  it('las categorías que comparten color difieren en el trazo', () => {
    const oscuras = Object.values(SHAPE_STYLE).filter((s) => s.token === 'contorno');
    expect(new Set(oscuras.map((s) => s.dash?.join('-') ?? 'continuo')).size).toBe(oscuras.length);
  });
});
