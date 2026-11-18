import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { useChatStore } from '../../store/chatStore';
import { mockApi } from '../../test/mockApi';
import { renderRoute, setViewport } from '../../test/renderRoute';
import { SectionPage } from './SectionPage';

beforeEach(() => {
  setViewport(true);
  act(() => {
    useChatStore.getState().reset();
    useA11yStore.setState({ reducedMotion: true });
  });
});

describe('Secciones en construcción y límite del chat (D62)', () => {
  it('una sección sin página propia dice que está en construcción', () => {
    render(<SectionPage section="gallery" />, { wrapper: MemoryRouter });
    expect(screen.getByText('En construcción')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Galería General' })).toBeInTheDocument();
  });

  it('si el servidor limita los mensajes, el chat lo dice sin inventar respuesta', async () => {
    mockApi({ '/chat': { status: 429, body: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'x' } } } });
    renderRoute('/');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir chat con Mini Marie' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'colegios{Enter}');
    await waitFor(() => expect(screen.getByRole('log')).toHaveTextContent('Llegaste al límite de mensajes'));
    expect(screen.getByRole('log').textContent).not.toMatch(/servidor|conexión|repertorio/i);
  });
});
