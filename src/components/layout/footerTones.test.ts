import { describe, expect, it } from 'vitest';
import { introVariant } from '../intro/introVariant';
import { footerTones } from './footerTones';
import { PALETTE_PLANS } from './palettePlan';

// D100: sin plan medido, la entrada y las dos tarjetas del pie reparten crema, rosa claro y rosa sin
// repetir, así el reparto de una página corta no depende de su ruta; con plan, manda la medición.
const ROUTES = ['/', '/mapa', '/historia', '/ranking', '/galeria', '/preguntas', '/creadora', '/ayuda', '/acceso',
  '/creditos-fotos', '/categorias/zonas-verdes', '/categorias/barberias', '/no-existe'];

describe('footerTones', () => {
  it.each(ROUTES.filter((path) => !PALETTE_PLANS[path]))('en %s (regla general) los tres tonos no se repiten', (path) => {
    const { contact, creator } = footerTones(path);
    for (const w of [0, 1] as const) {
      expect(new Set([introVariant(path).reveal, contact[w], creator[w]])).toEqual(new Set(['crema', 'rosa-claro', 'rosa']));
    }
  });

  it.each(Object.entries(PALETTE_PLANS))('en %s usa su plan medido, también con barra final', (path, plan) => {
    expect(footerTones(path)).toEqual({ contact: plan.contact, creator: plan.creator });
    expect(footerTones(`${path}/`)).toEqual({ contact: plan.contact, creator: plan.creator });
    expect(introVariant(path).reveal).toBe(plan.reveal);
  });
});
