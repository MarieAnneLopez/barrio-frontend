import type { Historia } from '../lib/apiTypes';
import { page } from './moduleFixtures';

const OFICIAL = 'https://bogota.gov.co/mi-ciudad/localidades/kennedy/historia-del-poblamiento-de-kennedy';
const PRENSA = 'https://www.portafolio.co/economia/infraestructura/el-dorado-60-anos';
const WIKI = 'https://es.wikipedia.org/w/index.php?title=Kennedy_(Bogot%C3%A1)&oldid=176260200';

const hito = (id: number, anio: number, titulo: string, verified: boolean, ref: string) => ({
  id, anio, orden: id, titulo, descripcion: `Descripción de ${anio}.`, source_ref: ref, verified,
});

export const HISTORIA: Historia = {
  consultado: '2026-11-14',
  hitos: [
    hito(2, 1959, 'Cierra el aeropuerto de Techo', false, PRENSA),
    hito(4, 1963, 'De Techo a Ciudad Kennedy', true, OFICIAL),
    hito(5, 1967, 'El Concejo ratifica el nombre', true, OFICIAL),
    hito(9, 2006, 'La biblioteca lleva el nombre de Manuel Zapata Olivella', false, WIKI),
  ],
  fuentes: [
    { url: OFICIAL, titulo: 'Historia del poblamiento de Kennedy', entidad: 'Portal Bogotá', tipo: 'oficial', nota: null },
    { url: PRENSA, titulo: 'El Dorado cumplió 60 años', entidad: 'Portafolio', tipo: 'prensa', nota: null },
    { url: WIKI, titulo: 'Kennedy (Bogotá)', entidad: 'Wikipedia', tipo: 'enciclopedia', nota: 'No se usan sus fechas.' },
  ],
};

const square = (x: number, y: number, d: number) => ({
  type: 'MultiPolygon' as const,
  coordinates: [[[[x, y], [x + d, y], [x + d, y + d], [x, y + d], [x, y]]]],
});

export const KENNEDY = {
  id: 1, source_type: 'datos_abiertos' as const, verified: true,
  source_ref: `https://www.openstreetmap.org/relation/4740229 | ${OFICIAL}`,
  geometry: square(-74.2, 4.6, 0.1), nombre_localidad: 'Kennedy', poblacion: 1104934, superficie_km2: 38.21,
};

/** Rutas de la API que usa la página de Historia. */
export function historyRoutes(historia: Historia = HISTORIA) {
  return {
    '/historia': { body: historia },
    '/localidad': page([KENNEDY]),
    '/barrio/poligono': { body: { type: 'Feature', bbox: [-74.19, 4.62, -74.15, 4.66], geometry: square(-74.19, 4.62, 0.04),
      properties: { nombre: 'El Tintal', source_ref: [], license: 'ODbL' } } },
    '/datos-catastrales': { body: { items: [], total: 3706, page: 1, size: 1, pages: 3706 } },
    '/zonas-verdes': { body: { items: [], total: 57, page: 1, size: 1, pages: 57 } },
  };
}
