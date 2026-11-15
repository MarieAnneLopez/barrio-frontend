// H33: separa figuras que se tocan en una hoja de secuencia (saludo) con costuras
// verticales de costo mínimo: cada costura baja fila por fila buscando el fondo y
// solo atraviesa el dibujo donde dos figuras se tocan de verdad (se cuentan).

/** Cuántos píxeles de dibujo hay en cada columna entre y0 e y1. */
export function columnProfile(fg, width, y0, y1) {
  const prof = new Float64Array(width);
  for (let y = y0; y < y1; y++) for (let x = 0; x < width; x++) prof[x] += fg[y * width + x];
  return prof;
}

/** Las n columnas más vacías entre figuras, separadas al menos minGap, de izquierda a derecha. */
export function findCuts(prof, n, minGap, xMin, xMax, smooth = 15) {
  const s = prof.map((_, x) => {
    let sum = 0;
    for (let d = -smooth; d <= smooth; d++) sum += prof[Math.min(prof.length - 1, Math.max(0, x + d))];
    return sum;
  });
  const cuts = [];
  const order = [...s.keys()].filter((x) => x > xMin && x < xMax).sort((a, b) => s[a] - s[b]);
  for (const x of order) {
    if (cuts.length === n) break;
    if (cuts.every((c) => Math.abs(c - x) >= minGap)) cuts.push(x);
  }
  return cuts.sort((a, b) => a - b);
}

/**
 * Costura de costo mínimo (programación dinámica) dentro de cut ± band, de y0 a y1.
 * @returns {{ xs: Int32Array, crossed: number }} xs[y - y0] = columna de la costura.
 */
export function minimalSeam(fg, width, cut, band, y0, y1) {
  const lo = Math.max(1, cut - band);
  const hi = Math.min(width - 2, cut + band);
  const w = hi - lo + 1;
  const rows = y1 - y0;
  const cost = new Float64Array(rows * w);
  const from = new Int8Array(rows * w);
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < w; i++) {
      // Costo: atravesar dibujo pesa 1; alejarse de la columna guía, casi nada.
      const own = fg[(y0 + r) * width + lo + i] + Math.abs(lo + i - cut) * 1e-4;
      if (r === 0) {
        cost[i] = own;
        continue;
      }
      let best = Infinity;
      for (let d = -1; d <= 1; d++) {
        const j = i + d;
        if (j >= 0 && j < w && cost[(r - 1) * w + j] < best) {
          best = cost[(r - 1) * w + j];
          from[r * w + i] = d;
        }
      }
      cost[r * w + i] = own + best;
    }
  }
  let i = 0;
  for (let k = 1; k < w; k++) if (cost[(rows - 1) * w + k] < cost[(rows - 1) * w + i]) i = k;
  const xs = new Int32Array(rows);
  let crossed = 0;
  for (let r = rows - 1; r >= 0; r--) {
    xs[r] = lo + i;
    crossed += fg[(y0 + r) * width + lo + i];
    i += from[r * w + i];
  }
  return { xs, crossed };
}

/** Etiqueta cada píxel de dibujo (y ≥ y0) con su figura 1..n según las costuras. */
export function regionLabels(fg, width, height, seams, y0) {
  const labels = new Int32Array(width * height);
  for (let y = y0; y < height; y++) {
    const r = Math.min(y - y0, seams[0] ? seams[0].xs.length - 1 : 0);
    for (let x = 0; x < width; x++) {
      if (!fg[y * width + x]) continue;
      let region = 1;
      for (const s of seams) if (x > s.xs[r]) region += 1;
      labels[y * width + x] = region;
    }
  }
  return labels;
}
