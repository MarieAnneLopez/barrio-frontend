import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { useAvatarStore } from '../../store/avatarStore';
import { useChatStore } from '../../store/chatStore';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';
import { INACTIVE_MS } from './useChatReactions';

const avatarState = () => useAvatarStore.getState().state;
const openChat = () => userEvent.click(screen.getByRole('button', { name: 'Abrir chat con Mini Marie' }));

beforeEach(() => {
  setViewport(true);
  mockApi({});
  act(() => {
    useChatStore.getState().reset();
    useAvatarStore.setState({ state: 'idle' });
    // Sin typewriter: las respuestas aparecen completas y deterministas.
    useA11yStore.setState({ reducedMotion: true });
  });
});

afterEach(() => {
  vi.useRealTimers();
  act(() => useA11yStore.getState().reset());
});

describe('Chat de Mini Marie', () => {
  it('abre con saludo contextual, foco en el campo y Mini Marie saludando', async () => {
    renderRoute('/preguntas');
    await openChat();

    const panel = screen.getByRole('dialog', { name: 'Mini Marie' });
    expect(panel).toHaveTextContent('Estás en Preguntas Frecuentes');
    expect(screen.getByRole('textbox', { name: 'Escribe tu pregunta' })).toHaveFocus();
    expect(avatarState()).toBe('wave');
    const { violations } = await axe.run(panel);
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(" | ")}`)).toEqual([]);
  });

  it('responde y ofrece una acción rápida que navega al módulo', async () => {
    const { router } = renderRoute('/');
    await openChat();
    await userEvent.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), '¿Qué colegios hay?{Enter}');

    const log = screen.getByRole('log', { name: 'Conversación con Mini Marie' });
    expect(log).toHaveTextContent('Tú: ¿Qué colegios hay?');
    await userEvent.click(screen.getByRole('link', { name: 'Ir a Centros Educativos' }));
    expect(router.state.location.pathname).toBe('/categorias/centros-educativos');
  });

  it('las preguntas sugeridas se envían con un clic', async () => {
    renderRoute('/');
    await openChat();
    await userEvent.click(screen.getByRole('button', { name: '¿Cómo contacto a Marie?' }));
    expect(screen.getByRole('link', { name: 'Ir a Perfil de la Creadora' })).toBeInTheDocument();
  });

  it('Escape cierra el panel y devuelve el foco al lanzador', async () => {
    renderRoute('/');
    await openChat();
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Mini Marie' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir chat con Mini Marie' })).toHaveFocus();
  });

  it('camina hacia la sección nueva y se alerta en el módulo de robos', async () => {
    const { router } = renderRoute('/preguntas');
    await act(() => router.navigate('/mapa'));
    await waitFor(() => expect(avatarState()).toBe('walk_left'));
    await act(() => router.navigate('/ayuda'));
    await waitFor(() => expect(avatarState()).toBe('walk_right'));
    await act(() => router.navigate('/categorias/robos'));
    await waitFor(() => expect(avatarState()).toBe('alert'));
  });

  it('se duerme tras 45 s sin actividad y despierta al usarla', () => {
    vi.useFakeTimers();
    renderRoute('/');
    act(() => vi.advanceTimersByTime(INACTIVE_MS));
    expect(avatarState()).toBe('sleep');
    expect(document.querySelector('.avatar__zzz')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'a' });
    expect(avatarState()).toBe('idle');
  });
});

describe('Respaldo honesto', () => {
  it('ante lo desconocido explica qué puede hacer, sin inventar datos', async () => {
    renderRoute('/');
    await openChat();
    await userEvent.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'xyz{Enter}');
    await waitFor(() => expect(screen.getByRole('log')).toHaveTextContent('repertorio local'));
  });
});
