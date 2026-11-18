// Fotos de la cinta: las mismas de la Galería General, en su orden (las de los lugares, como llegan de
// la API, y luego las vistas del barrio que no están ya en un lugar), con sus etiquetas reales.
import type { GalleryPhoto, Photo } from '../../../lib/apiTypes';
import { photoAlt, photoSet } from '../../../lib/photoUrls';
import { photoSources } from '../../home/carouselPhotos';
import { neighborhoodViews } from '../groupPhotos';

export interface RibbonPhoto {
  key: string;
  /** Etiqueta real: el nombre del lugar o el título de la vista. Es también el nombre del botón. */
  label: string;
  alt: string;
  /** Foto grande, para la textura. */
  src: string;
  /** Miniatura con srcset, para la rejilla de respaldo. */
  thumb: { src: string; srcSet?: string };
  /** Lo que abre el visor (con autor, licencia y fuente). */
  photo: Photo;
}

type Translate = (key: string) => string;

export function ribbonPhotos(places: GalleryPhoto[], t: Translate, lang: string): RibbonPhoto[] {
  const own = places.map((photo) => ({
    key: `foto-${photo.id}`, label: photo.nombre, alt: photoAlt(photo, lang), src: photo.url, thumb: photoSet(photo.url), photo,
  }));
  const views = neighborhoodViews(places).map((view, at): RibbonPhoto => {
    const sources = photoSources(view.id);
    const alt = t(`carousel.photos.${view.id}.alt`);
    // Las vistas no vienen de la API: se les da un id negativo, que nunca choca con los de la base.
    const photo: Photo = {
      id: -(at + 1), url: sources.src, alt_text: alt, orden: at, autor: view.author, licencia: view.license, source_ref: view.source,
    };
    return { key: `vista-${view.id}`, label: t(`carousel.photos.${view.id}.caption`), alt, src: sources.src, thumb: sources, photo };
  });
  return [...own, ...views];
}

const LARGE = /-1280\.webp$/;

/** Para la textura basta la versión de 640 px si la tarjeta no ocupa más que eso en píxeles reales. */
export function textureUrl(src: string, devicePixels: number): string {
  return devicePixels <= 640 && LARGE.test(src) ? src.replace(LARGE, '-640.webp') : src;
}
