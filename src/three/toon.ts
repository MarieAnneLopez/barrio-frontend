// Sombreado plano por caras (D83): cada cara recibe un color del tema según hacia dónde mira,
// horneado en el color de sus vértices. Sin luces ni tone mapping, el píxel final ES el hex del
// tema: el volumen sale del contraste techo / cara iluminada / cara en sombra, no de mezclar luz.
import { Float32BufferAttribute, type BufferGeometry, type Color } from 'three';

export type FaceKind = 'top' | 'lit' | 'shadow';

/**
 * Dirección horizontal hacia la luz (x este, z sur). La referencia no tiene una dirección medible
 * (aristas con el lado derecho más claro: 50,2 %), así que se asume una luz suave desde el oeste.
 */
const TO_LIGHT_X = -0.94;
const TO_LIGHT_Z = 0.34;

/** Pinta una geometría sin índice (3 vértices por cara) con el color que `pick` da a cada cara. */
export function paintFaces(geometry: BufferGeometry, pick: (kind: FaceKind, featureId: number) => Color): void {
  const position = geometry.getAttribute('position');
  if (!position) return;
  const ids = geometry.getAttribute('featureId');
  const values = new Float32Array(position.count * 3);
  for (let i = 0; i + 2 < position.count; i += 3) {
    const ux = position.getX(i + 1) - position.getX(i);
    const uy = position.getY(i + 1) - position.getY(i);
    const uz = position.getZ(i + 1) - position.getZ(i);
    const vx = position.getX(i + 2) - position.getX(i);
    const vy = position.getY(i + 2) - position.getY(i);
    const vz = position.getZ(i + 2) - position.getZ(i);
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const length = Math.hypot(nx, ny, nz) || 1;
    const kind: FaceKind = ny / length > 0.5 ? 'top' : nx * TO_LIGHT_X + nz * TO_LIGHT_Z > 0 ? 'lit' : 'shadow';
    const color = pick(kind, ids ? ids.getX(i) : 0);
    for (let j = 0; j < 3; j++) values.set([color.r, color.g, color.b], (i + j) * 3);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(values, 3));
}
