import { TNT3 } from '../data/format';
import type { BuildingSource } from './protocol';

// Datos de prueba con la forma de TNT3 (FORMATO §3): exteriores antihorarios y huecos horarios
// vistos desde arriba con el norte arriba, es decir, en el plano (x, −z).

export interface FakeBuilding {
  /** Anillos [[x, z], …] abiertos: el primero es el exterior, los demás huecos. */
  rings: Array<Array<[number, number]>>;
  pisos: number;
  base?: number;
  banderas?: number;
}

/** Cuadrado de lado `side` con la esquina suroeste en (x, z), antihorario en (x, −z). */
export const square = (x: number, z: number, side: number): Array<[number, number]> => [
  [x, z], [x + side, z], [x + side, z - side], [x, z - side],
];

/** El mismo cuadrado en sentido horario: sirve de hueco. */
export const hole = (x: number, z: number, side: number): Array<[number, number]> => square(x, z, side).reverse();

export function fakeSource(buildings: readonly FakeBuilding[]): BuildingSource {
  const xz: number[] = [];
  const anillos = [0];
  const edificios = [0];
  for (const b of buildings) {
    for (const ring of b.rings) {
      for (const [x, z] of ring) xz.push(x, z);
      anillos.push(xz.length / 2);
    }
    edificios.push(anillos.length - 1);
  }
  return {
    count: buildings.length,
    xz: Float32Array.from(xz),
    anillos: Uint32Array.from(anillos),
    edificios: Uint32Array.from(edificios),
    pisos: Uint8Array.from(buildings.map((b) => b.pisos)),
    base: Uint8Array.from(buildings.map((b) => b.base ?? 0)),
    banderas: Uint8Array.from(buildings.map((b) => b.banderas ?? TNT3.banderasEdificio.pisosConocidos)),
  };
}
