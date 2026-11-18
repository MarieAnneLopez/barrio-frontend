// Rejilla uniforme de celdas con las cajas que tocan cada una, en listas compactas de arreglos
// tipados (sin un objeto por caja ni por consulta): la base de PolygonGrid.

export interface Cells {
  /** Esquina, tamaño de celda y número de celdas en x y en z. */
  x0: number; z0: number; size: number; nx: number; nz: number;
  /** Cajas de la celda c (cx · nz + cz): items[first[c] .. first[c + 1]). */
  first: Uint32Array;
  items: Uint32Array;
}

/** Columna (o fila) de la coordenada v en celdas de `size` desde `origin`, recortada a [0, n − 1]. */
export const cellOf = (v: number, origin: number, size: number, n: number): number =>
  Math.max(0, Math.min(n - 1, Math.floor((v - origin) / size)));

/** Celdas de `size` m para las cajas [x0, z0, x1, z1] de `box` (una caja con NaN no entra). */
export function boxCells(box: Float32Array, size: number): Cells {
  const count = box.length / 4;
  let [gx0, gz0, gx1, gz1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let p = 0; p < count; p++) {
    if (Number.isNaN(box[4 * p])) continue;
    gx0 = Math.min(gx0, box[4 * p] ?? 0); gz0 = Math.min(gz0, box[4 * p + 1] ?? 0);
    gx1 = Math.max(gx1, box[4 * p + 2] ?? 0); gz1 = Math.max(gz1, box[4 * p + 3] ?? 0);
  }
  const empty = !(gx1 >= gx0);
  const [x0, z0] = empty ? [0, 0] : [gx0, gz0];
  const [nx, nz] = empty ? [0, 0] : [Math.floor((gx1 - gx0) / size) + 1, Math.floor((gz1 - gz0) / size) + 1];
  const cells = nx * nz;
  const first = new Uint32Array(cells + 1);
  let items = new Uint32Array(0);
  // Dos pasadas por las celdas de cada caja: contar y luego llenar.
  for (let pass = 0; pass < 2; pass++) {
    for (let p = 0; p < count; p++) {
      if (Number.isNaN(box[4 * p])) continue;
      const cz0 = cellOf(box[4 * p + 1] ?? 0, z0, size, nz), cz1 = cellOf(box[4 * p + 3] ?? 0, z0, size, nz);
      for (let cx = cellOf(box[4 * p] ?? 0, x0, size, nx), cx1 = cellOf(box[4 * p + 2] ?? 0, x0, size, nx); cx <= cx1; cx++) {
        for (let cell = cx * nz + cz0, end = cx * nz + cz1; cell <= end; cell++) {
          if (pass === 0) first[cell + 1] = (first[cell + 1] ?? 0) + 1;
          else items[(first[cell] = (first[cell] ?? 0) + 1) - 1] = p;
        }
      }
    }
    if (pass === 1) break;
    for (let cell = 0; cell < cells; cell++) first[cell + 1] = (first[cell + 1] ?? 0) + (first[cell] ?? 0);
    items = new Uint32Array(first[cells] ?? 0);
  }
  // El llenado corrió cada inicio al final de su celda, que es el inicio de la siguiente.
  first.copyWithin(1, 0, cells)[0] = 0;
  return { x0, z0, size, nx, nz, first, items };
}
