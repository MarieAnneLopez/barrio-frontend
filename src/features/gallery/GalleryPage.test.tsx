import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { GalleryPhoto } from '../../lib/apiTypes';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

const COMMONS = 'https://commons.wikimedia.org/wiki/File:Campus.jpg';
const photo = (id: number, url: string, nombre: string, extra: Partial<GalleryPhoto> = {}): GalleryPhoto => ({
  id, url, alt_text: `Foto ${id} de ${nombre}`, orden: id, autor: 'Futbolero', licencia: 'CC BY-SA 4.0',
  source_ref: COMMONS, categoria_slug: 'estaciones-transporte', objeto_id: 85, nombre, ...extra,
});
const PHOTOS = [
  photo(1, '/assets/photos/lugares/campus-tagaste-1280.webp', 'Universidad Agustiniana'),
  photo(2, '/assets/photos/carrusel/biblioteca-exterior-1280.webp', 'Biblioteca El Tintal',
    { objeto_id: 112, autor: 'ArmandoCasitasS', licencia: 'CC BY 4.0' }),
];
const body = (items: GalleryPhoto[]) => ({ body: { items, total: items.length, page: 1, size: 100, pages: 1 } });
/** Sin WebGL (jsdom) la cinta deja su rejilla de respaldo: un botón por foto con su etiqueta real. */
const photosList = async () => screen.findByRole('list', { name: 'Fotos de la galería' });

beforeEach(() => setViewport(true));

describe('Galería General (/galeria, D66)', () => {
  it('reúne las fotos de los lugares y las vistas del barrio, en orden, con etiqueta, texto y crédito', async () => {
    mockApi({ '/fotos': body(PHOTOS) });
    const { container } = renderRoute('/galeria');
    expect(await screen.findByRole('heading', { level: 1, name: 'Galería General' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Lugares y vistas del barrio' })).toBeInTheDocument();
    const buttons = within(await photosList()).getAllByRole('button');
    expect(buttons).toHaveLength(2 + 7); // la de la biblioteca ya está en su lugar
    expect(buttons.slice(0, 3).map((button) => button.textContent)).toEqual([
      'Universidad Agustiniana', 'Biblioteca El Tintal', 'Vista desde la biblioteca hacia el barrio',
    ]);
    const first = buttons[0]?.closest('li') as HTMLElement;
    expect(first.querySelector('img')).toHaveAttribute('src', '/assets/photos/lugares/campus-tagaste-640.webp');
    expect(within(first).getByText('Foto 1 de Universidad Agustiniana')).toBeInTheDocument();
    expect(within(first).getByText('Foto: Futbolero')).toBeInTheDocument();
    expect(within(first).getByRole('link', { name: 'Licencia CC BY-SA 4.0' }))
      .toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0');
    expect(within(first).getByRole('link', { name: 'Ver en Wikimedia Commons' })).toHaveAttribute('href', COMMONS);
    expect(within(first).getByRole('link', { name: /Ver en Estaciones/ })).toHaveAttribute('href', '/categorias/estaciones-transporte');
    const view = buttons[2]?.closest('li') as HTMLElement;
    expect(within(view).queryByRole('link', { name: /^Ver en (?!Wikimedia)/ })).toBeNull(); // las vistas no son de un módulo
    const { default: axe } = await import('axe-core');
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  it('abre el visor de la foto con autor y licencia, y al cerrarlo el foco vuelve a su botón', async () => {
    const user = userEvent.setup();
    mockApi({ '/fotos': body(PHOTOS) });
    renderRoute('/galeria');
    const button = within(await photosList()).getByRole('button', { name: 'Biblioteca El Tintal' });
    await user.click(button);
    const dialog = await screen.findByRole('dialog', { name: 'Biblioteca El Tintal' });
    expect(within(dialog).getByText('Foto: ArmandoCasitasS')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Licencia CC BY 4.0' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button).toHaveFocus();
  });

  it('enlaza a los créditos de todas las fotos junto a la galería', async () => {
    mockApi({ '/fotos': body(PHOTOS) });
    renderRoute('/galeria');
    const heading = await screen.findByRole('heading', { level: 2, name: 'Lugares y vistas del barrio' });
    const section = heading.closest('section') as HTMLElement;
    expect(await within(section).findByRole('link', { name: 'Créditos de fotos' })).toHaveAttribute('href', '/creditos-fotos');
  });

  it('sin fotos de lugares lo dice, y si la API falla deja reintentar; las vistas del barrio siguen', async () => {
    mockApi({ '/fotos': body([]) });
    const first = renderRoute('/galeria');
    expect(await screen.findByText('Todavía no hay fotos de lugares.')).toBeInTheDocument();
    expect(within(await photosList()).getAllByRole('button')).toHaveLength(8);
    first.unmount();
    mockApi({ '/fotos': { status: 500, body: { error: { code: 'X', message: 'x' } } } });
    renderRoute('/galeria');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(within(await photosList()).getAllByRole('button')).toHaveLength(8);
  });
});
