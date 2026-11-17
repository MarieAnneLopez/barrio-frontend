import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type MountedReel, mountReel } from './reelHarness';

vi.mock('three', async (original) => (await import('./glKit')).fakeThree(original));
afterEach(() => vi.restoreAllMocks());

const SECOND = /^Módulo 2 de 14: Escenarios Deportivos\./;
const THIRD = /^Módulo 3 de 14: Cámaras de Seguridad\./;

/** El lienzo ocupa 1440 × 836 px bajo el header; (x, y) van de −1 a 1 como en la escena. */
function at(mounted: MountedReel, x: number, y: number) {
  const frame = mounted.reel();
  frame.getBoundingClientRect = () => ({ left: 0, top: 64, width: 1440, height: 836, right: 1440, bottom: 900, x: 0, y: 64, toJSON: () => ({}) });
  return { clientX: 720 * (1 + x), clientY: 64 + 418 * (1 - y), pointerId: 1, detail: 1 };
}

describe('ModuleReel con WebGL: puntero y rueda', () => {
  it('clic en la tarjeta central navega a su módulo', async () => {
    const mounted = await mountReel();
    mounted.advance(2);
    fireEvent.click(mounted.reel(), at(mounted, 0, 0));
    expect(mounted.router.state.location.pathname).toBe('/categorias/centros-educativos');
  });

  it('clic en una vecina la trae al centro; un segundo clic, ya en el centro, la abre', async () => {
    const mounted = await mountReel();
    mounted.advance(2);
    fireEvent.click(mounted.reel(), at(mounted, 0.65, 0.3));
    expect(mounted.router.state.location.pathname).toBe('/');
    mounted.advance();
    expect(mounted.reel()).toHaveAccessibleDescription(SECOND);
    fireEvent.click(mounted.reel(), at(mounted, 0, 0));
    expect(mounted.router.state.location.pathname).toBe('/categorias/escenarios-deportivos');
  });

  it('clic en el papel, fuera de las tarjetas, no hace nada', async () => {
    const mounted = await mountReel();
    mounted.advance(2);
    fireEvent.click(mounted.reel(), at(mounted, -0.9, 0.9));
    mounted.advance();
    expect(mounted.router.state.location.pathname).toBe('/');
    expect(mounted.reel()).toHaveAccessibleDescription(/^Módulo 1 de 14/);
  });

  it('arrastrar hacia la izquierda avanza y, al soltar, asienta en el módulo más cercano', async () => {
    const mounted = await mountReel();
    mounted.advance(2);
    const frame = mounted.reel();
    fireEvent.pointerDown(frame, at(mounted, 0, 0));
    fireEvent.pointerMove(frame, { ...at(mounted, 0, 0), clientX: 720 - 430 }); // 1,15 módulos (374 px cada uno)
    mounted.advance();
    expect(frame).toHaveAccessibleDescription(SECOND);
    expect(frame).toHaveAttribute('data-dragging', 'true');
    fireEvent.pointerMove(frame, { ...at(mounted, 0, 0), clientX: 720 - 600 }); // 1,6: el más cercano es el 3.º
    fireEvent.pointerUp(frame, { ...at(mounted, 0, 0), clientX: 720 - 600 });
    fireEvent.click(frame, { ...at(mounted, 0, 0), clientX: 720 - 600 }); // el clic del arrastre no abre nada
    mounted.advance();
    expect(frame).toHaveAccessibleDescription(THIRD);
    expect(frame).not.toHaveAttribute('data-dragging');
    expect(mounted.router.state.location.pathname).toBe('/');
  });

  it('arrastrar hacia abajo también avanza', async () => {
    const mounted = await mountReel();
    mounted.advance(2);
    const frame = mounted.reel();
    fireEvent.pointerDown(frame, at(mounted, 0, 0));
    fireEvent.pointerMove(frame, { ...at(mounted, 0, 0), clientY: 64 + 418 + 400 });
    fireEvent.pointerUp(frame, { ...at(mounted, 0, 0), clientY: 64 + 418 + 400 });
    mounted.advance();
    expect(frame).toHaveAccessibleDescription(SECOND);
  });

  it('la rueda no se intercepta: la página se desplaza y el reel solo toma impulso', async () => {
    const mounted = await mountReel();
    const wheel = new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true });
    mounted.reel().dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(false);
    mounted.advance(240);
    expect(mounted.reel()).toHaveAccessibleDescription(/^Módulo 1 de 14/); // el impulso se apaga: no cambia de módulo
  });
});
