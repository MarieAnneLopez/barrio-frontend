// Las N = 9 fotos del vuelo entre fotos (gran actualización): las 4 de siempre, en su orden, las
// otras 4 del carrusel y una de photos/lugares, Campus Tagaste, con su crédito comprobado en
// Wikimedia Commons (también figura en la API de fotos y en Créditos de fotos).
import { CAROUSEL_PHOTOS, type CarouselPhoto, type PhotoFolder } from '../../carouselPhotos';

export interface FlightPhotoItem extends CarouselPhoto {
  /** Carpeta de public/assets/photos con sus WebP de 640 y 1280 px. */
  folder: PhotoFolder;
}

const CAMPUS_TAGASTE: FlightPhotoItem = {
  id: 'campus-tagaste',
  width: 1280,
  height: 576,
  author: 'Futbolero',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
  source: 'https://commons.wikimedia.org/wiki/File:Campus_Tagaste_Uniagustiniana_Bogot%C3%A1.jpg',
  folder: 'lugares',
};

export const FLIGHT_PHOTOS: readonly FlightPhotoItem[] = [
  ...CAROUSEL_PHOTOS.map((photo) => ({ ...photo, folder: 'carrusel' as const })),
  CAMPUS_TAGASTE,
];
