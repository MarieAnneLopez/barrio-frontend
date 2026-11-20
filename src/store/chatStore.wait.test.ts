import { afterEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from './chatStore';
import { askMarie } from '../lib/chatApi';

vi.mock('../lib/chatApi', () => ({ askMarie: vi.fn() }));
const context = { idioma: 'es' as const, ruta: '/' };
const reply = { intent: 'x', texto: 'Biblioteca', expresion: 'idle' as const, modelo: 'x', experto: null,
  acciones: [], sugerencias: [], lugar: 'Biblioteca El Tintal' };

afterEach(() => { useChatStore.getState().reset(); vi.useRealTimers(); vi.resetAllMocks(); });

describe('Espera y contexto del chat', () => {
  it('muestra guía a los cinco segundos y sustituye esa guía al recibir respuesta', async () => {
    vi.useFakeTimers();
    let resolve!: (value: typeof reply) => void;
    vi.mocked(askMarie).mockReturnValue(new Promise((done) => { resolve = done; }));
    const pending = useChatStore.getState().send('colegios', context);
    await vi.advanceTimersByTimeAsync(5000);
    expect(useChatStore.getState().messages).toHaveLength(2);
    expect(useChatStore.getState().pending).toBe(true);
    resolve(reply);
    await pending;
    expect(useChatStore.getState().messages).toHaveLength(2);
    expect(useChatStore.getState().messages[1]).toMatchObject({ remote: reply });
    vi.mocked(askMarie).mockResolvedValue(reply);
    await useChatStore.getState().send('horarios', context);
    expect(askMarie).toHaveBeenLastCalledWith('horarios', { ...context, contexto_lugar: reply.lugar });
  });

  it('ignora respuestas antiguas después de reiniciar', async () => {
    let resolve!: (value: typeof reply) => void;
    vi.mocked(askMarie).mockReturnValue(new Promise((done) => { resolve = done; }));
    const pending = useChatStore.getState().send('¿Cuántos colegios hay?', context);
    useChatStore.getState().reset();
    resolve(reply);
    await pending;
    expect(useChatStore.getState().messages).toEqual([]);
  });
});
