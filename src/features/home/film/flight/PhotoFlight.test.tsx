import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhotoFlight } from './PhotoFlight';

// N = 9: las 8 del carrusel en su orden y Campus Tagaste, de photos/lugares.
const IDS = ['biblioteca-exterior', 'vista-desde-biblioteca', 'biblioteca-interior', 'biblioteca-fachada',
  'biblioteca-entrada', 'tintal-plaza', 'hacienda-el-tintal', 'avenida-el-tintal', 'campus-tagaste'];
const SRCS = IDS.map((id) => `/assets/photos/${id === 'campus-tagaste' ? 'lugares' : 'carrusel'}/${id}-1280.webp`);
const ALTS = [
  'Fachada blanca de la Biblioteca Pública El Tintal con ventanas redondas, palmas y una plaza de ladrillo.',
  'Terraza de la biblioteca al atardecer, con las torres de apartamentos de El Tintal al fondo.',
  'Sala de lectura de la biblioteca con claraboya, estanterías de libros y sillas rojas.',
  'Fachada de la biblioteca con sus volúmenes escalonados, palmas y una franja de césped.',
];
const section = () => screen.getByRole('region', { name: 'Fotos de El Tintal' });
const cards = () => [...section().querySelectorAll<HTMLElement>('[data-flight="card"]')];
const photos = () => cards().map((card) => card.querySelector('img') as HTMLImageElement);

describe('Vuelo entre fotos (capítulo 2): contenido y accesibilidad', () => {
  it('es una sección con nombre que declara su capítulo y el tono noche; sobre las fotos el header va sólido', () => {
    render(<PhotoFlight />);
    expect(section().tagName).toBe('SECTION');
    expect(section()).toHaveAttribute('data-chapter', '2');
    expect(section()).toHaveAttribute('data-tone', 'noche');
    expect(section()).not.toHaveAttribute('data-header-float'); // tras un header transparente pasarían fotos claras
  });

  it('muestra las 9 fotos en su orden, cada una con su texto alternativo y en diferido', () => {
    render(<PhotoFlight />);
    expect(photos().map((photo) => photo.getAttribute('alt')).slice(0, 4)).toEqual(ALTS);
    expect(photos().every((photo) => (photo.getAttribute('alt') ?? '').length > 20)).toBe(true);
    expect(photos().map((photo) => photo.getAttribute('src'))).toEqual(SRCS);
    expect(photos().every((photo) => photo.getAttribute('loading') === 'lazy')).toBe(true);
    for (const alt of ALTS) expect(screen.getByAltText(alt)).toBeInTheDocument();
  });

  it('el fondo es una de las 9, con alt vacío, dentro del recuadro fijo y fuera del subárbol de la cámara', () => {
    render(<PhotoFlight />);
    const backdrops = [...section().querySelectorAll<HTMLImageElement>('img[alt=""]')];
    expect(backdrops).toHaveLength(1);
    expect(SRCS).toContain(backdrops[0]?.getAttribute('src'));
    expect(backdrops[0]?.closest('[data-flight="sticky"]')).not.toBeNull();
    expect(backdrops[0]?.closest('.flight__camera')).toBeNull();
    expect(section().querySelector('.flight__camera [data-flight="space"]')).not.toBeNull();
    expect(section().querySelectorAll('img')).toHaveLength(10);
  });

  it('solo fotografía: ni leyendas ni textos encima', () => {
    render(<PhotoFlight />);
    expect(section().textContent).toBe('');
  });

  it('el recorrido mide N + 1 pantallas; las tarjetas alternan de lado y repiten sus proporciones', () => {
    render(<PhotoFlight />);
    expect(section().style.getPropertyValue('--flight-n')).toBe('9');
    expect(cards().map((card) => card.dataset.side)).toEqual(['left', 'right', 'left', 'right', 'left', 'right', 'left', 'right', 'left']);
    expect(cards().map((card) => card.style.getPropertyValue('--flight-ratio'))).toEqual(
      ['1.15', '0.82', '1.45', '0.82', '1.15', '0.82', '1.45', '0.82', '1.15'],
    );
    expect(cards().every((card) => card.parentElement?.dataset.flight === 'space')).toBe(true);
  });
});
