import { describe, expect, it } from 'vitest';
import { STAGE } from './stages';

describe('etapas de montaje de calles y vida', () => {
  it('cada capa pesada en su propio cuadro y ninguna en el cuadro 0, el que crea el lienzo', () => {
    const frames = Object.values(STAGE);
    expect(new Set(frames).size).toBe(frames.length);
    expect(Math.min(...frames)).toBeGreaterThan(0);
  });

  it('lo que necesita algo armado antes va después: árboles tras su suelo, carros tras su grafo, gente tras sus caminos', () => {
    expect(STAGE.trees).toBeGreaterThan(STAGE.treeGround);
    expect(STAGE.cars).toBeGreaterThan(STAGE.lanes);
    expect(STAGE.people).toBeGreaterThan(STAGE.clip);
    expect(STAGE.clip).toBeGreaterThan(STAGE.walks);
  });
});
