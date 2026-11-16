// A dónde mira la maqueta al abrir (D83): la zona con más edificios reales cuya vista (una
// ventana de 3 × 3 celdas de 300 m, lo que abarca el encuadre de la referencia) cae completa
// dentro del barrio. Así el encuadre se llena de barrio y de volumen, como la referencia, sin
// inventar nada: solo se elige hacia dónde mirar.
import type { Feature, Geometry, Position } from 'geojson';
import type { Projection } from './projection';

const CELL = 300;
type Point = readonly [number, number];

function outerRing(geometry: Geometry | null | undefined): Position[] {
  if (geometry?.type === 'Polygon') return geometry.coordinates[0] ?? [];
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates[0]?.[0] ?? [];
  return [];
}

function inside(ring: readonly Point[], [x, z]: Point): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i] ?? [0, 0];
    const [xj, zj] = ring[j] ?? [0, 0];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}

/** Centro (x, z en metros) de la mejor celda; el centro del barrio si no hay edificios. */
export function densestSpot(
  buildings: readonly Feature<Geometry | null>[],
  boundary: Geometry | null | undefined,
  project: Projection,
): [number, number] {
  // El barrio puede venir en varias partes (MultiPolygon): vale estar dentro de cualquiera.
  const parts = boundary?.type === 'MultiPolygon' ? boundary.coordinates.map((c) => c[0] ?? []) : [outerRing(boundary)];
  const limits = parts.map((ring) => ring.map((p) => project(p)));
  const within = (point: Point) => limits.some((ring) => inside(ring, point));
  const cells = new Map<string, number>();
  for (const building of buildings) {
    const first = outerRing(building.geometry)[0];
    if (!first) continue;
    const [x, z] = project(first);
    const key = `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }
  const around = [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dz) => [dx, dz] as const));
  const center = (c: number) => (c + 0.5) * CELL;
  let best: [number, number, number] = [0, 0, 0];
  for (const key of cells.keys()) {
    const [cx = 0, cz = 0] = key.split(',').map(Number);
    // La ventana completa debe estar dentro del barrio: así no se ve el fondo.
    if (!around.every(([dx, dz]) => within([center(cx + dx), center(cz + dz)]))) continue;
    const total = around.reduce((t, [dx, dz]) => t + (cells.get(`${cx + dx},${cz + dz}`) ?? 0), 0);
    if (total > best[2]) best = [center(cx), center(cz), total];
  }
  return [best[0], best[1]];
}
