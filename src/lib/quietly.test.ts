import { beforeEach, describe, expect, it } from 'vitest';
import { useLoadingStore } from '../store/loadingStore';
import { quietly, track } from './loadingTracker';

beforeEach(() => useLoadingStore.setState({ tasks: {} }));

describe('Reintentos en silencio (la maqueta no vuelve a tapar la página)', () => {
  it('lo que empieza dentro de quietly no cuenta como carga; lo de fuera sí', async () => {
    await quietly(async () => void track('/barrio/poligono'));
    expect(Object.keys(useLoadingStore.getState().tasks)).toHaveLength(0);
    track('/barrio/poligono');
    expect(Object.keys(useLoadingStore.getState().tasks)).toHaveLength(1);
  });
});
