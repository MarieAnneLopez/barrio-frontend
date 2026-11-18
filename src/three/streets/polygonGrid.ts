// Rejilla de polígonos con huecos: «¿en qué polígono cae este punto?». Los edificios y las áreas de
// suelo de TNT3 tienen la misma forma (vértices, inicio de cada anillo, inicio de cada polígono en
// anillos), así que sirve para las huellas de los edificios y para las canchas, el agua, etc. Celdas
// en arreglos tipados (sin objetos por polígono): 20 000 huellas se indexan en pocos milisegundos.

const CELL = 32;

export class PolygonGrid {
  private readonly box: Float32Array;
  private readonly x0: number;
  private readonly z0: number;
  private readonly nx: number;
  private readonly nz: number;
  private readonly first: Uint32Array;
  private readonly items: Uint32Array;

  constructor(
    private readonly xz: ArrayLike<number>,
    private readonly rings: ArrayLike<number>,
    private readonly polys: ArrayLike<number>,
    count: number,
    keep: (p: number) => boolean = () => true,
  ) {
    const box = (this.box = new Float32Array(4 * count).fill(NaN));
    let [gx0, gz0, gx1, gz1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (let p = 0; p < count; p++) {
      if (!keep(p)) continue;
      const outer = polys[p] ?? 0;
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
      for (let i = rings[outer] ?? 0, end = rings[outer + 1] ?? 0; i < end; i++) {
        const x = xz[2 * i] ?? 0, z = xz[2 * i + 1] ?? 0;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (z < z0) z0 = z;
        if (z > z1) z1 = z;
      }
      if (!(x1 >= x0)) continue;
      box[4 * p] = x0; box[4 * p + 1] = z0; box[4 * p + 2] = x1; box[4 * p + 3] = z1;
      gx0 = Math.min(gx0, x0); gz0 = Math.min(gz0, z0); gx1 = Math.max(gx1, x1); gz1 = Math.max(gz1, z1);
    }
    const empty = !(gx1 >= gx0);
    [this.x0, this.z0] = empty ? [0, 0] : [gx0, gz0];
    [this.nx, this.nz] = empty ? [0, 0] : [Math.floor((gx1 - gx0) / CELL) + 1, Math.floor((gz1 - gz0) / CELL) + 1];
    const first = (this.first = new Uint32Array(this.nx * this.nz + 1));
    // Dos pasadas por las celdas de cada caja: contar y luego llenar (listas compactas por celda).
    let items = new Uint32Array(0);
    for (let pass = 0; pass < 2; pass++) {
      for (let p = 0; p < count; p++) {
        if (Number.isNaN(box[4 * p])) continue;
        const cx0 = Math.floor(((box[4 * p] ?? 0) - this.x0) / CELL), cz0 = Math.floor(((box[4 * p + 1] ?? 0) - this.z0) / CELL);
        const cx1 = Math.floor(((box[4 * p + 2] ?? 0) - this.x0) / CELL), cz1 = Math.floor(((box[4 * p + 3] ?? 0) - this.z0) / CELL);
        for (let cx = cx0; cx <= cx1; cx++) {
          for (let cz = cz0, c = cx * this.nz + cz0; cz <= cz1; cz++, c++) {
            if (pass === 0) first[c + 1] = (first[c + 1] ?? 0) + 1;
            else items[(first[c] = (first[c] ?? 0) + 1) - 1] = p;
          }
        }
      }
      if (pass === 0) {
        for (let c = 0; c < this.nx * this.nz; c++) first[c + 1] = (first[c + 1] ?? 0) + (first[c] ?? 0);
        items = new Uint32Array(first[this.nx * this.nz] ?? 0);
      }
    }
    // El llenado corrió cada inicio al final de su celda, que es el inicio de la siguiente.
    first.copyWithin(1, 0, this.nx * this.nz)[0] = 0;
    this.items = items;
  }

  /** Regla par-impar sobre todos los anillos del polígono p. */
  private inside(p: number, x: number, z: number): boolean {
    let inside = false;
    for (let r = this.polys[p] ?? 0; r < (this.polys[p + 1] ?? 0); r++) {
      const [first, end] = [this.rings[r] ?? 0, this.rings[r + 1] ?? 0];
      for (let i = first, j = end - 1; i < end; j = i++) {
        const xi = this.xz[2 * i] ?? 0, zi = this.xz[2 * i + 1] ?? 0, xj = this.xz[2 * j] ?? 0, zj = this.xz[2 * j + 1] ?? 0;
        if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
      }
    }
    return inside;
  }

  /** Polígono que contiene el punto y cumple `accept` (cualquiera, si no se da); −1 si ninguno. */
  find(x: number, z: number, accept?: (p: number) => boolean): number {
    const [cx, cz] = [Math.floor((x - this.x0) / CELL), Math.floor((z - this.z0) / CELL)];
    if (cx < 0 || cz < 0 || cx >= this.nx || cz >= this.nz) return -1;
    const cell = cx * this.nz + cz;
    for (let k = this.first[cell] ?? 0, end = this.first[cell + 1] ?? 0; k < end; k++) {
      const p = this.items[k] ?? 0;
      const b = 4 * p;
      if (x < (this.box[b] ?? 0) || z < (this.box[b + 1] ?? 0) || x > (this.box[b + 2] ?? 0) || z > (this.box[b + 3] ?? 0)) continue;
      if ((!accept || accept(p)) && this.inside(p, x, z)) return p;
    }
    return -1;
  }

  contains(x: number, z: number, accept?: (p: number) => boolean): boolean {
    return this.find(x, z, accept) >= 0;
  }
}
