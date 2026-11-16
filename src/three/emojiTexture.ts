import { CanvasTexture, SRGBColorSpace } from 'three';
import { mapColor } from '../lib/cssToken';
import type { MarkerShape } from '../lib/markerShape';

const SIZE = 64;
const R = SIZE / 2 - 4;

/** Contorno de la placa (D82, opción B): círculo, cuadrado o rombo según el grupo. */
function plate(ctx: CanvasRenderingContext2D, shape: MarkerShape): void {
  const c = SIZE / 2;
  ctx.beginPath();
  if (shape === 'cuadrado') ctx.rect(c - R + 3, c - R + 3, 2 * (R - 3), 2 * (R - 3));
  else if (shape === 'rombo') {
    ctx.moveTo(c, c - R);
    ctx.lineTo(c + R, c);
    ctx.lineTo(c, c + R);
    ctx.lineTo(c - R, c);
    ctx.closePath();
  } else ctx.arc(c, c, R, 0, Math.PI * 2);
}

/**
 * Placa del marcador (D82): placa blanca con aro verde hoja (círculo, cuadrado o rombo) y el
 * emoji del módulo, hecha en un canvas local (sin imágenes externas).
 */
export function emojiTexture(emoji: string, shape: MarkerShape = 'circulo'): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    plate(ctx, shape);
    ctx.fillStyle = mapColor('via');
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = mapColor('hoja');
    ctx.stroke();
    ctx.font = `${SIZE * (shape === 'rombo' ? 0.4 : 0.5)}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, SIZE / 2, SIZE / 2 + 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
