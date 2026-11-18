// Inventario del carrusel (C15): fotos de Wikimedia Commons guardadas en
// public/assets/photos/carrusel/ (nunca enlazadas en caliente), con autor y licencia.
import credits from './carouselCredits.json';

export interface CarouselPhoto {
  id: string;
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
}

export const CAROUSEL_PHOTOS: readonly CarouselPhoto[] = credits;

/** Carpetas de public/assets/photos con fotos locales en WebP de 640 y 1280 px. */
export type PhotoFolder = 'carrusel' | 'lugares';

/** srcset responsivo (WebP 640 y 1280 px) generado en H11 con sharp. */
export function photoSources(id: string, folder: PhotoFolder = 'carrusel') {
  const base = `/assets/photos/${folder}`;
  return {
    src: `${base}/${id}-1280.webp`,
    srcSet: `${base}/${id}-640.webp 640w, ${base}/${id}-1280.webp 1280w`,
  };
}
