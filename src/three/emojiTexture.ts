import { CanvasTexture, SRGBColorSpace } from 'three';
import { mapColor } from '../lib/cssToken';

const SIZE = 64;

/**
 * Placa del marcador (DISENO-V2 §9): círculo blanco con aro verde hoja (D82) y el emoji del
 * módulo, hecha en un canvas local (sin imágenes externas).
 */
export function emojiTexture(emoji: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fillStyle = mapColor('via');
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = mapColor('hoja');
    ctx.stroke();
    ctx.font = `${SIZE * 0.5}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, SIZE / 2, SIZE / 2 + 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
