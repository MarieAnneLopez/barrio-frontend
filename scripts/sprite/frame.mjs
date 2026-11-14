// Recorta una pose con la máscara de sus componentes y limpia el halo rosa.
import { colorDistance, isMagentaFamily, pixelAt, rgbToHsv } from './color.mjs';

/**
 * Tinte magenta visible (halo): matiz 280–330°, saturación ≥ 0,3 y brillo
 * ≥ 0,4. El contorno morado casi negro del dibujo (v ≈ 0,25) no cuenta.
 */
export function isSpill(rgb) {
  if (isMagentaFamily(rgb)) return true;
  const [h, s, v] = rgbToHsv(rgb);
  return h >= 280 && h <= 330 && s >= 0.3 && v >= 0.4;
}

/** Ancho del anillo de borde donde puede haber mezcla con el fondo (px). */
export const EDGE_RING = 2;

/** ¿Hay un píxel fuera de la máscara a distancia de Chebyshev ≤ r? */
export function nearOutside(at, x, y, r = EDGE_RING) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) if (!at(x + dx, y + dy)) return true;
  }
  return false;
}

/**
 * @returns {{ rgba: Uint8Array, w: number, h: number, x: number, y: number,
 *   inPose: Uint8Array, despilled: number, dropped: number }}
 */
export function cutFrame(data, labels, sheetW, sheetH, pose, bg, opts = {}) {
  const { pad = 2, edgeThreshold = 160 } = opts;
  const ids = new Set(pose.ids);
  const x0 = Math.max(0, pose.minX - pad);
  const y0 = Math.max(0, pose.minY - pad);
  const w = Math.min(sheetW - 1, pose.maxX + pad) - x0 + 1;
  const h = Math.min(sheetH - 1, pose.maxY + pad) - y0 + 1;
  const inPose = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      inPose[y * w + x] = ids.has(labels[(y0 + y) * sheetW + x0 + x]) ? 1 : 0;
    }
  }
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? inPose[y * w + x] : 0);
  const color = (x, y) => pixelAt(data, sheetW, x0 + x, y0 + y);

  const rgba = new Uint8Array(w * h * 4);
  let despilled = 0;
  let dropped = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue;
      let rgb = color(x, y);
      const spilled = colorDistance(rgb, bg) < edgeThreshold || isSpill(rgb);
      if (spilled && nearOutside(at, x, y)) {
        const clean = interiorMean(color, at, x, y);
        if (!clean) {
          dropped += 1;
          continue;
        }
        rgb = clean;
        despilled += 1;
      }
      rgba.set([...rgb, 255], (y * w + x) * 4);
    }
  }
  return { rgba, w, h, x: x0, y: y0, inPose, despilled, dropped };
}

/** Promedio de vecinos limpios fuera del anillo de borde, radio EDGE_RING + 2. */
function interiorMean(color, at, x, y) {
  const r = EDGE_RING + 2;
  const sum = [0, 0, 0];
  let n = 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (!at(nx, ny) || nearOutside(at, nx, ny)) continue;
      const rgb = color(nx, ny);
      if (isSpill(rgb)) continue;
      for (let c = 0; c < 3; c++) sum[c] += rgb[c];
      n += 1;
    }
  }
  return n ? sum.map((v) => Math.round(v / n)) : null;
}
