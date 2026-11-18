import { BufferGeometry, Color, Float32BufferAttribute, Uint32BufferAttribute } from 'three';

// Acumulador de geometría con color de día y de noche por vértice: muchas piezas (áreas, cintas,
// pilas de puentes) terminan en UNA malla fusionada con un solo material (dayNightMaterial).

export interface DayNight { day: Color; night: Color }

export class Sink {
  readonly position: number[] = [];
  readonly normal: number[] = [];
  readonly day: number[] = [];
  readonly night: number[] = [];
  readonly index: number[] = [];

  get vertices(): number {
    return this.position.length / 3;
  }

  vertex(x: number, y: number, z: number, color: DayNight, nx = 0, ny = 1, nz = 0): number {
    this.position.push(x, y, z);
    this.normal.push(nx, ny, nz);
    this.day.push(color.day.r, color.day.g, color.day.b);
    this.night.push(color.night.r, color.night.g, color.night.b);
    return this.vertices - 1;
  }

  /** Triángulo con la cara hacia arriba (+y) si es horizontal; los demás, tal cual. */
  triangle(a: number, b: number, c: number, faceUp = true): void {
    if (faceUp) {
      const p = this.position;
      const [ux, uz] = [(p[3 * b] ?? 0) - (p[3 * a] ?? 0), (p[3 * b + 2] ?? 0) - (p[3 * a + 2] ?? 0)];
      const [vx, vz] = [(p[3 * c] ?? 0) - (p[3 * a] ?? 0), (p[3 * c + 2] ?? 0) - (p[3 * a + 2] ?? 0)];
      if (uz * vx - ux * vz < 0) [b, c] = [c, b];
    }
    this.index.push(a, b, c);
  }

  get triangles(): number {
    return this.index.length / 3;
  }

  toGeometry(): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.position, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.normal, 3));
    g.setAttribute('colorDay', new Float32BufferAttribute(this.day, 3));
    g.setAttribute('colorNight', new Float32BufferAttribute(this.night, 3));
    g.setIndex(new Uint32BufferAttribute(this.index, 1));
    g.computeBoundingSphere();
    return g;
  }
}

/**
 * Cinta plana a lo largo de `xz` (ancho 2 × `half`) con inglete en los quiebres; `y` es una altura
 * fija o una por vértice (puentes). Devuelve los triángulos agregados.
 */
export function pushRibbon(
  sink: Sink, xz: ArrayLike<number>, normals: ArrayLike<number>, y: number | ArrayLike<number>, half: number, color: DayNight,
): number {
  const n = xz.length >> 1;
  if (n < 2) return 0;
  const first = sink.vertices;
  for (let i = 0; i < n; i++) {
    const [x, z] = [xz[2 * i] ?? 0, xz[2 * i + 1] ?? 0];
    const [nx, nz] = [(normals[2 * i] ?? 0) * half, (normals[2 * i + 1] ?? 0) * half];
    const h = typeof y === 'number' ? y : (y[i] ?? 0);
    sink.vertex(x - nx, h, z - nz, color);
    sink.vertex(x + nx, h, z + nz, color);
  }
  for (let i = 0; i < n - 1; i++) {
    const [l0, r0, l1, r1] = [first + 2 * i, first + 2 * i + 1, first + 2 * i + 2, first + 2 * i + 3];
    sink.triangle(l0, r0, l1);
    sink.triangle(r0, r1, l1);
  }
  return 2 * (n - 1);
}
