// Recorte de líneas (vías, canales, hileras de árboles) al polígono del barrio, como el ETL del
// backend (ST_Intersection): cada tramo se parte donde cruza el borde y se conservan los pedazos
// de dentro. Cada vértice de salida es [x, z, índice original] o [x, z, -1] si es un corte nuevo.
import { pointInPolygon } from './inside.mjs';

const EPS = 1e-9;

/** Parámetros t (0..1) donde el tramo a→b cruza los bordes del polígono. */
function crossings(a, b, rings) {
  const ts = [];
  const rx = b[0] - a[0];
  const rz = b[1] - a[1];
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const c = ring[j];
      const sx = ring[i][0] - c[0];
      const sz = ring[i][1] - c[1];
      const den = rx * sz - rz * sx;
      if (Math.abs(den) < EPS) continue; // paralelos: el punto medio decide
      const t = ((c[0] - a[0]) * sz - (c[1] - a[1]) * sx) / den;
      const u = ((c[0] - a[0]) * rz - (c[1] - a[1]) * rx) / den;
      if (t > EPS && t < 1 - EPS && u >= -EPS && u <= 1 + EPS) ts.push(t);
    }
  }
  return ts.sort((p, q) => p - q);
}

export function clipLine(points, rings) {
  const pieces = [];
  let current = [];
  const flush = () => {
    if (current.length >= 2) pieces.push(current);
    current = [];
  };
  for (let k = 0; k + 1 < points.length; k++) {
    const a = points[k];
    const b = points[k + 1];
    const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const ts = [0, ...crossings(a, b, rings), 1];
    for (let s = 0; s + 1 < ts.length; s++) {
      const [t0, t1] = [ts[s], ts[s + 1]];
      if (!pointInPolygon(at((t0 + t1) / 2), rings)) {
        flush();
        continue;
      }
      if (current.length === 0) current.push(t0 === 0 ? [a[0], a[1], k] : [...at(t0), -1]);
      current.push(t1 === 1 ? [b[0], b[1], k + 1] : [...at(t1), -1]);
    }
  }
  flush();
  return pieces;
}
