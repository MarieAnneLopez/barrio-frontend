import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GalleryPhoto } from '../../lib/apiTypes';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

const photo = (id: number, extra: Partial<GalleryPhoto> = {}): GalleryPhoto => ({
  id, url: `/assets/photos/mapillary/${id}-1024.webp`, alt_text: `Vista a nivel de calle ${id}`,
  alt_text_en: `Street-level view ${id}`, orden: 0, autor: 'cgalindop', licencia: 'CC BY-SA 4.0',
  source_ref: `https://www.mapillary.com/app/?pKey=${id}`, categoria_slug: 'estado-calles', objeto_id: id,
  nombre: `Calle ${id}`, ...extra,
});

describe('Créditos de fotos (H35)', () => {
  it('reúne todas las páginas y enlaza autor, licencia y original de Mapillary', async () => {
    setViewport(true);
    mockApi({
      '/fotos': (url: URL) => {
        const page = Number(url.searchParams.get('page'));
        const items = page === 1 ? [photo(1)] : [photo(2, { autor: 'Ana', licencia: 'CC BY 4.0',
          source_ref: 'https://commons.wikimedia.org/wiki/File:B.jpg' })];
        return { body: { items, total: 2, page, size: 100, pages: 2 } };
      },
    });
    renderRoute('/creditos-fotos');

    expect(await screen.findByText('2 fotos')).toBeInTheDocument();
    const first = screen.getByRole('link', { name: 'Calle 1' }).closest('li') as HTMLElement;
    expect(within(first).getByRole('link', { name: 'Foto: cgalindop' })).toHaveAttribute(
      'href', 'https://www.mapillary.com/app/user/cgalindop');
    expect(within(first).getByRole('link', { name: 'Licencia CC BY-SA 4.0' })).toHaveAttribute(
      'href', 'https://creativecommons.org/licenses/by-sa/4.0');
    expect(within(first).getByRole('link', { name: 'Ver en Mapillary' })).toHaveAttribute(
      'target', '_blank');
    const second = screen.getByRole('link', { name: 'Calle 2' }).closest('li') as HTMLElement;
    expect(within(second).getByText('Foto: Ana')).toBeInTheDocument(); // Commons: sin perfil
    expect(within(second).getByRole('link', { name: 'Ver en Wikimedia Commons' })).toBeInTheDocument();
  });
});
