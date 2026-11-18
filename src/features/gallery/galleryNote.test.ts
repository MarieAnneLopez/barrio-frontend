import { describe, expect, it } from 'vitest';
import i18n from '../../i18n/i18n';
import { CAROUSEL_PHOTOS } from '../home/carouselPhotos';

// La nota sobre la cinta dice de dónde salen de verdad sus fotos: casi todas de Mapillary (D77, todas
// CC BY-SA 4.0) y el resto de Wikimedia Commons (D66: los lugares y las vistas del barrio, con estas
// licencias). Decía «solo de Wikimedia Commons».
const COMMONS_LICENSES = new Set(CAROUSEL_PHOTOS.map((photo) => photo.license));

describe('nota de la Galería General', () => {
  it.each(['es', 'en'])('en %s nombra Mapillary y Wikimedia Commons con sus licencias reales', (lang) => {
    const note = i18n.getFixedT(lang)('galleryPage.note');
    expect(note).toMatch(/Mapillary \(CC BY-SA 4\.0\)/);
    expect(note).toContain('Wikimedia Commons');
    expect([...COMMONS_LICENSES].sort()).toEqual(['CC BY 4.0', 'CC BY-SA 4.0']);
    for (const license of COMMONS_LICENSES) expect(note).toContain(license);
  });
});
