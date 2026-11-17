// Portada tipográfica de cada módulo, generada en un canvas 2D local (sin imágenes externas):
// número en ámbar, una regla fina y el nombre en la display, sobre fondo noche.
import { CanvasTexture, SRGBColorSpace } from 'three';
import { cssVar } from '../../../../lib/cssToken';
import { COVER, type Cover, fitLines, NAME_BOX } from './coverLayout';

export type { Cover };

export interface Palette {
  card: string;
  ink: string;
  accent: string;
  line: string;
  /** Color del fondo de la página: separa la tarjeta de lo que tapa. */
  gap: string;
  display: string;
}

/** Colores y tipografía del design system, leídos al pintar: así las portadas siguen al alto contraste. */
export function readPalette(): Palette {
  return {
    card: cssVar('--bg-primary', 'black'),
    ink: cssVar('--text-primary', 'white'),
    accent: cssVar('--text-highlight', 'white'),
    line: cssVar('--border-ink', 'gray'),
    gap: cssVar('--bg-accent', 'white'),
    display: cssVar('--ff-display', 'sans-serif'),
  };
}

const NUMBER_SIZE = 120;
/** Altura aproximada de las cifras de Anton, en cuerpos, por si el canvas no la sabe medir. */
const DIGIT_HEIGHT = 0.73;
const RULE_GAP = 28;

/** Pinta la portada en `canvas`. Hay que esperar antes a que la display (Anton) esté cargada. */
export function paintCover(canvas: HTMLCanvasElement, cover: Cover, palette: Palette): void {
  canvas.width = COVER.width;
  canvas.height = COVER.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const font = (size: number) => `400 ${size}px ${palette.display}`;

  ctx.fillStyle = palette.card;
  ctx.fillRect(0, 0, COVER.width, COVER.height);

  ctx.textBaseline = 'alphabetic';
  ctx.font = font(NUMBER_SIZE);
  ctx.fillStyle = palette.accent;
  const baseline = COVER.margin + (ctx.measureText(cover.number).actualBoundingBoxAscent ?? NUMBER_SIZE * DIGIT_HEIGHT);
  ctx.fillText(cover.number, COVER.margin, baseline);
  ctx.fillStyle = palette.line;
  ctx.fillRect(COVER.margin, baseline + RULE_GAP, NAME_BOX.width, 2);

  const words = cover.name.toUpperCase().split(/\s+/).filter(Boolean);
  const fit = fitLines(words, (text, size) => {
    ctx.font = font(size);
    return ctx.measureText(text).width;
  }, NAME_BOX);
  ctx.font = font(fit.size);
  ctx.fillStyle = palette.ink;
  const step = fit.size * NAME_BOX.leading;
  fit.lines.forEach((line, row) => {
    ctx.fillText(line, COVER.margin, COVER.height - COVER.margin - (fit.lines.length - 1 - row) * step);
  });
}

/** Textura de una portada sobre su propio canvas; se pinta más tarde, cuando la tarjeta se va a ver. */
export function createCoverTexture(anisotropy: number): CanvasTexture {
  const texture = new CanvasTexture(document.createElement('canvas'));
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}
