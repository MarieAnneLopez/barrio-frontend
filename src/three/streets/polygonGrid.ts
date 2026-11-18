import { boxCells, cellOf, type Cells } from './cellGrid';
import { evenOdd, segmentCuts } from './rings';

// Rejilla de polígonos con huecos: «¿en qué polígono cae este punto?» y «¿dónde cruza este segmento
// sus bordes?». Los edificios y las áreas de suelo de TNT3 tienen la misma forma (vértices, inicio de
// cada anillo, inicio de cada polígono en anillos): sirve para las huellas de los edificios y para
// las canchas, el agua, etc. Sin objetos por polígono ni por consulta: 20 000 huellas en pocos ms.

const CELL = 32;

export class PolygonGrid {
  private readonly box: Float32Array;
  private readonly cells: Cells;
  private readonly stamp: Uint32Array;
  private query = 0;

  constructor(
    private readonly xz: ArrayLike<number>,
    private readonly rings: ArrayLike<number>,
    private readonly polys: ArrayLike<number>,
    count: number,
    keep: (p: number) => boolean = () => true,
  ) {
    const box = (this.box = new Float32Array(4 * count).fill(NaN));
    for (let p = 0; p < count; p++) {
      if (!keep(p)) continue;
      const outer = polys[p] ?? 0;
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
      for (let i = rings[outer] ?? 0, end = rings[outer + 1] ?? 0; i < end; i++) {
        const x = xz[2 * i] ?? 0, z = xz[2 * i + 1] ?? 0;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
      }
      if (!(x1 >= x0)) continue;
      box[4 * p] = x0; box[4 * p + 1] = z0; box[4 * p + 2] = x1; box[4 * p + 3] = z1;
    }
    this.cells = boxCells(box, CELL);
    this.stamp = new Uint32Array(count);
  }

  /** ¿La caja del polígono p toca la caja [x0, x1] × [z0, z1]? */
  private touches(p: number, x0: number, z0: number, x1: number, z1: number): boolean {
    const b = this.box;
    return !(x1 < (b[4 * p] ?? 0) || z1 < (b[4 * p + 1] ?? 0) || x0 > (b[4 * p + 2] ?? 0) || z0 > (b[4 * p + 3] ?? 0));
  }

  /** Polígono que contiene el punto y cumple `accept` (cualquiera, si no se da); −1 si ninguno. */
  find(x: number, z: number, accept?: (p: number) => boolean): number {
    const c = this.cells;
    const cx = Math.floor((x - c.x0) / c.size), cz = Math.floor((z - c.z0) / c.size);
    if (cx < 0 || cz < 0 || cx >= c.nx || cz >= c.nz) return -1;
    for (let k = c.first[cx * c.nz + cz] ?? 0, end = c.first[cx * c.nz + cz + 1] ?? 0; k < end; k++) {
      const p = c.items[k] ?? 0;
      if (!this.touches(p, x, z, x, z) || (accept && !accept(p))) continue;
      if (evenOdd(this.xz, this.rings, this.polys[p] ?? 0, this.polys[p + 1] ?? 0, x, z)) return p;
    }
    return -1;
  }

  readonly contains = (x: number, z: number, accept?: (p: number) => boolean): boolean => this.find(x, z, accept) >= 0;

  /**
   * Agrega a `out` las fracciones t ∈ (0, 1) donde el segmento AB cruza un borde de los polígonos que
   * cumplen `accept`. Se buscan por trechos de una celda (la caja de un tramo largo en diagonal tocaría
   * cientos de celdas) y cada polígono se corta una sola vez con el segmento entero. Sin desestructurar
   * arreglos: corre miles de veces apenas se abre la maqueta, antes de que el motor la optimice.
   */
  crossings(ax: number, az: number, bx: number, bz: number, out: number[], accept?: (p: number) => boolean): void {
    const c = this.cells, q = ++this.query, dx = bx - ax, dz = bz - az;
    if (c.nx === 0) return;
    const parts = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dz * dz) / c.size));
    for (let s = 0; s < parts; s++) {
      const px = ax + (dx * s) / parts, pz = az + (dz * s) / parts, qx = ax + (dx * (s + 1)) / parts, qz = az + (dz * (s + 1)) / parts;
      const x0 = Math.min(px, qx), z0 = Math.min(pz, qz), x1 = Math.max(px, qx), z1 = Math.max(pz, qz);
      const cz0 = cellOf(z0, c.z0, c.size, c.nz), cz1 = cellOf(z1, c.z0, c.size, c.nz);
      for (let cx = cellOf(x0, c.x0, c.size, c.nx), cx1 = cellOf(x1, c.x0, c.size, c.nx); cx <= cx1; cx++) {
        // Las celdas cz0..cz1 de una columna son seguidas en la lista.
        for (let k = c.first[cx * c.nz + cz0] ?? 0, end = c.first[cx * c.nz + cz1 + 1] ?? 0; k < end; k++) {
          const p = c.items[k] ?? 0;
          if (this.stamp[p] === q || !this.touches(p, x0, z0, x1, z1)) continue;
          this.stamp[p] = q;
          if (!accept || accept(p)) segmentCuts(this.xz, this.rings, this.polys[p] ?? 0, this.polys[p + 1] ?? 0, ax, az, bx, bz, out);
        }
      }
    }
  }
}
