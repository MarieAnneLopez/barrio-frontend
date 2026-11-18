// Conteos para el manifiesto y el informe: cuánto es dato real de cada fuente.
import { SPEC } from './spec.mjs';

const pct = (part, total) => (total ? Math.round((1000 * part) / total) / 10 : 0);
const has = (flags, bit) => (flags & bit) !== 0;
const nameOf = (table, code) => Object.keys(table).find((k) => table[k] === code) ?? String(code);

function tally(items, read, table) {
  const out = {};
  for (const item of items) {
    const key = nameOf(table, read(item));
    out[key] = (out[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1]));
}

export function buildingCounts(items) {
  const F = SPEC.banderasEdificio;
  const D = SPEC.tipoDireccion;
  const n = items.length;
  const catastro = items.filter((b) => !has(b.banderas, F.osm)).length;
  const pisosCatastro = items.filter((b) => !has(b.banderas, F.osm) && has(b.banderas, F.pisosConocidos)).length;
  const oficial = items.filter((b) => b.tipoDireccion === D.enHuella || b.tipoDireccion === D.delLote).length;
  const kind = (k) => items.filter((b) => b.tipoDireccion === k).length;
  const conNombre = items.filter((b) => b.tipoNombre > 0).length;
  return {
    total: n, catastro, osm: n - catastro, pisosCatastro, pisosCatastroPct: pct(pisosCatastro, n),
    placaOficial: oficial, placaOficialPct: pct(oficial, n), placaEnHuella: kind(D.enHuella), placaDelLote: kind(D.delLote),
    placaDeManzana: kind(D.deManzana), sinPlaca: kind(D.ninguna), conNombre, conNombrePct: pct(conNombre, n),
    nombreDeEdificio: items.filter((b) => b.tipoNombre === SPEC.tipoNombre.edificio).length,
    voladizos: items.filter((b) => has(b.banderas, F.voladizo)).length,
    subterraneas: items.filter((b) => has(b.banderas, F.subterranea)).length,
  };
}

export function roadCounts({ nodes, ways, cruces, semaforos }) {
  const X = SPEC.cruces;
  const marks = { 0: 'desconocidas', [X.cebra]: 'cebra', [X.marcado]: 'marcado', [X.sinMarcas]: 'sinMarcas' };
  const crossings = {};
  for (const c of cruces) crossings[marks[c.tipo & 3]] = (crossings[marks[c.tipo & 3]] ?? 0) + 1;
  return {
    tramos: ways.length, nodos: nodes.length, porClase: tally(ways, (w) => w.clase, SPEC.clasesVia),
    sentidoUnico: ways.filter((w) => w.sentido !== 0).length, conCarriles: ways.filter((w) => w.carriles > 0).length,
    recortados: ways.filter((w) => has(w.banderas, SPEC.banderasVia.recortada)).length,
    cruces: cruces.length, crucesPorMarca: crossings, crucesConSemaforo: cruces.filter((c) => has(c.tipo, X.semaforo)).length,
    crucesDeCiclorruta: cruces.filter((c) => has(c.tipo, X.ciclorruta)).length, semaforos: semaforos.length,
  };
}

export function groundCounts({ areas, lineas }, puntos) {
  return {
    areas: areas.length, areasPorClase: tally(areas, (a) => a.clase, SPEC.clasesSuelo),
    lineasDeAgua: lineas.length, arboles: puntos.arboles.length, hilerasDeArboles: puntos.hileras.length,
    faroles: puntos.faroles.length,
  };
}
