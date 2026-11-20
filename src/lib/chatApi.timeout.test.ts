import { afterEach, describe, expect, it, vi } from 'vitest';
import { askMarie } from './chatApi';

vi.mock('./apiClient', () => ({ apiSend: vi.fn(() => new Promise(() => undefined)), apiGet: vi.fn() }));
afterEach(() => vi.useRealTimers());

describe('límite del chat', () => {
  it('termina tras quince segundos incluso si la lectura de respuesta queda bloqueada', async () => {
    vi.useFakeTimers();
    const result = askMarie('hola', { idioma: 'es', ruta: '/' });
    const assertion = expect(result).rejects.toThrow('Tiempo agotado');
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
  });
});
