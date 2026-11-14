import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CAROUSEL_PHOTOS } from './carouselPhotos';
import { NeighborhoodCarousel } from './NeighborhoodCarousel';

const visibleSlide = () => screen.getByRole('group', { name: /de 8$/ });
const carousel = () => screen.getByRole('region', { name: 'Fotografías del entorno de El Tintal' });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('NeighborhoodCarousel', () => {
  it('muestra la primera foto local con texto alternativo y crédito', () => {
    render(<NeighborhoodCarousel />);
    const slide = visibleSlide();

    expect(slide).toHaveAccessibleName('1 de 8');
    const image = within(slide).getByRole('img');
    expect(image).toHaveAttribute('src', '/assets/photos/carrusel/biblioteca-exterior-1280.webp');
    expect(image).toHaveAccessibleName(/Fachada blanca de la Biblioteca Pública El Tintal/);
    expect(slide).toHaveTextContent('Foto: ArmandoCasitasS');
    expect(within(slide).getByRole('link', { name: 'Licencia CC BY 4.0' })).toHaveAttribute('target', '_blank');
  });

  it('rota sola y se detiene con el botón de pausa (WCAG 2.2.2)', () => {
    render(<NeighborhoodCarousel />);
    act(() => vi.advanceTimersByTime(6600));
    expect(visibleSlide()).toHaveAccessibleName('2 de 8');

    fireEvent.click(screen.getByRole('button', { name: 'Pausar las fotos' }));
    act(() => vi.advanceTimersByTime(20000));
    expect(visibleSlide()).toHaveAccessibleName('2 de 8');
    expect(screen.getByRole('button', { name: 'Reproducir las fotos' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('flechas, teclado e indicadores cambian de foto', () => {
    render(<NeighborhoodCarousel />);
    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(visibleSlide()).toHaveAccessibleName('2 de 8');
    fireEvent.keyDown(carousel(), { key: 'ArrowLeft' });
    fireEvent.keyDown(carousel(), { key: 'ArrowLeft' });
    expect(visibleSlide()).toHaveAccessibleName('8 de 8');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar la foto 6' }));
    expect(screen.getByRole('button', { name: 'Mostrar la foto 6' })).toHaveAttribute('aria-current', 'true');
  });

  it('el foco dentro detiene la rotación y anuncia los cambios', () => {
    render(<NeighborhoodCarousel />);
    fireEvent.focus(screen.getByRole('button', { name: 'Foto siguiente' }));
    act(() => vi.advanceTimersByTime(20000));
    expect(visibleSlide()).toHaveAccessibleName('1 de 8');
    expect(carousel().querySelector('[aria-live]')).toHaveAttribute('aria-live', 'polite');
  });

  it('todas las fotos tienen autor, licencia libre y fuente en Commons', () => {
    expect(CAROUSEL_PHOTOS).toHaveLength(8);
    for (const photo of CAROUSEL_PHOTOS) {
      expect(photo.author).not.toBe('');
      expect(photo.license).toMatch(/^CC (BY|BY-SA|0)/);
      expect(photo.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });
});

describe('axe', () => {
  it('el carrusel no tiene violaciones (incluido aria-hidden con enlaces)', async () => {
    vi.useRealTimers();
    const { default: axe } = await import('axe-core');
    const { container } = render(<main><NeighborhoodCarousel /></main>);

    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
