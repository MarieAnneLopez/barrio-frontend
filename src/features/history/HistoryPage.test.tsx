import { act, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n/i18n';
import { useA11yStore } from '../../store/a11yStore';
import { historyRoutes } from '../../test/historyFixtures';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
  useA11yStore.setState({ reducedMotion: true });
});

afterEach(async () => {
  await act(() => i18n.changeLanguage('es'));
});

const timeline = () => screen.findByRole('list', { name: 'Línea de tiempo' });

describe('Historia Local', () => {
  it('muestra los hitos en orden, con fuente y «Por verificar» donde no hay fuente oficial', async () => {
    mockApi(historyRoutes());
    renderRoute('/historia');

    const items = within(await timeline()).getAllByRole('listitem');
    expect(items.map((li) => within(li).getByRole('heading').textContent)).toEqual([
      'De Techo a Ciudad Kennedy', 'El Concejo ratifica el nombre', 'Kennedy se vuelve localidad',
    ]);
    const [first, , last] = items as [HTMLElement, HTMLElement, HTMLElement];
    expect(within(first).queryByText('Por verificar')).not.toBeInTheDocument();
    expect(within(first).getByRole('link', { name: 'bogota.gov.co' })).toHaveAttribute(
      'href', expect.stringContaining('historia-del-poblamiento-de-kennedy'),
    );
    expect(within(last).getByText('Por verificar')).toBeInTheDocument();
  });

  it('cita las fuentes con su tipo y la fecha de consulta', async () => {
    mockApi(historyRoutes());
    renderRoute('/historia');

    const fuentes = await screen.findByRole('region', { name: 'Fuentes' });
    expect(within(fuentes).getByText(/14 de noviembre de 2026/)).toBeInTheDocument();
    expect(within(fuentes).getByRole('link', { name: 'Historia del poblamiento de Kennedy' })).toBeInTheDocument();
    expect(within(fuentes).getByText(/Fuente oficial del Distrito/)).toBeInTheDocument();
    expect(within(fuentes).getByText('No se usan sus fechas.')).toBeInTheDocument();
  });

  it('bandera local con nota «por verificar», cifras y mapa de ubicación', async () => {
    mockApi(historyRoutes());
    renderRoute('/historia');

    expect(screen.getByRole('img', { name: /Bandera de Kennedy: tres franjas/ })).toHaveAttribute(
      'src', '/assets/flags/bandera_kennedy.svg',
    );
    expect(screen.getByRole('note')).toHaveTextContent(/no damos una interpretación heráldica/);
    const cifras = screen.getByRole('region', { name: 'Kennedy y El Tintal en cifras' });
    expect(await within(cifras).findByText('1.104.934', { selector: '.sr-only' })).toBeInTheDocument();
    expect(within(cifras).getByText('38,21', { selector: '.sr-only' })).toBeInTheDocument();
    expect(within(cifras).getByText('3.706', { selector: '.sr-only' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: /El Tintal resaltado/ })).toBeInTheDocument();
  });

  it('en inglés traduce los hitos conocidos y deja el texto de la API si falta', async () => {
    await act(() => i18n.changeLanguage('en'));
    mockApi(historyRoutes());
    renderRoute('/historia');

    const items = within(await screen.findByRole('list', { name: 'Timeline' })).getAllByRole('listitem');
    expect(within(items[0] as HTMLElement).getByRole('heading')).toHaveTextContent('From Techo to Ciudad Kennedy');
    expect(within(items[2] as HTMLElement).getByText('To be verified')).toBeInTheDocument();
  });

  it('con movimiento activo anima sin ocultar el contenido de forma permanente', async () => {
    useA11yStore.setState({ reducedMotion: false });
    mockApi(historyRoutes());
    const { unmount } = renderRoute('/historia');
    expect(within(await timeline()).getAllByRole('listitem')).toHaveLength(3);
    unmount();
  });

  it('no tiene violaciones de axe', async () => {
    const { default: axe } = await import('axe-core');
    mockApi(historyRoutes());
    const { container } = renderRoute('/historia');
    await timeline();
    await screen.findByRole('img', { name: /El Tintal resaltado/ });

    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
