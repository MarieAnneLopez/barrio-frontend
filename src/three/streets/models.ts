import { BoxGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, PlaneGeometry, type BufferGeometry } from 'three';
import { mergeParts } from './parts';

// Modelos low-poly de la calle, en metros con la base en y = 0 (la instancia los escala y gira).

const box = (w: number, h: number, d: number, x: number, y: number, z = 0) => new BoxGeometry(w, h, d).translate(x, y, z);

/** Árbol de copa redonda: parte 0 tronco, 1 copa (≈ 4,6 m de alto a escala 1). */
export function roundTree(): BufferGeometry {
  return mergeParts([
    [new CylinderGeometry(0.16, 0.24, 2.2, 5).translate(0, 1.1, 0), 0],
    [new IcosahedronGeometry(1.55, 0).scale(1, 0.9, 1).translate(0, 3.2, 0), 1],
  ]);
}

/** Árbol cónico (pino, urapán joven): parte 0 tronco, 1 copa. */
export function coneTree(): BufferGeometry {
  return mergeParts([
    [new CylinderGeometry(0.14, 0.2, 1.6, 5).translate(0, 0.8, 0), 0],
    [new ConeGeometry(1.25, 3.8, 6).translate(0, 3.3, 0), 1],
  ]);
}

/** Farol con brazo hacia +x: parte 0 metal, 1 lámpara (luz propia de noche). */
export function streetLamp(): BufferGeometry {
  return mergeParts([
    [box(0.2, 7.6, 0.2, 0, 3.8), 0],
    [box(1.7, 0.14, 0.14, 0.85, 7.5), 0],
    [box(0.75, 0.2, 0.38, 1.6, 7.38), 1],
  ]);
}

/** Semáforo con brazo hacia +x: 0 metal, 1 caja, 2 alto, 3 atención, 4 siga (luces a ambos lados). */
export function trafficLight(): BufferGeometry {
  return mergeParts([
    [box(0.22, 5.6, 0.22, 0, 2.8), 0],
    [box(3.2, 0.16, 0.16, 1.6, 5.5), 0],
    [box(0.5, 1.4, 0.5, 3.05, 4.75), 1],
    [box(0.32, 0.32, 0.58, 3.05, 5.2), 2],
    [box(0.32, 0.32, 0.58, 3.05, 4.75), 3],
    [box(0.32, 0.32, 0.58, 3.05, 4.3), 4],
  ]);
}

/** Cuadrado plano de 1 × 1 m en el plano x-z, cara hacia arriba (cebras y halos de luz). */
export function flatSquare(): BufferGeometry {
  return new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
}
