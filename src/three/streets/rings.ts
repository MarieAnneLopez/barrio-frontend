// Pruebas sobre los anillos [r0, r1) de un polígono con huecos en la forma de TNT3 (vértices `xz` e
// inicio de cada anillo en `rings`; el último vértice se une con el primero): punto adentro y cruces
// de un segmento con los bordes.

/** ¿(x, z) cae dentro? Regla par-impar sobre todos los anillos: los huecos no cuentan. */
export function evenOdd(xz: ArrayLike<number>, rings: ArrayLike<number>, r0: number, r1: number, x: number, z: number): boolean {
  let inside = false;
  for (let r = r0; r < r1; r++) {
    for (let i = rings[r] ?? 0, end = rings[r + 1] ?? 0, j = end - 1; i < end; j = i++) {
      const xi = xz[2 * i] ?? 0, zi = xz[2 * i + 1] ?? 0, xj = xz[2 * j] ?? 0, zj = xz[2 * j + 1] ?? 0;
      if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
  }
  return inside;
}

/** Agrega a `out` las fracciones t ∈ (0, 1) donde el segmento AB cruza un borde de los anillos. */
export function segmentCuts(
  xz: ArrayLike<number>, rings: ArrayLike<number>, r0: number, r1: number,
  ax: number, az: number, bx: number, bz: number, out: number[],
): void {
  const dx = bx - ax, dz = bz - az;
  for (let r = r0; r < r1; r++) {
    for (let i = rings[r] ?? 0, end = rings[r + 1] ?? 0, j = end - 1; i < end; j = i++) {
      const cx = xz[2 * j] ?? 0, cz = xz[2 * j + 1] ?? 0;
      const ex = (xz[2 * i] ?? 0) - cx, ez = (xz[2 * i + 1] ?? 0) - cz;
      const den = dx * ez - dz * ex;
      if (Math.abs(den) < 1e-12) continue; // paralelos
      const t = ((cx - ax) * ez - (cz - az) * ex) / den;
      const u = ((cx - ax) * dz - (cz - az) * dx) / den;
      if (t > 0 && t < 1 && u >= 0 && u <= 1) out.push(t);
    }
  }
}
