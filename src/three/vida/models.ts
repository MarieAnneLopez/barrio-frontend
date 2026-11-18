import {
  BoxGeometry, ConeGeometry, CylinderGeometry, LatheGeometry, PlaneGeometry, SphereGeometry, Vector2, type BufferGeometry,
} from 'three';
import { mergeParts } from '../streets/parts';

// Modelos low-poly de la vida, en metros, con el +x hacia adelante y la base en y = 0.

const box = (w: number, h: number, d: number, x: number, y: number, z = 0) => new BoxGeometry(w, h, d).translate(x, y, z);

/** Carro: 0 carrocería (color de la instancia), 1 vidrios y ruedas, 2 faros, 3 luces traseras. */
export function carModel(): BufferGeometry {
  return mergeParts([
    [box(3.6, 0.36, 1.7, 0, 0.2), 1],
    [box(4.4, 0.9, 1.8, 0, 0.8), 0],
    [box(2.3, 0.62, 1.62, -0.3, 1.55), 1],
    [box(2.0, 0.1, 1.5, -0.35, 1.9), 0],
    [box(0.1, 0.22, 1.4, 2.2, 0.95), 2],
    [box(0.1, 0.22, 1.5, -2.2, 0.95), 3],
  ]);
}

/** Abanico de luz de los faros en el suelo, delante del carro (uv.y crece al alejarse). */
export function headlightBeam(): BufferGeometry {
  return new PlaneGeometry(7, 12).rotateX(-Math.PI / 2).rotateY(-Math.PI / 2).translate(8.2, 0.15, 0);
}

/** Perfil del cuerpo (radio, altura): ancho abajo y hombros redondos, como un bolo. */
const BODY = [[0, 0], [0.34, 0.03], [0.39, 0.3], [0.3, 0.72], [0, 0.98]].map(([r = 0, y = 0]) => new Vector2(r, y));

/**
 * Personita al estilo del Messenger antiguo: cabeza redonda (0) sobre un cuerpo redondeado (1), cada
 * una de un tono; low-poly (≈ 110 triángulos). Mide ≈ 1,5 m a escala 1.
 */
export function personModel(): BufferGeometry {
  return mergeParts([
    [new SphereGeometry(0.27, 7, 5).translate(0, 1.24, 0), 0],
    [new LatheGeometry(BODY, 7).scale(1, 1, 0.8), 1],
  ]);
}

/**
 * Avión de ≈ 38 m: 0 fuselaje, 1 alas y cola, 2 luz de babor (roja, −z), 3 de estribor (+z) y
 * 4 destellos blancos en las puntas de las alas y en la cola.
 */
export function planeModel(): BufferGeometry {
  return mergeParts([
    [new CylinderGeometry(1.9, 1.9, 30, 6).rotateZ(Math.PI / 2), 0],
    [new ConeGeometry(1.9, 5, 6).rotateZ(-Math.PI / 2).translate(17.5, 0, 0), 0],
    [new ConeGeometry(1.9, 6, 6).rotateZ(Math.PI / 2).translate(-18, 0.4, 0), 0],
    [box(6, 0.35, 34, 1, -0.6), 1],
    [box(3.2, 0.3, 11, -16, 0.6), 1],
    [box(3.6, 6, 0.3, -16.5, 3.4), 1],
    [box(1.2, 0.6, 1.2, 1.4, -0.6, -17.4), 2],
    [box(1.2, 0.6, 1.2, 1.4, -0.6, 17.4), 3],
    [box(0.9, 0.6, 0.9, -0.6, -0.6, -17.4), 4],
    [box(0.9, 0.6, 0.9, -0.6, -0.6, 17.4), 4],
    [box(0.9, 0.9, 0.9, -17.8, 6.8), 4],
  ]);
}
