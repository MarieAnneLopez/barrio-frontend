// Capas armadas → secciones de cada archivo TNT3 (orden y significado en FORMATO.md).
import { column, createPairTable, starts } from './columns.mjs';
import { createTable, deltaEncode, writeContainer } from './encode.mjs';
import { SPEC } from './spec.mjs';

const indexed = (items, read, table) => Uint32Array.from(items, (item) => table.add(read(item)));
const ids = (items) => column(items, (item) => item.osm, 'f64');

export function edificiosFile(items) {
  const rings = items.flatMap((b) => b.rings);
  const [dir, lot, sec, nom] = [createTable(), createTable(), createTable(), createPairTable()];
  const nombres = Uint32Array.from(items, (b) => nom.add(b.nombre, b.nombreRef));
  return writeContainer(SPEC.archivos.edificios, [
    { id: 'XZ', type: 'i16', data: deltaEncode(rings) },
    { id: 'ANIL', type: 'u32', data: starts(rings.map((r) => r.length)) },
    { id: 'EDIF', type: 'u32', data: starts(items.map((b) => b.rings.length)) },
    { id: 'PISO', type: 'u8', data: column(items, (b) => b.pisos, 'u8') },
    { id: 'BASE', type: 'u8', data: column(items, (b) => b.base, 'u8') },
    { id: 'SOTA', type: 'u8', data: column(items, (b) => b.sotanos, 'u8') },
    { id: 'BAND', type: 'u8', data: column(items, (b) => b.banderas, 'u8') },
    { id: 'DIRT', type: 'u8', data: column(items, (b) => b.tipoDireccion, 'u8') },
    { id: 'DIRE', type: 'u32', data: indexed(items, (b) => b.direccion, dir) },
    { id: 'NOMT', type: 'u8', data: column(items, (b) => b.tipoNombre, 'u8') },
    { id: 'NOMB', type: 'u32', data: nombres },
    { id: 'LOTE', type: 'u32', data: indexed(items, (b) => b.lote, lot) },
    { id: 'SECT', type: 'u32', data: indexed(items, (b) => b.sector, sec) },
    { id: 'OSMI', type: 'f64', data: ids(items) },
    { id: 'TDIR', type: 'utf8', data: dir.list },
    { id: 'TNOM', type: 'utf8', data: nom.names },
    { id: 'TNRF', type: 'utf8', data: nom.refs },
    { id: 'TLOT', type: 'utf8', data: lot.list },
    { id: 'TSEC', type: 'utf8', data: sec.list },
  ]);
}

export function viasFile({ nodes, ways, cruces, semaforos }) {
  const nom = createTable();
  return writeContainer(SPEC.archivos.vias, [
    { id: 'NODO', type: 'i16', data: deltaEncode([nodes]) },
    { id: 'TRAM', type: 'u32', data: starts(ways.map((w) => w.nodes.length)) },
    { id: 'INDI', type: 'u32', data: Uint32Array.from(ways.flatMap((w) => w.nodes)) },
    { id: 'CLAS', type: 'u8', data: column(ways, (w) => w.clase, 'u8') },
    { id: 'SENT', type: 'i8', data: column(ways, (w) => w.sentido, 'i8') },
    { id: 'CARR', type: 'u8', data: column(ways, (w) => w.carriles, 'u8') },
    { id: 'VMAX', type: 'u8', data: column(ways, (w) => w.vmax, 'u8') },
    { id: 'NIVE', type: 'i8', data: column(ways, (w) => w.nivel, 'i8') },
    { id: 'BAND', type: 'u8', data: column(ways, (w) => w.banderas, 'u8') },
    { id: 'NOMB', type: 'u32', data: indexed(ways, (w) => w.nombre, nom) },
    { id: 'OSMI', type: 'f64', data: ids(ways) },
    { id: 'TNOM', type: 'utf8', data: nom.list },
    { id: 'CRXZ', type: 'i16', data: deltaEncode([cruces.map((c) => c.p)]) },
    { id: 'CRTI', type: 'u8', data: column(cruces, (c) => c.tipo, 'u8') },
    { id: 'CRAN', type: 'u16', data: column(cruces, (c) => Math.round(c.angulo * 10_000), 'u16') },
    { id: 'CRLA', type: 'u16', data: column(cruces, (c) => Math.round(c.largo * 10), 'u16') },
    { id: 'CROS', type: 'f64', data: ids(cruces) },
    { id: 'SEXZ', type: 'i16', data: deltaEncode([semaforos.map((s) => s.p)]) },
    { id: 'SEOS', type: 'f64', data: ids(semaforos) },
  ]);
}

export function sueloFile({ areas, lineas }) {
  const rings = areas.flatMap((a) => a.rings);
  const nom = createTable();
  return writeContainer(SPEC.archivos.suelo, [
    { id: 'XZ', type: 'i16', data: deltaEncode(rings) },
    { id: 'ANIL', type: 'u32', data: starts(rings.map((r) => r.length)) },
    { id: 'AREA', type: 'u32', data: starts(areas.map((a) => a.rings.length)) },
    { id: 'CLAS', type: 'u8', data: column(areas, (a) => a.clase, 'u8') },
    { id: 'NOMB', type: 'u32', data: indexed(areas, (a) => a.nombre, nom) },
    { id: 'OSMI', type: 'f64', data: ids(areas) },
    { id: 'LXZ', type: 'i16', data: deltaEncode(lineas.map((l) => l.points)) },
    { id: 'LINE', type: 'u32', data: starts(lineas.map((l) => l.points.length)) },
    { id: 'LCLA', type: 'u8', data: column(lineas, (l) => l.clase, 'u8') },
    { id: 'LNOM', type: 'u32', data: indexed(lineas, (l) => l.nombre, nom) },
    { id: 'LOSM', type: 'f64', data: ids(lineas) },
    { id: 'TNOM', type: 'utf8', data: nom.list },
  ]);
}

export function puntosFile({ arboles, hileras, faroles }) {
  return writeContainer(SPEC.archivos.puntos, [
    { id: 'ARXZ', type: 'i16', data: deltaEncode([arboles.map((a) => a.p)]) },
    { id: 'AROS', type: 'f64', data: ids(arboles) },
    { id: 'HIXZ', type: 'i16', data: deltaEncode(hileras.map((h) => h.points)) },
    { id: 'HILE', type: 'u32', data: starts(hileras.map((h) => h.points.length)) },
    { id: 'HIOS', type: 'f64', data: ids(hileras) },
    { id: 'FAXZ', type: 'i16', data: deltaEncode([faroles.map((f) => f.p)]) },
    { id: 'FAOS', type: 'f64', data: ids(faroles) },
  ]);
}
