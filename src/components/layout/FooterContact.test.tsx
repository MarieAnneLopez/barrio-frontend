import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => setViewport(true));

describe('Contacto en el pie de todas las páginas (H32)', () => {
  it.each(['/', '/historia', '/ayuda', '/categorias/barberias'])('%s muestra correo e Instagram', async (path) => {
    renderRoute(path);
    const contact = await screen.findByRole('region', { name: 'Escríbele a Marie' });
    const mail = within(contact).getByRole('link', { name: /marieanelopezpoveda@gmail\.com/ });
    expect(mail).toHaveAttribute('href', 'mailto:marieanelopezpoveda@gmail.com');
    const insta = within(contact).getByRole('link', { name: /Instagram/ });
    expect(insta).toHaveAttribute('href', 'https://www.instagram.com/marieane_lop/');
    for (const link of [mail, insta]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});
