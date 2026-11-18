// Etiquetas OSM de vías y cruces → códigos TNT3 (src/three/data/tnt3.json). Solo se traduce lo
// que trae OSM; lo que no trae queda en 0 («sin dato»), nunca se rellena.
import { SPEC } from './spec.mjs';

const C = SPEC.clasesVia;
const B = SPEC.banderasVia;
const X = SPEC.cruces;
const NOT_THERE = new Set(['proposed', 'abandoned', 'razed', 'disused', 'platform', 'bus_stop', 'elevator', 'emergency_bay', 'rest_area', 'services']);
const RESTRICTED = new Set(['no', 'private']);
const BUS = new Set(['yes', 'designated']);
const yes = (value) => value !== undefined && value !== 'no';

function classOf(tags) {
  const highway = tags.highway ?? '';
  if (NOT_THERE.has(highway)) return null;
  const base = highway.replace(/_link$/, '');
  if (base === 'footway' && (tags.footway === 'sidewalk' || tags.footway === 'crossing')) return C[tags.footway];
  return C[base] ?? null;
}

function onewayOf(tags) {
  const oneway = tags.oneway;
  if (oneway === '-1' || oneway === 'reverse') return -1;
  if (oneway === 'yes' || oneway === 'true' || oneway === '1') return 1;
  if (oneway === 'no' || oneway === 'false' || oneway === '0') return 0;
  const circular = tags.junction === 'roundabout' || tags.junction === 'circular';
  return circular || tags.highway === 'motorway' ? 1 : 0;
}

const int = (value, min, max) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : 0;
};

function flagsOf(tags) {
  const restricted = RESTRICTED.has(tags.access) || RESTRICTED.has(tags.motor_vehicle) || RESTRICTED.has(tags.vehicle);
  const busOnly = tags.highway === 'busway' || (restricted && (BUS.has(tags.bus) || BUS.has(tags.psv)));
  return (tags.highway?.endsWith('_link') ? B.enlace : 0)
    | (yes(tags.bridge) ? B.puente : 0)
    | (yes(tags.tunnel) ? B.tunel : 0)
    | (restricted ? B.accesoRestringido : 0)
    | (tags.junction === 'roundabout' || tags.junction === 'circular' ? B.glorieta : 0)
    | (tags.area === 'yes' ? B.area : 0)
    | (busOnly ? B.soloBus : 0);
}

/** → { clase, sentido, carriles, vmax, nivel, banderas } o null si la vía no existe en el terreno. */
export function roadAttributes(tags) {
  const clase = classOf(tags);
  if (!clase) return null;
  return {
    clase, sentido: onewayOf(tags), carriles: int(tags.lanes, 1, 20), vmax: int(tags.maxspeed, 1, 200),
    nivel: int(tags.layer, -5, 5), banderas: flagsOf(tags),
  };
}

function markingsOf(tags) {
  const markings = tags['crossing:markings'];
  if (markings === 'no') return X.sinMarcas;
  if (markings?.startsWith('zebra') || tags.crossing === 'zebra' || tags.crossing_ref === 'zebra') return X.cebra;
  if (markings || tags.crossing === 'marked' || tags.crossing === 'uncontrolled') return X.marcado;
  if (tags.crossing === 'unmarked') return X.sinMarcas;
  return 0;
}

/** Marcas (2 bits) + semáforo + si el cruce viene de una vía footway=crossing (FORMATO.md). */
export function crossingType(tags, fromWay = false) {
  const signals = tags.crossing === 'traffic_signals' || tags['crossing:signals'] === 'yes';
  return markingsOf(tags) | (signals ? X.semaforo : 0) | (fromWay ? X.deVia : 0);
}
