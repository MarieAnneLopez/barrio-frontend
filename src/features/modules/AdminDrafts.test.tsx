import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { ADMIN } from '../../test/authFixtures';
import { BARBERIA, barberiaRoutes } from '../../test/engagementFixtures';
import { mockApi } from '../../test/mockApi';
import { page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

it('permite encontrar un borrador, editar una descripción y republicarlo sin sobrescribir otros campos', async () => {
  setViewport(true);
  const draft = { ...BARBERIA, publicado: false, descripcion_es: 'Texto original', descripcion_en: 'Original text' };
  const saved: unknown[] = [];
  mockApi({
    ...barberiaRoutes(() => ({ body: {} }), undefined, ADMIN),
    '/barberias': page([]),
    '/barberias/admin': () => page([draft]),
    '/barberias/admin/3': () => ({ body: draft }),
    '/barberias/3': (_url, init) => {
      const patch = JSON.parse(String(init?.body));
      saved.push(patch);
      Object.assign(draft, patch);
      return { body: draft };
    },
  });
  renderRoute('/categorias/barberias?panel=abierto');
  await userEvent.click(await screen.findByRole('checkbox', { name: 'Incluir borradores' }));
  const card = (await screen.findByRole('heading', { name: 'Barbería Kings' })).closest('li') as HTMLElement;
  expect(within(card).getByText('Borrador')).toBeVisible();
  expect(within(card).queryByRole('button', { name: 'Ver en el mapa' })).toBeNull();
  await userEvent.click(within(card).getByRole('button', { name: /Ver detalle/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Editar' }));
  const form = within(await screen.findByRole('dialog', { name: 'Editar lugar' }));
  expect(form.getByLabelText('Descripción en español')).toHaveValue('Texto original');
  await userEvent.clear(form.getByLabelText('Descripción en inglés'));
  await userEvent.type(form.getByLabelText('Descripción en inglés'), 'New description');
  await userEvent.selectOptions(form.getByLabelText('Visibilidad'), 'true');
  await userEvent.click(form.getByRole('button', { name: 'Guardar cambios' }));
  await waitFor(() => expect(saved).toEqual([{ descripcion_en: 'New description', publicado: true }]));
  await waitFor(() => expect(screen.queryByText('Borrador')).toBeNull());
});
