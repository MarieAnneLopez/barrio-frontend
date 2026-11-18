// Pertenencia y distancias en el plano x/z (metros): punto en anillo o polígono con huecos,
// un punto interior garantizado y la distancia de un punto a un polígono.
import { centroid } from './geo.mjs';

export function pointInRing([x, z], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Dentro del anillo exterior (el primero) y fuera de todos los huecos. */
export function pointInPolygon(point, rings) {
  if (!rings.length || !pointInRing(point, rings[0])) return false;
  return !rings.slice(1).some((hole) => pointInRing(point, hole));
}

/** Punto garantizado dentro: el centroide si cae dentro; si no, el medio del tramo interior más ancho. */
export function pointOnSurface(rings) {
  const c = centroid(rings[0]);
  if (pointInPolygon(c, rings)) return c;
  const zs = rings[0].map((p) => p[1]);
  const z = (Math.min(...zs) + Math.max(...zs)) / 2;
  const xs = [];
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, zi] = ring[i];
      const [xj, zj] = ring[j];
      if (zi > z !== zj > z) xs.push(xi + ((z - zi) * (xj - xi)) / (zj - zi));
    }
  }
  xs.sort((a, b) => a - b);
  let best = [c, -1];
  for (let k = 0; k + 1 < xs.length; k += 2) {
    if (xs[k + 1] - xs[k] > best[1]) best = [[(xs[k] + xs[k + 1]) / 2, z], xs[k + 1] - xs[k]];
  }
  return best[0];
}

export function distanceToSegment([px, pz], [ax, az], [bx, bz]) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

/** 0 si el punto cae dentro del polígono; si no, la distancia al borde más cercano. */
export function distanceToRings(point, rings) {
  if (pointInPolygon(point, rings)) return 0;
  let best = Infinity;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      best = Math.min(best, distanceToSegment(point, ring[j], ring[i]));
    }
  }
  return best;
}
