// Archivos TNT3 descomprimidos → estructuras con arreglos tipados (Edificios, Vias, Suelo, Puntos).
import { sameLength, startsCover, withinTable } from './checks';
import { readContainer, type Sections } from './container';
import { decodeCoords, scaled } from './coords';
import { TNT3, type Edificios, type Puntos, type Suelo, type Vias } from './format';

const points = (s: Sections, xz: string, osm: string) => {
  const out = { xz: decodeCoords(s.i16(xz)), osm: s.f64(osm) };
  sameLength(xz, out.xz.length / 2, { osm: out.osm });
  return out;
};

export function decodeEdificios(buffer: ArrayBuffer): Edificios {
  const s = readContainer(buffer, TNT3.archivos.edificios);
  const anillos = s.u32('ANIL');
  const edificios = s.u32('EDIF');
  const e: Edificios = {
    count: edificios.length - 1, xz: decodeCoords(s.i16('XZ'), anillos), anillos, edificios,
    pisos: s.u8('PISO'), base: s.u8('BASE'), sotanos: s.u8('SOTA'), banderas: s.u8('BAND'),
    tipoDireccion: s.u8('DIRT'), direccion: s.u32('DIRE'), tipoNombre: s.u8('NOMT'), nombre: s.u32('NOMB'),
    lote: s.u32('LOTE'), sector: s.u32('SECT'), osm: s.f64('OSMI'),
    textos: {
      direcciones: s.text('TDIR'), nombres: s.text('TNOM'), origenNombres: s.text('TNRF'),
      lotes: s.text('TLOT'), sectores: s.text('TSEC'),
    },
  };
  startsCover('edificios', edificios, anillos.length - 1);
  const { pisos, base, sotanos, banderas, tipoDireccion, direccion, tipoNombre, nombre, lote, sector, osm } = e;
  sameLength('edificios', e.count, { pisos, base, sotanos, banderas, tipoDireccion, direccion, tipoNombre, nombre, lote, sector, osm });
  sameLength('edificios', e.textos.nombres.length, { origen: e.textos.origenNombres.map(() => 0) });
  withinTable('direcciones', direccion, e.textos.direcciones.length);
  withinTable('nombres', nombre, e.textos.nombres.length);
  withinTable('lotes', lote, e.textos.lotes.length);
  withinTable('sectores', sector, e.textos.sectores.length);
  return e;
}

export function decodeVias(buffer: ArrayBuffer): Vias {
  const s = readContainer(buffer, TNT3.archivos.vias);
  const tramos = s.u32('TRAM');
  const v: Vias = {
    count: tramos.length - 1, nodos: decodeCoords(s.i16('NODO')), tramos, indices: s.u32('INDI'),
    clase: s.u8('CLAS'), banderas: s.u8('BAND'), sentido: s.i8('SENT'), carriles: s.u8('CARR'),
    vmax: s.u8('VMAX'), nivel: s.i8('NIVE'), nombre: s.u32('NOMB'), osm: s.f64('OSMI'),
    cruces: {
      xz: decodeCoords(s.i16('CRXZ')), tipo: s.u8('CRTI'), angulo: scaled(s.u16('CRAN'), 10_000),
      largo: scaled(s.u16('CRLA'), TNT3.unidadesPorMetro), osm: s.f64('CROS'),
    },
    semaforos: points(s, 'SEXZ', 'SEOS'),
    textos: { nombres: s.text('TNOM') },
  };
  startsCover('vías', tramos, v.indices.length);
  const { clase, banderas, sentido, carriles, vmax, nivel, nombre, osm } = v;
  sameLength('vías', v.count, { clase, banderas, sentido, carriles, vmax, nivel, nombre, osm });
  const { tipo, angulo, largo } = v.cruces;
  sameLength('cruces', v.cruces.xz.length / 2, { tipo, angulo, largo, osm: v.cruces.osm });
  withinTable('nodos', v.indices, v.nodos.length / 2);
  withinTable('nombres de vías', nombre, v.textos.nombres.length);
  return v;
}

export function decodeSuelo(buffer: ArrayBuffer): Suelo {
  const s = readContainer(buffer, TNT3.archivos.suelo);
  const anillos = s.u32('ANIL');
  const areas = s.u32('AREA');
  const inicios = s.u32('LINE');
  const lineas = {
    count: inicios.length - 1, xz: decodeCoords(s.i16('LXZ'), inicios), inicios,
    clase: s.u8('LCLA'), nombre: s.u32('LNOM'), osm: s.f64('LOSM'),
  };
  const out: Suelo = {
    count: areas.length - 1, xz: decodeCoords(s.i16('XZ'), anillos), anillos, areas,
    clase: s.u8('CLAS'), nombre: s.u32('NOMB'), osm: s.f64('OSMI'), lineas, textos: { nombres: s.text('TNOM') },
  };
  startsCover('áreas', areas, anillos.length - 1);
  sameLength('áreas', out.count, { clase: out.clase, nombre: out.nombre, osm: out.osm });
  sameLength('líneas', lineas.count, { clase: lineas.clase, nombre: lineas.nombre, osm: lineas.osm });
  withinTable('nombres de áreas', out.nombre, out.textos.nombres.length);
  withinTable('nombres de líneas', lineas.nombre, out.textos.nombres.length);
  return out;
}

export function decodePuntos(buffer: ArrayBuffer): Puntos {
  const s = readContainer(buffer, TNT3.archivos.puntos);
  const inicios = s.u32('HILE');
  const hileras = { xz: decodeCoords(s.i16('HIXZ'), inicios), inicios, osm: s.f64('HIOS') };
  sameLength('hileras', inicios.length - 1, { osm: hileras.osm });
  return { arboles: points(s, 'ARXZ', 'AROS'), hileras, faroles: points(s, 'FAXZ', 'FAOS') };
}
