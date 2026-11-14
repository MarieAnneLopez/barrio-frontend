import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n/i18n';
import type { RemoteReply } from '../../lib/chatApi';
import { useA11yStore } from '../../store/a11yStore';
import { useAvatarStore } from '../../store/avatarStore';
import { useChatStore } from '../../store/chatStore';
import { mockApi, type MockResponse } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

const REPLY: RemoteReply = {
  intent: 'mejor_calificado', expresion: 'jump', modelo: 'analitico', experto: null,
  texto: 'Lo mejor calificado en Centros Educativos es Colegio Alfa: 4,5 de 5 estrellas con 2 calificaciones.',
  acciones: [{ ruta: '/categorias/centros-educativos', etiqueta: 'Centros Educativos' }],
  sugerencias: ['¿Qué queda más cerca?', 'Cuéntame la historia del barrio'],
};

const sent: unknown[] = [];
const chatRoute = (answer: MockResponse) => ({
  '/chat': (_url: URL, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)));
    return answer;
  },
});

async function ask(text: string) {
  await userEvent.click(screen.getByRole('button', { name: /chat con Mini Marie|chat with Mini Marie/ }));
  await userEvent.type(screen.getByRole('textbox'), `${text}{Enter}`);
}

beforeEach(() => {
  sent.length = 0;
  setViewport(true);
  act(() => {
    useChatStore.getState().reset();
    useAvatarStore.setState({ state: 'idle' });
    useA11yStore.setState({ reducedMotion: true });
  });
});

afterEach(async () => {
  await act(() => i18n.changeLanguage('es'));
  act(() => useA11yStore.getState().reset());
});

describe('Chat conectado a /api/v1/chat', () => {
  it('envía mensaje, idioma y página; muestra el texto, la acción, las sugerencias y el gesto', async () => {
    mockApi(chatRoute({ body: REPLY }));
    const { router } = renderRoute('/ranking');
    await ask('¿Cuál es el mejor colegio?');

    const log = screen.getByRole('log');
    await waitFor(() => expect(log).toHaveTextContent('Colegio Alfa: 4,5 de 5 estrellas'));
    expect(sent).toEqual([{ mensaje: '¿Cuál es el mejor colegio?', idioma: 'es', ruta: '/ranking' }]);
    expect(useAvatarStore.getState().state).toBe('jump');
    expect(screen.getByRole('button', { name: 'Cuéntame la historia del barrio' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Ir a Centros Educativos' }));
    expect(router.state.location.pathname).toBe('/categorias/centros-educativos');
  });

  it('en inglés pide la respuesta en inglés', async () => {
    await act(() => i18n.changeLanguage('en'));
    mockApi(chatRoute({ body: { ...REPLY, expresion: 'alert' } }));
    renderRoute('/');
    await ask('Any thefts?');
    await waitFor(() => expect(sent).toEqual([{ mensaje: 'Any thefts?', idioma: 'en', ruta: '/' }]));
    await waitFor(() => expect(useAvatarStore.getState().state).toBe('alert'));
  });

  it('mientras piensa lo anuncia y no envía otra pregunta', async () => {
    let release: (value: MockResponse) => void = () => undefined;
    const slow = new Promise<MockResponse>((resolve) => { release = resolve; });
    mockApi({ '/chat': (_url: URL, init?: RequestInit) => {
      sent.push(JSON.parse(String(init?.body)));
      return slow;
    } });
    renderRoute('/');
    await ask('hola');
    expect(await screen.findByText('Mini Marie está buscando en los datos del barrio…')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), 'otra{Enter}');
    expect(sent).toHaveLength(1);
    await act(async () => release({ body: { ...REPLY, texto: '¡Hola!' } }));
    await waitFor(() => expect(screen.queryByText(/está buscando/)).not.toBeInTheDocument());
  });

  it('sin servidor responde con el repertorio local y lo dice', async () => {
    mockApi(chatRoute({ status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'x' } } }));
    renderRoute('/');
    await ask('¿Qué colegios hay?');
    expect(await screen.findByText('Sin conexión con el servidor: respuesta del repertorio local.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a Centros Educativos' })).toBeInTheDocument();
  });
});
