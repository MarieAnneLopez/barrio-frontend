// Utilidades de color para separar a Mini Marie del fondo magenta.

/** Distancia euclídea entre dos colores RGB. */
export function colorDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** RGB (0–255) → [h en grados, s 0–1, v 0–1]. */
export function rgbToHsv([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta > 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;
  return [h, max === 0 ? 0 : delta / max, max / 255];
}

// Fondo (300°), sombra morada (≈298°) y última fila (≈301°) caen aquí;
// el contorno morado oscuro del personaje no (v ≈ 0,23).
const HUE_MIN = 280;
const HUE_MAX = 320;
const SAT_MIN = 0.45;
const VAL_MIN = 0.45;

/** ¿El color es fondo, sombra o mezcla con ellos (familia magenta)? */
export function isMagentaFamily(rgb) {
  const [h, s, v] = rgbToHsv(rgb);
  return h >= HUE_MIN && h <= HUE_MAX && s >= SAT_MIN && v >= VAL_MIN;
}

/** Sombra: mismo matiz magenta pero de cualquier brillo (sus filas altas son oscuras). */
export function isShadowColor(rgb) {
  const [h, s] = rgbToHsv(rgb);
  return h >= HUE_MIN && h <= HUE_MAX && s >= SAT_MIN;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
}

/** Color de fondo: mediana por canal de las `rows` filas superiores. */
export function estimateBackground(data, width, height, rows = 60) {
  const channels = [[], [], []];
  const limit = Math.min(rows, height);
  for (let y = 0; y < limit; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      for (let c = 0; c < 3; c++) channels[c].push(data[i + c]);
    }
  }
  return channels.map(median);
}

/** Lee el píxel (x, y) de un búfer RGB. */
export function pixelAt(data, width, x, y) {
  const i = (y * width + x) * 3;
  return [data[i], data[i + 1], data[i + 2]];
}
