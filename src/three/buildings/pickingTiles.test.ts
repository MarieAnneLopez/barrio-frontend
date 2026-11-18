import type { ThreeEvent } from '@react-three/fiber';
import { Group, Mesh, type Object3D } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSelectionStore } from '../selection/selectionStore';
import { buildAll } from './builder';
import { fakeSource, square } from './fixture';
import { createPickHandlers, type PickHandlers } from './picking';
import { tileGeometry } from './tileGeometry';

// Despacho de r3f 8.18 (events-*.esm.js, handleIntersects): el grupo de los edificios recibe una
// llamada por cada malla que cruza el rayo, en orden de distancia y todas con eventObject = el grupo,
// hasta que una detiene la propagación. Dos edificios en teselas distintas: 0 en la 0 y 1 en la 1.
const tiles = buildAll(fakeSource([{ rings: [square(0, 0, 10)], pisos: 2 }, { rings: [square(500, 0, 10)], pisos: 3 }])).tiles;
const meshes = tiles.map((tile) => new Mesh(tileGeometry(tile)));
const group = new Group().add(...meshes);
const marker = new Mesh(); // un lugar de un módulo: otro objeto con eventos

type Hit = { object: Object3D; eventObject: Object3D };
const tileHit = (k: number): Hit => ({ object: meshes[k] as Mesh, eventObject: group });
const placeHit: Hit = { object: marker, eventObject: marker };

const canvas = document.createElement('canvas');
const handlers = createPickHandlers(canvas);
const cursor = () => canvas.style.cursor;

/** Llama al handler del grupo como r3f: una vez por malla del grupo, en el orden de `hits`. */
function dispatch(handler: PickHandlers['onPointerMove'] | PickHandlers['onClick'], hits: Hit[], target: EventTarget = canvas): void {
  for (const hit of hits) {
    const k = meshes.indexOf(hit.object as Mesh);
    if (k < 0) continue; // el lugar tiene sus propios handlers
    const stopPropagation = vi.fn();
    const face = { a: tiles[k]?.index[0] ?? 0, b: 0, c: 0 };
    const event = { ...hit, face, intersections: hits, delta: 0, stopPropagation, nativeEvent: { target } };
    handler(event as unknown as ThreeEvent<PointerEvent> & ThreeEvent<MouseEvent>);
    if (stopPropagation.mock.calls.length > 0) break;
  }
}

beforeEach(() => {
  useSelectionStore.setState({ selected: null, hovered: null });
  canvas.style.cursor = '';
});

describe('elección cuando el rayo cruza varias teselas', () => {
  it('marca el edificio de la tesela más cercana; la de atrás no lo suelta', () => {
    dispatch(handlers.onPointerMove, [tileHit(0), tileHit(1)]);
    expect([useSelectionStore.getState().hovered, cursor()]).toEqual([{ kind: 'building', index: 0 }, 'pointer']);
    dispatch(handlers.onPointerMove, [tileHit(1), tileHit(0)]);
    expect([useSelectionStore.getState().hovered, cursor()]).toEqual([{ kind: 'building', index: 1 }, 'pointer']);
  });

  it('un lugar delante de las dos teselas sí suelta el edificio', () => {
    dispatch(handlers.onPointerMove, [tileHit(0), tileHit(1)]);
    dispatch(handlers.onPointerMove, [placeHit, tileHit(0), tileHit(1)]);
    expect(useSelectionStore.getState().hovered).toBeNull();
  });

  it('el clic elige el edificio de la tesela más cercana', () => {
    dispatch(handlers.onClick, [tileHit(1), tileHit(0)]);
    expect(useSelectionStore.getState().selected).toEqual({ kind: 'building', index: 1 });
  });
});

// drei Html monta los billboards dentro del div donde escucha r3f (events.connected): sus eventos
// burbujean hasta r3f, que arma el rayo con offsetX/Y relativos al botón, no al lienzo.
describe('eventos de un elemento HTML sobre la maqueta (billboards)', () => {
  it('no marcan ni eligen el edificio que cae en ese offset, y sueltan el que estaba marcado', () => {
    const billboard = document.createElement('button');
    dispatch(handlers.onPointerMove, [tileHit(0)], billboard);
    dispatch(handlers.onClick, [tileHit(0)], billboard);
    expect([useSelectionStore.getState().hovered, useSelectionStore.getState().selected]).toEqual([null, null]);
    dispatch(handlers.onPointerMove, [tileHit(0)]);
    dispatch(handlers.onPointerMove, [tileHit(0)], billboard);
    expect(useSelectionStore.getState().hovered).toBeNull();
  });
});
