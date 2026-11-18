// Direcciones oficiales (Catastro, Placa Domiciliaria). Texto: nomenclatura de la placa con «#» y
// guion, p. ej. «KR 88D # 6D-27 TO 6»: vía (PDONVIAL), número (PDOTEXTO si es numérico; si es un
// interior como «TO 6», el número del conjunto en PDOCINTERI) e interior. Elección: la placa de su
// lote dentro de la huella; si no, la más cercana del lote; si el lote no tiene, la más cercana de
// su manzana (los 9 primeros dígitos del código de lote).
import { SPEC } from './spec.mjs';
import { distanceToRings } from './inside.mjs';

const clean = (text) => (text ?? '').replace(/\s+/g, ' ').trim();
const CROSS_DISTANCE = /^\d+[A-Z]*(?: ?BIS)? \d+/; // «6D 27», «34A 17 S»; no «8» ni «MJ 34»

/** «6D 27» → «6D-27»; «34 17 S» → «34-17 S». */
function number(text) {
  const [cross, distance, ...rest] = clean(text).split(' ');
  if (!distance) return cross ?? '';
  return [`${cross}-${distance}`, ...rest].join(' ');
}

/** PDOCINTERI solo sirve de número del conjunto si tiene la forma «cruce distancia». */
const conjunto = (text) => (CROSS_DISTANCE.test(clean(text)) ? number(text) : '');

export function formatPlaca({ PDONVIAL, PDOTEXTO, PDOCINTERI }) {
  const via = clean(PDONVIAL);
  const text = clean(PDOTEXTO);
  const isInterior = /^[A-ZÑ]+( |$)/.test(text); // «TO 6», «CA 12», «IN 3», «MJ»
  const main = isInterior ? conjunto(PDOCINTERI) : number(text) || conjunto(PDOCINTERI);
  const address = via && main ? `${via} # ${main}` : via || main;
  return address ? clean(`${address} ${isInterior ? text : ''}`) : ''; // un interior solo no es dirección
}

const manzana = (lote) => (lote ?? '').slice(0, 9);

/** placas: [{ codigo, p: [x, z], lote, pdoTipo, texto }] → índices por lote y por manzana. */
export function indexPlacas(placas) {
  const byLot = new Map();
  const byBlock = new Map();
  const push = (map, key, placa) => (map.get(key) ?? map.set(key, []).get(key)).push(placa);
  for (const placa of placas) {
    push(byLot, placa.lote, placa);
    push(byBlock, manzana(placa.lote), placa);
  }
  return { byLot, byBlock };
}

function nearest(rings, candidates) {
  let best = null;
  for (const placa of candidates) {
    const d = distanceToRings(placa.p, rings);
    const better = !best || d < best.d || (d === best.d && (placa.pdoTipo < best.placa.pdoTipo
      || (placa.pdoTipo === best.placa.pdoTipo && placa.codigo < best.placa.codigo)));
    if (better) best = { d, placa };
  }
  return best;
}

/** → { tipo: SPEC.tipoDireccion, texto } para un edificio (anillos en metros) de un lote. */
export function choosePlaca(rings, lote, { byLot, byBlock }) {
  const kinds = SPEC.tipoDireccion;
  if (!lote) return { tipo: kinds.ninguna, texto: '' };
  const own = nearest(rings, byLot.get(lote) ?? []);
  if (own) return { tipo: own.d === 0 ? kinds.enHuella : kinds.delLote, texto: own.placa.texto };
  const block = nearest(rings, byBlock.get(manzana(lote)) ?? []);
  if (block) return { tipo: kinds.deManzana, texto: block.placa.texto };
  return { tipo: kinds.ninguna, texto: '' };
}
