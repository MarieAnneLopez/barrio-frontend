import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Photo } from '../../lib/apiTypes';
import { useA11yStore } from '../../store/a11yStore';
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

  it('cierra una vez si se activa movimiento reducido durante la salida', () => {
    const dismiss = vi.fn();
    const thumbnail = document.createElement('button');
    vi.spyOn(thumbnail, 'getBoundingClientRect').mockReturnValue(new DOMRect(20, 30, 80, 60));
    render(<GalleryLightbox
      photos={[photo(1, '/assets/photos/lugares/campus-tagaste-1280.webp')]}
      index={0} onIndex={dismiss} place="Lugar" thumbnail={() => thumbnail}
    />);
    const image = screen.getByRole('img', { name: 'Foto 1' });
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 120, 500, 360));
    const exit = { cancel: vi.fn(), onfinish: null };
    image.animate = vi.fn().mockReturnValue(exit);
    const close = screen.getByRole('button', { name: 'Cerrar' });
    fireEvent.click(close);
    fireEvent.click(close);
    expect(image.animate).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
    act(() => useA11yStore.setState({ reducedMotion: true }));
    expect(exit.cancel).toHaveBeenCalledOnce();
    expect(dismiss).toHaveBeenCalledExactlyOnceWith(null);
    act(() => useA11yStore.setState({ reducedMotion: false }));
  });
});
