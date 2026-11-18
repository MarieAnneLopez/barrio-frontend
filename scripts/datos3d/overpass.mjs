// OpenStreetMap por Overpass: una sola consulta con la caja del barrio (el recorte fino al
// polígono se hace aquí). Si el servidor principal no responde se prueban los espejos.
import { OVERPASS } from './config.mjs';

// Nombres de conjunto o lugar (nombres.mjs) con claves que no salen en las otras sentencias. Sin
// `name` a secas: traía límites (Cundinamarca, Bogotá, UPZ) y rutas de bus que no se usan.
const NAMED = ['relation["shop"]', ...['office', 'tourism', 'healthcare', 'club'].flatMap((k) => [`way["${k}"]`, `relation["${k}"]`])];

const SELECTORS = [
  'way["highway"]', 'node["highway"~"^(crossing|street_lamp|traffic_signals)$"]',
  'node["natural"="tree"]', 'way["natural"]', 'relation["natural"]', 'way["waterway"]',
  'way["building"]', 'relation["building"]', 'way["leisure"]', 'relation["leisure"]',
  'way["landuse"]', 'relation["landuse"]', 'way["amenity"]', 'relation["amenity"]',
  'way["shop"]', ...NAMED.map((s) => `${s}["name"]`),
];

/** La caja va en cada sentencia (no global) para que `out geom` traiga las geometrías completas. */
export function overpassQuery([west, south, east, north]) {
  const body = SELECTORS.map((s) => `${s}(${south},${west},${north},${east});`).join('');
  return `[out:json][timeout:300];(${body});out geom;`;
}

function validate(text) {
  const json = JSON.parse(text);
  if (!Array.isArray(json.elements)) throw new Error('Overpass sin lista elements');
  if (json.remark && /error|timed out|out of memory/i.test(json.remark)) throw new Error(`Overpass: ${json.remark}`);
}

/** → { elements, osm3s, url, fecha }; `bbox` en grados [oeste, sur, este, norte]. */
export async function downloadOsm(request, bbox, log = console.log) {
  const form = { data: overpassQuery(bbox) };
  const result = (url, { text, fecha }) => {
    const json = JSON.parse(text);
    return { elements: json.elements, osm3s: json.osm3s ?? {}, url, fecha };
  };
  for (const url of OVERPASS) {
    const cached = await request(url, { form, cacheOnly: true });
    if (cached) return result(url, cached); // la copia guardada manda, sea del servidor que sea
  }
  let lastError = null;
  for (const url of OVERPASS) {
    try {
      return result(url, await request(url, { form, validate, label: `Overpass ${new URL(url).host}` }));
    } catch (error) {
      lastError = error;
      log(`  ${url} no respondió: ${error instanceof Error ? error.message : error}`);
    }
  }
  throw lastError ?? new Error('Sin servidores Overpass');
}
