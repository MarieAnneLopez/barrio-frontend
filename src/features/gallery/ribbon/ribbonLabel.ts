// Franja inferior de cada tarjeta, pintada en un canvas 2D que va como textura sobre la foto: un
// degradado suave, la etiqueta real abajo a la izquierda y una flecha abajo a la derecha.
import { cssVar } from '../../../lib/cssToken';

export interface LabelPalette {
  chip: string;
  ink: string;
  mark: string;
  markInk: string;
  fade: string;
  font: string;
}

/** Colores y tipografía del design system, leídos al pintar: así siguen al alto contraste. */
export function readLabelPalette(): LabelPalette {
  return {
    chip: cssVar('--bg-primary', 'white'),
    ink: cssVar('--text-primary', 'black'),
    mark: cssVar('--bg-highlight', 'white'),
    markInk: cssVar('--text-on-highlight', 'black'),
    fade: cssVar('--bg-primary', 'white'),
    font: cssVar('--ff-body', 'serif'),
  };
}

/** Medidas en px CSS (se pintan a la escala del lienzo). Texto de 18 px: nunca menos de 16 (D98). */
export const LABEL = { band: 96, margin: 16, chip: 40, font: 18, pad: 14, gap: 10, fade: 0.55, radius: 4 } as const;

/** El texto entero si cabe; si no, recortado con puntos suspensivos. */
export function fitText(text: string, maxWidth: number, measure: (text: string) => number): string {
  if (measure(text) <= maxWidth) return text;
  for (let end = text.length - 1; end > 0; end -= 1) {
    const cut = `${text.slice(0, end).trimEnd()}…`;
    if (measure(cut) <= maxWidth) return cut;
  }
  return '…';
}

/** Flecha «↗» dentro de un cuadrado de lado `size` centrado en (x, y). */
function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, scale: number) {
  const a = size * 0.16;
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - a, y + a);
  ctx.lineTo(x + a, y - a);
  ctx.moveTo(x - a * 0.35, y - a);
  ctx.lineTo(x + a, y - a);
  ctx.lineTo(x + a, y + a * 0.35);
  ctx.stroke();
}

/** Placa rellena con esquinas redondeadas (de esquinas rectas donde no hay roundRect, Safari < 16). */
function plate(ctx: CanvasRenderingContext2D, box: readonly [number, number, number, number], radius: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(...box, radius);
  else ctx.rect(...box);
  ctx.fill();
}

/** Pinta la franja de una tarjeta de `width` px CSS en `canvas`, a `scale` (el pixel ratio). */
export function paintLabel(canvas: HTMLCanvasElement, label: string, palette: LabelPalette, width: number, scale: number): void {
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.round(LABEL.band * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const [w, h] = [canvas.width, canvas.height];
  const [m, size, pad] = [LABEL.margin * scale, LABEL.chip * scale, LABEL.pad * scale];
  ctx.clearRect(0, 0, w, h);
  // Degradado: el papel, enmascarado de transparente (arriba) a 0,55 (abajo).
  ctx.fillStyle = palette.fade;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-in';
  const mask = ctx.createLinearGradient(0, 0, 0, h);
  mask.addColorStop(0, 'transparent');
  mask.addColorStop(1, palette.fade);
  ctx.globalAlpha = LABEL.fade;
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  const top = h - m - size;
  ctx.font = `400 ${LABEL.font * scale}px ${palette.font}`;
  const room = w - 2 * m - size - LABEL.gap * scale - 2 * pad;
  const text = fitText(label, room, (value) => ctx.measureText(value).width);
  plate(ctx, [m, top, ctx.measureText(text).width + 2 * pad, size], LABEL.radius * scale, palette.chip);
  ctx.fillStyle = palette.ink;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, m + pad, top + size / 2);
  plate(ctx, [w - m - size, top, size, size], LABEL.radius * scale, palette.mark);
  ctx.strokeStyle = palette.markInk;
  arrow(ctx, w - m - size / 2, top + size / 2, size, scale);
}
