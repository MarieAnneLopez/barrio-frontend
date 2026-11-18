// Columnas para el contenedor TNT3: arreglos tipados comprobados (un valor que no cabe en su tipo
// es un error, no un dato truncado), desplazamientos de inicio y tablas de nombres con su origen.
const ARRAYS = { u8: Uint8Array, i8: Int8Array, u16: Uint16Array, u32: Uint32Array, f64: Float64Array };

export function column(items, read, type) {
  const values = items.map(read);
  const typed = ARRAYS[type].from(values, (v) => v ?? 0);
  typed.forEach((v, i) => {
    if (v !== (values[i] ?? 0)) throw new Error(`Valor ${values[i]} no cabe en ${type} (fila ${i})`);
  });
  return typed;
}

/** Longitudes → inicios acumulados (n + 1 valores; el último es el total). */
export function starts(lengths) {
  const out = new Uint32Array(lengths.length + 1);
  lengths.forEach((n, i) => {
    out[i + 1] = out[i] + n;
  });
  return out;
}

/** Tabla de pares nombre/origen sin repetidos; el índice 0 es el par vacío (sin nombre). */
export function createPairTable() {
  const index = new Map([['\0', 0]]);
  const names = [''];
  const refs = [''];
  return {
    names,
    refs,
    add(name, ref) {
      if (!name) return 0;
      const key = `${name}\0${ref ?? ''}`;
      if (!index.has(key)) {
        index.set(key, names.length);
        names.push(name);
        refs.push(ref ?? '');
      }
      return index.get(key);
    },
  };
}
