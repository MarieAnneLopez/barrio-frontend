import { describe, expect, it } from 'vitest';
import i18n from '../../../i18n/i18n';
import type { GalleryPhoto } from '../../../lib/apiTypes';
import { ribbonPhotos, textureUrl } from './ribbonPhotos';

const photo = (id: number, url: string, nombre: string, extra: Partial<GalleryPhoto> = {}): GalleryPhoto => ({
  id, url, alt_text: `Foto ${id} de ${nombre}`, orden: id, autor: 'Futbolero', licencia: 'CC BY-SA 4.0',
  source_ref: 'https://commons.wikimedia.org/wiki/File:Campus.jpg', categoria_slug: 'estaciones-transporte',
  objeto_id: 85, nombre, ...extra,
});
const PLACES = [
  photo(7, '/assets/photos/lugares/campus-tagaste-1280.webp', 'Universidad Agustiniana'),
  photo(3, '/assets/photos/carrusel/biblioteca-exterior-1280.webp', 'Biblioteca El Tintal',
    { alt_text_en: 'Photo 3 of the library' }),
];

describe('fotos de la cinta: las de la galería, con su cantidad, orden y etiquetas reales', () => {
  it('primero las de los lugares (en el orden de la API) y después las vistas del barrio que no se repiten', () => {
    const list = ribbonPhotos(PLACES, i18n.getFixedT('es'), 'es');
    expect(list).toHaveLength(2 + 7); // la de la biblioteca ya está en su lugar
    expect(list.slice(0, 3).map((item) => item.label)).toEqual([
      'Universidad Agustiniana', 'Biblioteca El Tintal', 'Vista desde la biblioteca hacia el barrio',
    ]);
    expect(list.map((item) => item.label)).not.toContain('Biblioteca Pública El Tintal Manuel Zapata Olivella');
    expect(new Set(list.map((item) => item.key)).size).toBe(list.length);
    expect(new Set(list.map((item) => item.photo.id)).size).toBe(list.length);
  });

  it('cada foto lleva su texto alternativo, su miniatura y, para el visor, autor, licencia y fuente', () => {
    const [first, , view] = ribbonPhotos(PLACES, i18n.getFixedT('es'), 'es');
    expect(first).toMatchObject({ alt: 'Foto 7 de Universidad Agustiniana', src: PLACES[0]?.url });
    expect(first?.thumb.src).toBe('/assets/photos/lugares/campus-tagaste-640.webp');
    expect(first?.photo).toBe(PLACES[0]);
    expect(view?.alt).toMatch(/^Terraza de la biblioteca/);
    expect(view?.photo).toMatchObject({
      url: '/assets/photos/carrusel/vista-desde-biblioteca-1280.webp', alt_text: view?.alt,
      licencia: expect.stringMatching(/^CC BY/), source_ref: expect.stringMatching(/^https:\/\/commons\.wikimedia\.org\//),
    });
    expect(view?.photo.autor).toBeTruthy();
    expect([first?.module, view?.module]).toEqual(['estaciones-transporte', null]); // las vistas no son de un módulo
  });

  it('en inglés: texto alternativo y títulos de las vistas en inglés; el nombre del lugar no se traduce', () => {
    const list = ribbonPhotos(PLACES, i18n.getFixedT('en'), 'en');
    expect(list[1]).toMatchObject({ label: 'Biblioteca El Tintal', alt: 'Photo 3 of the library' });
    expect(list[2]?.label).toBe(i18n.getFixedT('en')('carousel.photos.vista-desde-biblioteca.caption'));
  });

  it('la textura usa la versión de 640 px cuando la tarjeta no necesita más', () => {
    expect(textureUrl('/assets/photos/lugares/a-1280.webp', 600)).toBe('/assets/photos/lugares/a-640.webp');
    expect(textureUrl('/assets/photos/lugares/a-1280.webp', 900)).toBe('/assets/photos/lugares/a-1280.webp');
    expect(textureUrl('/assets/photos/mapillary/1-1024.webp', 300)).toBe('/assets/photos/mapillary/1-1024.webp');
  });
});
