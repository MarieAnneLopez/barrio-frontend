// Capas de Catastro (UAECD) ya descargadas → construcciones del barrio, lotes, placas y sectores.
import { bounds } from './geo.mjs';
import { createGrid } from './grid.mjs';
import { pointInPolygon, pointOnSurface } from './inside.mjs';
import { geojsonPolygons } from './osm.mjs';
import { formatPlaca, placaBase } from './placas.mjs';
import { cleanPolygon } from './rings.mjs';
import { SPEC } from './spec.mjs';

const F = SPEC.banderasEdificio;

/** Atributos reales de la construcción; la altura no se publica, solo pisos (FORMATO.md). */
function attributes(p) {
  const known = Number.isInteger(p.CONNPISOS);
  const pisos = known ? p.CONNPISOS : 0;
  // CONALTURA («Altura», sin dominio publicado) se lee como el piso donde arranca: 1 = sobre el
  // primer piso. Es una interpretación deducida de los datos (README, paso 3).
  const start = Number.isFinite(p.CONALTURA) ? p.CONALTURA : 0;
  const banderas = (known ? F.pisosConocidos : 0) | (p.CONVOLADIZ === 1 ? F.voladizo : 0)
    | (p.CONMEJORA === 1 ? F.mejora : 0) | (p.CONTSEMIS === 1 ? F.semisotano : 0)
    | (known && pisos === 0 && start < 0 ? F.subterranea : 0);
  return { pisos, base: Math.max(0, Math.round(start)), sotanos: p.CONNSOTANO ?? 0, banderas, lote: p.LOTECODIGO ?? '' };
}

/** Construcciones cuyo punto interior cae en el barrio, con huella limpia y sus atributos. */
export function catastroBuildings(features, barrio, project) {
  const stats = { entidades: features.length, fuera: 0, degeneradas: 0 };
  const items = [];
  for (const feature of features) {
    for (const raw of geojsonPolygons(feature.geometry, project)) {
      const rings = cleanPolygon(raw);
      if (!rings) {
        stats.degeneradas += 1;
        continue;
      }
      const punto = pointOnSurface(rings);
      if (!barrio.inside(punto)) {
        stats.fuera += 1;
        continue;
      }
      items.push({ rings, punto, osm: 0, ...attributes(feature.properties ?? {}) });
    }
  }
  return { items, stats };
}

/** Lotes para ubicar por posición lo que no trae código (edificios de OSM). */
export function lotLocator(features, project) {
  const lots = [];
  const grid = createGrid(100);
  for (const feature of features) {
    for (const rings of geojsonPolygons(feature.geometry, project)) {
      grid.insert(lots.length, bounds(rings[0]));
      lots.push({ rings, codigo: feature.properties?.LOTCODIGO ?? '' });
    }
  }
  return (point) => grid.around(point, 0).map((i) => lots[i]).find((lot) => pointInPolygon(point, lot.rings))?.codigo ?? '';
}

export function catastroPlacas(features, project) {
  return features
    .filter((f) => f.geometry?.type === 'Point')
    .map((f) => ({
      codigo: f.properties.PDOCODIGO ?? '', p: project(f.geometry.coordinates), lote: f.properties.PDOCLOTE ?? '',
      pdoTipo: f.properties.PDOTIPO ?? 9, texto: formatPlaca(f.properties), base: placaBase(f.properties),
    }))
    .filter((placa) => placa.texto);
}

/** Código de sector catastral (6 dígitos, el comienzo del código de lote) → nombre. */
export function sectorNames(features) {
  return new Map(features.map((f) => [f.properties?.SCACODIGO ?? '', (f.properties?.SCANOMBRE ?? '').trim()]));
}

export const sectorOf = (names, lote) => names.get((lote ?? '').slice(0, 6)) ?? '';
