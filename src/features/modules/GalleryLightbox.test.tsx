import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Photo } from '../../lib/apiTypes';
import { GalleryLightbox } from './GalleryLightbox';

// El visor de la Galería y de las fichas: la foto del tamaño que se ve, decodificada sin frenar la página.
const photo = (id: number, url: string): Photo => ({ id, url, alt_text: `Foto ${id}`, orden: id, autor: 'Autor', licencia: 'CC BY-SA 4.0' });
const open = (item: Photo) => render(<GalleryLightbox photos={[item]} index={0} onIndex={() => undefined} place="Lugar" />);
/** El panel ancho del modal mide 48rem con 1,5rem de margen interior, dentro de 1rem de margen: 720 px. */
const SIZES = '(min-width: 800px) 720px, calc(100vw - 80px)';

describe('visor de fotos', () => {
  it('las de Commons tienen versión de 640 y de 1280 px: el navegador pide la que necesita su ancho', () => {
    open(photo(1, '/assets/photos/lugares/campus-tagaste-1280.webp'));
    const img = screen.getByRole('img', { name: 'Foto 1' });
    expect(img).toHaveAttribute('srcset', '/assets/photos/lugares/campus-tagaste-640.webp 640w, /assets/photos/lugares/campus-tagaste-1280.webp 1280w');
    expect(img).toHaveAttribute('sizes', SIZES);
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('las de Mapillary solo existen a 1024 px: se piden tal cual, sin inventar otras versiones', () => {
    open(photo(2, '/assets/photos/mapillary/1058964018263715-1024.webp'));
    const img = screen.getByRole('img', { name: 'Foto 2' });
    expect(img).toHaveAttribute('src', '/assets/photos/mapillary/1058964018263715-1024.webp');
    expect(img).not.toHaveAttribute('srcset');
    expect(img).toHaveAttribute('decoding', 'async');
  });
});
