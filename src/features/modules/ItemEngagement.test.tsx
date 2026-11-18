import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { AUTH_REQUIRED } from '../../test/authFixtures';
import { barberiaRoutes } from '../../test/engagementFixtures';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

async function openDetail() {
  renderRoute('/categorias/barberias?panel=abierto');
  await userEvent.click(await screen.findByRole('button', { name: 'Ver detalle de Barbería Kings' }));
  return screen.findByRole('dialog', { name: 'Barbería Kings' });
}

describe('Calificaciones en la ficha', () => {
  it('muestra el promedio con estrellas y las reseñas', async () => {
    mockApi(barberiaRoutes(() => ({ status: 201, body: {} })));
    const dialog = await openDetail();

    expect(await within(dialog).findByRole('img', { name: '4,25 de 5 estrellas' })).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: '4,5 de 5 estrellas' })).toBeInTheDocument();
    expect(within(dialog).getByText('2 calificaciones')).toBeInTheDocument();
    expect(within(dialog).getByText('Muy buen corte')).toBeInTheDocument();
  });

  it('valida con zod y envía estrellas en pasos de 0,5', async () => {
    let sent: unknown;
    mockApi(barberiaRoutes((init) => ((sent = JSON.parse(String(init?.body))), { status: 201, body: {} })));
    const dialog = await openDetail();

    await userEvent.click(await within(dialog).findByRole('button', { name: 'Enviar calificación' }));
    expect(await within(dialog).findByText('Elige de 0,5 a 5 estrellas')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('radio', { name: '4,5 estrellas' }));
    await userEvent.type(within(dialog).getByLabelText('Comentario (opcional)'), 'Excelente');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar calificación' }));

    expect(await within(dialog).findByText('¡Gracias! Tu calificación quedó registrada.')).toBeInTheDocument();
    expect(sent).toEqual({ estrellas: 4.5, comentario: 'Excelente', autor_nombre: null });
  });

  it('sin sesión pide iniciarla en lugar del formulario', async () => {
    mockApi(barberiaRoutes(() => AUTH_REQUIRED, undefined, null));
    const dialog = await openDetail();

    expect(await within(dialog).findByText(/Para calificar necesitas iniciar sesión/)).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Enviar calificación' })).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByRole('dialog', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('si la sesión vence (401) al calificar abre el diálogo', async () => {
    mockApi(barberiaRoutes(() => AUTH_REQUIRED));
    const dialog = await openDetail();

    await userEvent.click(await within(dialog).findByRole('radio', { name: '5 estrellas' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar calificación' }));

    expect(await screen.findByRole('dialog', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });
});

describe('Galería y visor', () => {
  it('abre el visor, navega con flechas y Escape cierra solo el visor', async () => {
    mockApi(barberiaRoutes(() => ({ body: {} })));
    const dialog = await openDetail();
    const thumbs = await within(dialog).findAllByRole('button', { name: /Ampliar foto de Barbería Kings/ });

    await userEvent.click(thumbs[0] as HTMLElement);
    const viewer = (await screen.findAllByRole('dialog', { name: 'Barbería Kings' })).at(-1) as HTMLElement;
    expect(within(viewer).getByText('Foto: Ana')).toBeInTheDocument();
    expect(within(viewer).getByRole('link', { name: 'Licencia CC BY 4.0' })).toHaveAttribute('rel', 'noopener noreferrer');

    await userEvent.keyboard('{ArrowRight}');
    expect(within(viewer).getByText('2 de 2')).toBeInTheDocument();
    expect(within(viewer).getByRole('img', { name: 'Sillas del local' })).toBeInTheDocument();
    const { default: axe } = await import('axe-core');
    const audit = await axe.run(viewer, { rules: { 'color-contrast': { enabled: false } } });
    expect(audit.violations.map((v) => v.id)).toEqual([]);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(1));
  });

  it('sin fotos lo dice y la ficha no tiene violaciones de axe', async () => {
    mockApi(barberiaRoutes(() => ({ body: {} }), []));
    const empty = await openDetail();
    expect(await within(empty).findByText(/^Sin foto con licencia todavía/)).toBeInTheDocument();
    const { default: axe } = await import('axe-core');
    const result = await axe.run(empty, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
