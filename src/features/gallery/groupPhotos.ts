import type { GalleryPhoto } from '../../lib/apiTypes';
import { CAROUSEL_PHOTOS, type CarouselPhoto } from '../home/carouselPhotos';

export interface PlaceGroup {
  key: string;
  slug: string;
  id: number;
  name: string;
  photos: GalleryPhoto[];
}

/** Agrupa las fotos por lugar, en el orden en que llegan (módulo, lugar, orden). */
export function groupByPlace(photos: GalleryPhoto[]): PlaceGroup[] {
  const groups = new Map<string, PlaceGroup>();
  for (const photo of photos) {
    const key = `${photo.categoria_slug}/${photo.objeto_id}`;
    const group = groups.get(key) ?? { key, slug: photo.categoria_slug, id: photo.objeto_id, name: photo.nombre, photos: [] };
    group.photos.push(photo);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** Fotos del carrusel que no están ya en la ficha de algún lugar (vistas generales del barrio). */
export function neighborhoodViews(photos: GalleryPhoto[]): CarouselPhoto[] {
  const used = new Set(photos.map((p) => p.url));
  return CAROUSEL_PHOTOS.filter((p) => !used.has(`/assets/photos/carrusel/${p.id}-1280.webp`));
}
