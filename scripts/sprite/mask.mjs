// Máscaras de primer plano y de sombra a partir del búfer RGB de la hoja.
import { colorDistance, isMagentaFamily, isShadowColor, pixelAt } from './color.mjs';

/**
 * Separa el personaje del fondo con dos criterios: distancia al fondo
 * (> bgThreshold) y que el color no pertenezca a la familia magenta.
 * Lo lejano al fondo pero magenta (sombra, halos de borde) va a `magenta`.
 */
export function buildMasks(data, width, height, bg, { bgThreshold = 90 } = {}) {
  const fg = new Uint8Array(width * height);
  const magenta = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rgb = pixelAt(data, width, x, y);
      if (colorDistance(rgb, bg) <= bgThreshold) continue;
      if (isMagentaFamily(rgb)) magenta[y * width + x] = 1;
      else fg[y * width + x] = 1;
    }
  }
  return { fg, magenta };
}

/**
 * Forma de la sombra: entre las rachas de filas donde lo que no es fondo
 * ocupa ≥ 50 % del ancho, la delgada (≤ 5 % del alto) de mayor cobertura
 * media. El torso de las 6 poses también supera el 50 %, pero es alto.
 */
export function findShadowBand(fg, magenta, width, height) {
  let best = null;
  let start = -1;
  let sum = 0;
  for (let y = 0; y <= height; y++) {
    let count = 0;
    if (y < height) for (let x = 0; x < width; x++) count += fg[y * width + x] | magenta[y * width + x];
    const wide = y < height && count >= width * 0.5;
    if (wide && start < 0) [start, sum] = [y, 0];
    if (wide) sum += count / width;
    if (!wide && start >= 0) {
      const rows = y - start;
      const mean = sum / rows;
      const thin = rows <= height * 0.05;
      if (thin && (!best || mean > best.mean)) best = { minY: start, maxY: y - 1, mean };
      start = -1;
    }
  }
  if (!best) throw new Error('No se encontró la línea de sombra (banda ancha y delgada)');
  let minX = width;
  let maxX = -1;
  for (let y = best.minY; y <= best.maxY; y++) {
    for (let x = 0; x < width; x++) {
      if (!(fg[y * width + x] | magenta[y * width + x])) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }
  return { minY: best.minY, maxY: best.maxY, minX, maxX };
}

/**
 * Quita de `fg` los píxeles con matiz de sombra dentro de la banda, con
 * `margin` filas extra arriba y abajo (sus bordes oscuros quedan bajo el 50 %).
 */
export function removeShadow(data, fg, width, height, band, margin = 3) {
  let removed = 0;
  const top = Math.max(0, band.minY - margin);
  const bottom = Math.min(height - 1, band.maxY + margin);
  for (let y = top; y <= bottom; y++) {
    for (let x = band.minX; x <= band.maxX; x++) {
      const i = y * width + x;
      if (fg[i] && isShadowColor(pixelAt(data, width, x, y))) {
        fg[i] = 0;
        removed += 1;
      }
    }
  }
  return removed;
}
