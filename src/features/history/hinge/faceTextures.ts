import { CanvasTexture, SRGBColorSpace } from 'three';

export interface CoverStyle {
  surface: string;
  ink: string;
  year: string;
}

const MAX_SIDE = 2048;

/** Cualquier color CSS resuelto (rgb, hex, espacio o coma) a RGB 0–255, vía Canvas 2D. */
export function toRgb(color: string): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [0, 0, 0];
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/**
 * Cara frontal de la cubierta: el fondo de la propia tarjeta y su año en Anton, a la medida de la
 * tarjeta. Una sola textura para las 12 piezas (cada una usa su doceavo de UV). Se crea de nuevo al
 * cambiar de tamaño, porque three no redimensiona una textura ya subida a la GPU.
 */
export function createCoverTexture(width: number, height: number, { surface, ink, year }: CoverStyle) {
  const scale = Math.min(window.devicePixelRatio || 1, 1.75);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.min(MAX_SIDE, Math.round(width * scale)));
  canvas.height = Math.max(1, Math.min(MAX_SIDE, Math.round(height * scale)));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D no disponible');
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const size = Math.min(canvas.height * 0.48, canvas.width * 0.32);
  ctx.font = `400 ${size}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.fillText(year, canvas.width / 2, canvas.height / 2, canvas.width * 0.86);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
