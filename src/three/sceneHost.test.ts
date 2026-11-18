import { describe, expect, it } from 'vitest';
import { sceneHostElement, useSceneHost } from './sceneHost';

describe('anfitrión único de la maqueta', () => {
  it('cada sección que la acoge dice su modo; el Inicio es «cine» si no lo dice', () => {
    const inicio = document.createElement('div');
    const mapa = document.createElement('div');
    useSceneHost.getState().attach(inicio);
    expect(useSceneHost.getState()).toMatchObject({ requested: true, attached: true, mode: 'cine' });
    useSceneHost.getState().detach();
    useSceneHost.getState().attach(mapa, 'mapa');
    expect(useSceneHost.getState().mode).toBe('mapa');
    expect(sceneHostElement().parentElement).toBe(mapa); // el mismo lienzo, movido: un solo contexto WebGL
  });

  it('al soltarla conserva el modo (la cámara no salta mientras no se ve)', () => {
    useSceneHost.getState().attach(document.createElement('div'), 'mapa');
    useSceneHost.getState().detach();
    expect(useSceneHost.getState()).toMatchObject({ attached: false, mode: 'mapa' });
  });
});
