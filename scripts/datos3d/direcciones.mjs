// Qué placa oficial (Catastro, Placa Domiciliaria) toma cada edificio, por el código de lote: la
// del lote que cae dentro de la huella; si no, la más cercana del lote; si el lote no tiene, la más
// cercana de su manzana (los 9 primeros dígitos del código de lote). El número de casa, torre o
// interior de la placa solo va con el edificio al que identifica; si no, queda la dirección del
// conjunto (vía y número): huella con varias casas dentro, otro edificio del lote más cerca de la
// placa, placa a MAX_INTERIOR_M o más, o placa de otro lote de la manzana.
import { distanceToRings } from './inside.mjs';
import { SPEC } from './spec.mjs';

const K = SPEC.tipoDireccion;
/** A esta distancia o más (m), la casa o torre de la placa ya no identifica al edificio. */
export const MAX_INTERIOR_M = 5;
const manzana = (lote) => (lote ?? '').slice(0, 9);

/** placas: [{ codigo, p: [x, z], lote, pdoTipo, texto, base }] → índices por lote y por manzana. */
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

/** Empate a igual distancia: el PDOTIPO menor (supuesto: 1 es la principal) y luego el código. */
const before = (a, b) => a.pdoTipo < b.pdoTipo || (a.pdoTipo === b.pdoTipo && a.codigo < b.codigo);

/**
 * La placa más cercana (d = 0 si cae dentro) y cuántos interiores distintos caen dentro. Si se
 * pasa `closest`, anota para cada placa la menor distancia a un edificio de su lote.
 */
function nearest(rings, candidates, closest) {
  let best = null;
  const inside = new Set();
  for (const placa of candidates) {
    const d = distanceToRings(placa.p, rings);
    if (closest && !(closest.get(placa) <= d)) closest.set(placa, d);
    if (d === 0 && placa.texto !== placa.base) inside.add(placa.texto);
    if (!best || d < best.d || (d === best.d && before(placa, best.placa))) best = { d, placa };
  }
  return best && { ...best, interiores: inside.size };
}

/** buildings: [{ rings (metros), lote }] → [{ tipo: SPEC.tipoDireccion, texto }] en el mismo orden. */
export function assignPlacas(buildings, placas) {
  const { byLot, byBlock } = indexPlacas(placas);
  const closest = new Map();
  const own = buildings.map(({ rings, lote }) => (lote ? nearest(rings, byLot.get(lote) ?? [], closest) : null));
  return buildings.map(({ rings, lote }, i) => {
    const pick = own[i];
    if (pick?.d === 0) return { tipo: K.enHuella, texto: pick.interiores > 1 ? pick.placa.base : pick.placa.texto };
    if (pick) {
      const identifies = pick.d < MAX_INTERIOR_M && closest.get(pick.placa) >= pick.d;
      return { tipo: K.delLote, texto: identifies ? pick.placa.texto : pick.placa.base };
    }
    const block = lote ? nearest(rings, byBlock.get(manzana(lote)) ?? []) : null;
    return block ? { tipo: K.deManzana, texto: block.placa.base } : { tipo: K.ninguna, texto: '' };
  });
}
