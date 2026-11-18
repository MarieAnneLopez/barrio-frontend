import { describe, expect, it } from 'vitest';
import { introVariant } from '../intro/introVariant';
import { footerTones } from './footerTones';

// D100: la entrada y las dos tarjetas del pie reparten siempre crema, rosa claro y rosa entre las tres
// (ninguna repite), así el reparto de color de una página corta no depende de su ruta.
const ROUTES = ['/', '/mapa', '/historia', '/ranking', '/galeria', '/preguntas', '/creadora', '/ayuda', '/acceso',
  '/creditos-fotos', '/categorias/zonas-verdes', '/categorias/barberias', '/no-existe'];

describe('footerTones', () => {
  it.each(ROUTES)('en %s la entrada y las dos tarjetas usan los tres tonos sin repetir', (path) => {
    const { contact, creator } = footerTones(path);
    expect(new Set([introVariant(path).reveal, contact, creator])).toEqual(new Set(['crema', 'rosa-claro', 'rosa']));
  });
});
