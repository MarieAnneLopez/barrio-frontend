// Matrices de instancia escritas a mano (sin Object3D por instancia): la vida del barrio actualiza
// cientos por cuadro en un solo bucle.

export interface Pose { x: number; y: number; z: number; yaw: number; scale: number }

/**
 * Escribe en `out` (16 floats por instancia, columna mayor) traslación · giro en y (`yaw`, el +x
 * local queda en (cos, 0, −sen)) · balanceo en x (`roll`) · escala.
 */
export function writePose(
  out: Float32Array, i: number, x: number, y: number, z: number, yaw: number,
  sx: number, sy = sx, sz = sx, roll = 0,
): void {
  const [c, s] = [Math.cos(yaw), Math.sin(yaw)];
  const [cr, sr] = [Math.cos(roll), Math.sin(roll)];
  const o = 16 * i;
  out[o] = c * sx;
  out[o + 1] = 0;
  out[o + 2] = -s * sx;
  out[o + 3] = 0;
  out[o + 4] = s * sr * sy;
  out[o + 5] = cr * sy;
  out[o + 6] = c * sr * sy;
  out[o + 7] = 0;
  out[o + 8] = s * cr * sz;
  out[o + 9] = -sr * sz;
  out[o + 10] = c * cr * sz;
  out[o + 11] = 0;
  out[o + 12] = x;
  out[o + 13] = y;
  out[o + 14] = z;
  out[o + 15] = 1;
}

/** Yaw que lleva el +x local a la dirección (dx, dz) del plano x-z. */
export const yawOf = (dx: number, dz: number) => Math.atan2(-dz, dx);

export function posesToMatrices(poses: readonly Pose[]): Float32Array {
  const out = new Float32Array(poses.length * 16);
  poses.forEach((p, i) => writePose(out, i, p.x, p.y, p.z, p.yaw, p.scale));
  return out;
}

/** Marcas planas a la altura `y`: el +x local a lo largo de la calle (rotation.y = −ángulo). */
export function marksToMatrices(marks: ReadonlyArray<{ x: number; z: number; angle: number; sx: number; sz: number }>, y: number): Float32Array {
  const out = new Float32Array(marks.length * 16);
  marks.forEach((m, i) => writePose(out, i, m.x, y, m.z, -m.angle, m.sx, 1, m.sz));
  return out;
}
