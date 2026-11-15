import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { useChatStore } from '../../store/chatStore';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

beforeEach(() => {
  setViewport(true);
  act(() => {
    useChatStore.getState().reset();
    useA11yStore.setState({ reducedMotion: true });
  });
});

describe('Secciones en construcción y límite del chat (D62)', () => {
  it.each([
    ['/mapa', 'La maqueta 3D del barrio ya está en el Inicio', 'Ir a Inicio'],
    ['/galeria', 'cada módulo muestra la galería', 'Ir a Zonas Verdes'],
  ])('%s dice que está en construcción y lleva a lo que ya existe', async (path, text, link) => {
    mockApi({});
    renderRoute(path);
    expect(await screen.findByText('En construcción')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: link })).toBeInTheDocument();
  });

  it('si el servidor limita los mensajes, el chat lo dice sin inventar respuesta', async () => {
    mockApi({ '/chat': { status: 429, body: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'x' } } } });
    renderRoute('/');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir chat con Mini Marie' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'colegios{Enter}');
    await waitFor(() => expect(screen.getByRole('log')).toHaveTextContent('Llegaste al límite de mensajes'));
    expect(screen.queryByText(/Sin conexión con el servidor/)).not.toBeInTheDocument();
  });
});
