import { describe, expect, it } from 'vitest';
import { sceneHostElement, useSceneHost } from './sceneHost';

describe('anfitrión único de la maqueta', () => {
  it('cada sección que la acoge dice su modo; el Inicio es «cine» si no lo dice', () => {
    const inicio = document.createElement('div');
    const mapa = document.createElement('div');
    useSceneHost.getState().attach(inicio);
    expect(useSceneHost.getState()).toMatchObject({ requested: true, attached: true, mode: 'cine' });
    useSceneHost.getState().detach(inicio);
    useSceneHost.getState().attach(mapa, 'mapa');
    expect(useSceneHost.getState().mode).toBe('mapa');
    expect(sceneHostElement().parentElement).toBe(mapa); // el mismo lienzo, movido: un solo contexto WebGL
  });

  it('al soltarla conserva el modo (la cámara no salta mientras no se ve)', () => {
    const mapa = document.createElement('div');
    useSceneHost.getState().attach(mapa, 'mapa');
    useSceneHost.getState().detach(mapa);
    expect(useSceneHost.getState()).toMatchObject({ attached: false, mode: 'mapa' });
  });

  it('ignora al observador y al desmontaje anterior cuando el nuevo mapa ya recibe gestos', () => {
    const oldSlot = document.createElement('div');
    const map = document.createElement('div');
    const { attach, detach, setVisible } = useSceneHost.getState();
    attach(oldSlot);
    setVisible(oldSlot, false);
    attach(map, 'mapa');
    setVisible(oldSlot, false);
    detach(oldSlot);
    expect(useSceneHost.getState()).toMatchObject({ attached: true, visible: true, mode: 'mapa' });
    expect(sceneHostElement().parentElement).toBe(map);
    setVisible(map, false);
    expect(useSceneHost.getState().visible).toBe(false);
  });
});
