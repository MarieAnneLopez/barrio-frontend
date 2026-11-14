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

const BASE = '/assets/photos/carrusel';

/** srcset responsivo (WebP 640 y 1280 px) generado en H11 con sharp. */
export function photoSources(id: string) {
  return {
    src: `${BASE}/${id}-1280.webp`,
    srcSet: `${BASE}/${id}-640.webp 640w, ${BASE}/${id}-1280.webp 1280w`,
  };
}
