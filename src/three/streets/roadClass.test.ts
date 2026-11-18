import { describe, expect, it } from 'vitest';
import { TNT3 } from '../data/format';
import { hash01, pickWeighted } from './hash';
import { CAR_STYLE, footSpec, isCarDriven, isCarDrawn, roadSpec, type WayTags } from './roadClass';

const C = TNT3.clasesVia;
const B = TNT3.banderasVia;
const tags = (clase: number, extra: Partial<WayTags> = {}): WayTags => ({ clase, banderas: 0, sentido: 0, carriles: 0, vmax: 0, ...extra });

describe('reglas de dibujo de las vías (TNT3)', () => {
  it('los carriles de OSM mandan; sin dato, la regla de la clase', () => {
    expect(roadSpec(tags(C.primary, { carriles: 4, sentido: 1 })).lanes).toBe(4);
    expect(roadSpec(tags(C.primary, { sentido: 1 })).lanes).toBe(3);
    expect(roadSpec(tags(C.residential)).lanes).toBe(2);
    const wide = roadSpec(tags(C.primary, { carriles: 4, sentido: 1 }));
    expect(wide.width).toBeGreaterThan(roadSpec(tags(C.residential)).width);
    expect(wide.half).toBeCloseTo(wide.width / 2);
  });

  it('las avenidas quedan encima, brillan más de noche y tienen andenes anchos', () => {
    const avenue = roadSpec(tags(C.secondary, { sentido: 1 }));
    const street = roadSpec(tags(C.residential));
    expect(avenue.rank).toBeGreaterThan(street.rank);
    expect(avenue.glow).toBeGreaterThan(street.glow);
    expect(avenue.sidewalk).toBeGreaterThan(street.sidewalk);
    expect(avenue.style & CAR_STYLE.edges).toBeTruthy();
  });

  it('marcas: separadores de carril en un sentido, línea central en doble sentido', () => {
    expect(roadSpec(tags(C.primary, { sentido: 1, carriles: 3 })).style & CAR_STYLE.lanes).toBeTruthy();
    expect(roadSpec(tags(C.residential)).style & CAR_STYLE.center).toBeTruthy();
    expect(roadSpec(tags(C.tertiary)).style & CAR_STYLE.double).toBeTruthy();
    expect(roadSpec(tags(C.service)).style).toBe(0);
  });

  it('velocidad: vmax de OSM o la regla de la clase', () => {
    expect(roadSpec(tags(C.residential, { vmax: 30 })).speed).toBe(30);
    expect(roadSpec(tags(C.primary)).speed).toBeGreaterThan(roadSpec(tags(C.service)).speed);
  });

  it('se dibujan las vehiculares (también en obra) salvo túneles y plazas; los carros no entran a todas', () => {
    expect(isCarDrawn(tags(C.construction))).toBe(true);
    expect(isCarDrawn(tags(C.residential, { banderas: B.tunel }))).toBe(false);
    expect(isCarDrawn(tags(C.footway))).toBe(false);
    expect(isCarDriven(tags(C.residential))).toBe(true);
    for (const banderas of [B.soloBus, B.accesoRestringido, B.tunel, B.area]) {
      expect(isCarDriven(tags(C.service, { banderas }))).toBe(false);
    }
    expect(isCarDriven(tags(C.construction))).toBe(false);
  });

  it('peatonales: ancho por clase, la ciclorruta aparte y sin pasillos interiores', () => {
    expect(footSpec(C.footway)?.width).toBeGreaterThan(1);
    expect(footSpec(C.cycleway)?.surface).toBe('ciclo');
    expect(footSpec(C.corridor)).toBeNull();
    expect(footSpec(C.residential)).toBeNull();
  });
});

describe('azar determinista', () => {
  it('hash01 da lo mismo para la misma entrada y cubre [0, 1)', () => {
    const values = Array.from({ length: 2000 }, (_, i) => hash01(i, 7));
    expect(hash01(5, 7)).toBe(values[5]);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
    expect(values.filter((v) => v < 0.5).length).toBeGreaterThan(900);
  });

  it('pickWeighted respeta los pesos acumulados', () => {
    const cumulative = [1, 1, 4];
    expect(pickWeighted(cumulative, 0.1)).toBe(0);
    expect(pickWeighted(cumulative, 0.5)).toBe(2);
    expect(pickWeighted(cumulative, 0.999)).toBe(2);
  });
});
