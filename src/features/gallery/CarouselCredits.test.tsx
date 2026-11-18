import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CAROUSEL_PHOTOS } from '../home/carouselPhotos';
import { CarouselCredits } from './CarouselCredits';

// Todo asset ajeno lleva autor y licencia: las 8 vistas del barrio (vuelo del Inicio y Galería)
// también figuran en Créditos de fotos, con su autor, su licencia y su página de origen.
describe('Créditos: vistas del barrio', () => {
  it('lista cada foto del carrusel con su autor, su licencia y su origen', () => {
    render(<CarouselCredits />);
    const section = screen.getByRole('region', { name: /Vistas del barrio/ });
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(CAROUSEL_PHOTOS.length);
    CAROUSEL_PHOTOS.forEach((photo, i) => {
      const item = within(items[i] as HTMLElement);
      expect(item.getByText(`Foto: ${photo.author}`)).toBeInTheDocument();
      expect(item.getByRole('link', { name: `Licencia ${photo.license}` })).toHaveAttribute('href', expect.stringContaining('creativecommons.org'));
      expect(item.getByRole('link', { name: /Wikimedia Commons/ })).toHaveAttribute('href', photo.source);
    });
  });
});
