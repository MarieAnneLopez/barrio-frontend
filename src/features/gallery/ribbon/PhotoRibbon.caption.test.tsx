import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountRibbon, PHOTOS } from './ribbonHarness';

vi.mock('three', async (original) => (await import('./ribbonGlKit')).fakeThree(original));
afterEach(() => vi.restoreAllMocks());

describe('PhotoRibbon con WebGL: el crédito de la foto centrada, siempre a la vista', () => {
  it('bajo la cinta: texto, autor, licencia y fuente de la foto del centro; sigue a la que se centra', async () => {
    const { hit, advance } = await mountRibbon();
    expect(screen.getByText('Vista 1 de Calle 6.')).toBeInTheDocument();
    expect(screen.getByText('Foto: Autor1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Licencia CC BY-SA 4.0' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver en Mapillary' })).toHaveAttribute('href', PHOTOS[0]?.photo.source_ref);
    act(() => hit(0).focus());
    fireEvent.keyDown(hit(0), { key: 'ArrowRight' });
    advance();
    expect(screen.getByText('Foto: Autor2')).toBeInTheDocument();
    expect(screen.queryByText('Foto: Autor1')).toBeNull();
  });

  it('si la foto es de un lugar enlaza a su módulo, y el aviso de créditos no promete lo que no hay', async () => {
    await mountRibbon({ photos: PHOTOS.map((photo, at) => ({ ...photo, module: at === 0 ? 'estaciones-transporte' : null })) });
    expect(screen.getByRole('link', { name: /Ver en Estaciones/ })).toHaveAttribute('href', '/categorias/estaciones-transporte');
    expect(screen.getByText(/al ampliarla; las de los lugares, también en/)).toBeInTheDocument();
  });

  it('cada botón se llama con su etiqueta real y se distingue por su posición, aunque la etiqueta se repita', async () => {
    const { group } = await mountRibbon({ photos: PHOTOS.map((photo) => ({ ...photo, label: 'Biblioteca El Tintal' })) });
    const buttons = within(group()).getAllByRole('button', { name: 'Biblioteca El Tintal' });
    expect(buttons).toHaveLength(PHOTOS.length);
    expect(buttons[0]).toHaveAccessibleDescription(`1 de ${PHOTOS.length}`);
    expect(buttons[2]).toHaveAccessibleDescription(`3 de ${PHOTOS.length}`);
  });
});
