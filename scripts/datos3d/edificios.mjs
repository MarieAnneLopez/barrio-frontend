// Edificios de la maqueta: todas las construcciones de Catastro del barrio, más los edificios de
// OSM que faltan en Catastro; cada uno con su placa oficial, su sector catastral y, si existe, el
// nombre del conjunto o lugar (OSM).
import { catastroBuildings, catastroPlacas, lotLocator, sectorNames, sectorOf } from './catastro.mjs';
import { osmComplement } from './complemento.mjs';
import { assignPlacas } from './direcciones.mjs';
import { assignNames } from './nombres.mjs';

const byLotThenPlace = (a, b) => a.lote.localeCompare(b.lote) || a.punto[0] - b.punto[0] || a.punto[1] - b.punto[1];

export function buildEdificios({ construcciones, lotes, placas, sectores }, osm, barrio, project) {
  const catastro = catastroBuildings(construcciones, barrio, project);
  const complement = osmComplement(osm, catastro.items, barrio, project);
  const locate = lotLocator(lotes, project);
  for (const item of complement.items) item.lote = locate(item.punto);
  // Orden estable y por lote: las columnas repetidas comprimen mejor.
  const items = [...catastro.items.sort(byLotThenPlace), ...complement.items.sort((a, b) => a.osm - b.osm)];
  const names = sectorNames(sectores);
  const allPlacas = catastroPlacas(placas, project);
  assignPlacas(items, allPlacas).forEach(({ tipo, texto }, i) => {
    Object.assign(items[i], { sector: sectorOf(names, items[i].lote), tipoDireccion: tipo, direccion: texto });
  });
  const { lugares } = assignNames(items, osm, project);
  return { items, stats: { catastro: catastro.stats, osm: complement.stats, placas: allPlacas.length, lugaresConNombre: lugares } };
}
