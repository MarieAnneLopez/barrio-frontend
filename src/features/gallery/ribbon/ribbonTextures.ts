// Texturas de las fotos: se piden solo cuando una ranura las va a mostrar, se decodifican fuera del
// cuadro (image.decode) y se guardan unas pocas, las de uso más reciente; las demás se liberan.
// Con mipmaps (lo normal en three con WebGL 2), así las tarjetas que se alejan no titilan.
import { LinearMipmapLinearFilter, SRGBColorSpace, Texture } from 'three';

export interface PhotoTexture {
  texture: Texture;
  /** Ancho / alto de la foto, para encuadrarla en modo cover. */
  aspect: number;
}

export interface PhotoCache {
  /** La textura de `src` si ya está; si no, la pide y devuelve null mientras tanto. */
  get(src: string): PhotoTexture | null;
  readonly size: number;
  dispose(): void;
}

interface Entry {
  image: HTMLImageElement;
  ready: PhotoTexture | null;
  dropped: boolean;
}

/** jsdom y algunos navegadores viejos no tienen image.decode(): se espera a onload. */
function decode(image: HTMLImageElement): Promise<void> {
  if (typeof image.decode === 'function') return image.decode();
  return new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });
}

/** `onReady` avisa cuando llega una foto, para pedir un cuadro. */
export function createPhotoCache(capacity: number, anisotropy: number, onReady: () => void): PhotoCache {
  const entries = new Map<string, Entry>(); // en orden de uso: el primero es el más antiguo
  const drop = (entry: Entry) => {
    entry.dropped = true;
    entry.ready?.texture.dispose();
    entry.image.removeAttribute('src'); // corta la descarga si aún no terminó
  };
  const load = (src: string): Entry => {
    const entry: Entry = { image: new Image(), ready: null, dropped: false };
    entry.image.decoding = 'async';
    entry.image.src = src;
    decode(entry.image).then(() => {
      if (entry.dropped) return;
      const texture = new Texture(entry.image);
      texture.colorSpace = SRGBColorSpace;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = anisotropy;
      texture.needsUpdate = true;
      entry.ready = { texture, aspect: entry.image.naturalWidth / Math.max(1, entry.image.naturalHeight) };
      onReady();
    }, () => undefined); // una foto que no carga se queda con el color de espera
    return entry;
  };

  return {
    get(src) {
      const entry = entries.get(src) ?? load(src);
      entries.delete(src);
      entries.set(src, entry);
      for (const [oldest, stale] of entries) {
        if (entries.size <= capacity) break;
        entries.delete(oldest);
        drop(stale);
      }
      return entry.ready;
    },
    get size() {
      return entries.size;
    },
    dispose() {
      entries.forEach(drop);
      entries.clear();
    },
  };
}
