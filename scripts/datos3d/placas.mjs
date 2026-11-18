// Texto de las placas oficiales (Catastro, Placa Domiciliaria): nomenclatura con «#» y guion, p. ej.
// «KR 88D # 6D-27 TO 6»: vía (PDONVIAL), número (PDOTEXTO si es numérico; si es un interior como
// «TO 6», el número del conjunto en PDOCINTERI) e interior. Qué placa toma cada edificio:
// direcciones.mjs.
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

/** { address: vía # número, interior: «TO 6», «CA 12», «IN 3», «MJ» o "" }. */
function parts({ PDONVIAL, PDOTEXTO, PDOCINTERI }) {
  const via = clean(PDONVIAL);
  const text = clean(PDOTEXTO);
  const isInterior = /^[A-ZÑ]+( |$)/.test(text);
  const main = isInterior ? conjunto(PDOCINTERI) : number(text) || conjunto(PDOCINTERI);
  return { address: via && main ? `${via} # ${main}` : via || main, interior: isInterior ? text : '' };
}

export function formatPlaca(props) {
  const { address, interior } = parts(props);
  return address ? clean(`${address} ${interior}`) : ''; // un interior solo no es dirección
}

/** La dirección del conjunto: la placa sin su casa, torre o interior. */
export const placaBase = (props) => parts(props).address;
