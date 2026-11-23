import { CanvasTexture, SRGBColorSpace, Texture } from 'three';
import type { HingeFace } from './types';

function yearTexture(year: string, surface: string, ink: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D no disponible');
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '400 420px Anton, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.fillText(year, canvas.width / 2, canvas.height / 2, canvas.width * 0.9);
  return new CanvasTexture(canvas);
}

export function createFaceLibrary(refresh: () => void, unavailable: () => void) {
  const entries = new Map<string, { texture?: Texture }>();
  let font: Promise<unknown> | undefined;

  async function load(face: HingeFace, key: string, surface: string, ink: string) {
    const entry: { texture?: Texture } = {};
    entries.set(key, entry);
    try {
      let image: HTMLImageElement | undefined;
      if (face.imageSrc) {
        const source = new Image();
        source.crossOrigin = 'anonymous';
        source.src = face.imageSrc;
        image = await source.decode().then(() => source, () => undefined);
      }
      if (!image) {
        font ??= document.fonts.load('400 420px Anton', '0123456789').catch(() => document.fonts.ready);
        await font;
      }
      if (entries.get(key) !== entry) return;
      entry.texture = image ? new Texture(image) : yearTexture(face.year, surface, ink);
      entry.texture.colorSpace = SRGBColorSpace;
      entry.texture.needsUpdate = true;
      refresh();
    } catch {
      if (entries.get(key) === entry) unavailable();
    }
  }

  let keys: string[] = [];
  return {
    sync(faces: ReadonlyArray<HingeFace>, surface: string, ink: string) {
      keys = faces.map(face => JSON.stringify([face.year, face.imageSrc, surface, ink]));
      const keep = new Set(keys);
      for (const [key, entry] of entries) {
        if (keep.has(key)) continue;
        entries.delete(key);
        entry.texture?.dispose();
      }
      keys.forEach((key, i) => {
        const face = faces[i];
        if (face && !entries.has(key)) void load(face, key, surface, ink);
      });
    },
    texture(index: number) {
      const key = keys[index];
      return key === undefined ? undefined : entries.get(key)?.texture;
    },
    dispose() {
      entries.forEach(entry => entry.texture?.dispose());
      entries.clear();
    },
  };
}
