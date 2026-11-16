import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RemoteReply } from '../../lib/chatApi';
import { useA11yStore } from '../../store/a11yStore';
import { useChatStore } from '../../store/chatStore';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';

// Pedido de Marie (D82): el chat responde siempre; nunca habla de servidor, conexión ni repertorio.
const REPLY: RemoteReply = {
  intent: 'x', expresion: 'idle', modelo: 'generativo', experto: null, texto: '', acciones: [], sugerencias: [],
};
const sent: unknown[] = [];
const chatRoute = (answer: { status: number; body: unknown }) => ({
  '/chat': (_url: URL, init?: RequestInit) => {
    sent.push(init?.body);
    return answer;
  },
});

async function ask(text: string) {
  await userEvent.click(screen.getByRole('button', { name: /chat con Mini Marie/ }));
  await userEvent.type(screen.getByRole('textbox'), `${text}{Enter}`);
}

beforeEach(() => {
  sent.length = 0;
  setViewport(true);
  act(() => {
    useChatStore.getState().reset();
    useA11yStore.setState({ reducedMotion: true });
  });
});

describe('Chat sin API (D82)', () => {
  it('si la API falla, reintenta 2 veces en silencio y responde sin hablar de servidor (D82)', async () => {
    mockApi(chatRoute({ status: 502, body: { error: { code: 'BACKEND_UNAVAILABLE', message: 'x' } } }));
    renderRoute('/');
    await ask('¿Qué colegios hay?');
    expect(await screen.findByRole('link', { name: 'Ir a Centros Educativos' })).toBeInTheDocument();
    expect(sent).toHaveLength(3);
    expect(screen.getByRole('log').textContent).not.toMatch(/servidor|conexión|repertorio/i);
  });

  it('un reintento que sale bien muestra la respuesta del modelo, sin rastro del fallo', async () => {
    let calls = 0;
    mockApi({ '/chat': () => (++calls === 1 ? { status: 503, body: {} } : { body: { ...REPLY, texto: 'Hay colegios.' } }) });
    renderRoute('/');
    await ask('¿Qué colegios hay?');
    expect(await screen.findByText('Hay colegios.')).toBeInTheDocument();
    expect(calls).toBe(2);
  });

});
