import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n/i18n';
import { BARBERIA, barberiaRoutes } from '../../test/engagementFixtures';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

const OFFICIAL = {
  ...BARBERIA, source_type: 'sitio_oficial', source_ref: 'https://tintalplaza.com/categoria-belleza-y-salud/',
  descripcion_es: 'Barbería en el C. C. Tintal Plaza, local 117.',
  descripcion_en: 'Barbershop in the Tintal Plaza mall, unit 117.',
};

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
  mockApi({ ...barberiaRoutes(() => ({ status: 201, body: {} })), '/barberias/3': { body: OFFICIAL } });
});

afterEach(async () => {
  await act(() => i18n.changeLanguage('es'));
});

describe('Ficha con descripción verificada y sitio oficial (H35)', () => {
  it('muestra la descripción en español y la fuente «sitio oficial»', async () => {
    renderRoute('/categorias/barberias');
    await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle de Barbería Kings' }));
    const dialog = await screen.findByRole('dialog', { name: 'Barbería Kings' });
    expect(await within(dialog).findByText('Barbería en el C. C. Tintal Plaza, local 117.')).toBeInTheDocument();
    expect(within(dialog).getByText('Sitio oficial del establecimiento')).toBeInTheDocument();
  });

  it('en inglés muestra la descripción en inglés', async () => {
    await act(() => i18n.changeLanguage('en'));
    renderRoute('/categorias/barberias');
    await userEvent.click(await screen.findByRole('button', { name: /Barbería Kings/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Barbería Kings' });
    expect(await within(dialog).findByText('Barbershop in the Tintal Plaza mall, unit 117.')).toBeInTheDocument();
    expect(within(dialog).queryByText(/C\. C\. Tintal Plaza, local 117/)).toBeNull();
  });
});
