import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '../test/mockApi';
import { renderRoute, setViewport } from '../test/renderRoute';

// Una página que falla al renderizar, como cualquier error inesperado (H31).
vi.mock('../features/pages/HelpPage', () => ({
  HelpPage: () => {
    throw new Error('fallo de prueba');
  },
}));

beforeEach(() => {
  setViewport(true);
  mockApi({});
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('Manejo de errores en todas las rutas (H31)', () => {
  it('un error en una página muestra un mensaje amable, con el menú y un botón para recargar', async () => {
    renderRoute('/ayuda');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Algo salió mal al mostrar esta sección');
    expect(screen.getByRole('button', { name: 'Recargar la página' })).toBeInTheDocument();
    expect(screen.queryByText(/Unexpected Application Error/)).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /principal|menú/i })).toBeInTheDocument();
  });

  it('las demás rutas siguen funcionando', async () => {
    renderRoute('/creadora');
    expect(await screen.findByRole('heading', { level: 1, name: /Creadora/ })).toBeInTheDocument();
  });
});
