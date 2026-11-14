// Cálculo de color para las pruebas de tokens: resuelve variables CSS,
// mezcla, composición alfa y contraste WCAG 2.x.
export type Rgba = [number, number, number, number];

export function parseVars(css: string, selector: string): Map<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css)?.[2] ?? '';
  const vars = new Map<string, string>();
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(match[1] ?? '', (match[2] ?? '').trim());
  }
  return vars;
}

export function resolveColor(value: string, vars: Map<string, string>): Rgba {
  const v = value.trim();
  const ref = /^var\((--[\w-]+)\)$/.exec(v);
  if (ref) return resolveColor(vars.get(ref[1] ?? '') ?? '', vars);
  const hex = /^#([0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const n = parseInt(hex[1] ?? '0', 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = /^rgb\((\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\)$/.exec(v);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), Number(rgb[4] ?? 1)];
  const mix = /^color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)$/.exec(v);
  if (mix) {
    const a = resolveColor(mix[1] ?? '', vars);
    const b = resolveColor(mix[3] ?? '', vars);
    const t = Number(mix[2]) / 100;
    return [0, 1, 2].map((i) => (a[i] ?? 0) * t + (b[i] ?? 0) * (1 - t)).concat(1) as Rgba;
  }
  throw new Error(`Color no soportado: ${value}`);
}

/** Compone un color con alfa sobre un fondo opaco. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  const a = top[3];
  return [0, 1, 2].map((i) => (top[i] ?? 0) * a + (bottom[i] ?? 0) * (1 - a)).concat(1) as Rgba;
}

function luminance([r, g, b]: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(fg: Rgba, bg: Rgba): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}
