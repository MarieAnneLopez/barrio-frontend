import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { layoutFor } from './ribbonGeometry';
import { LABELS, type MountedRibbon, mountRibbon } from './ribbonHarness';

vi.mock('three', async (original) => (await import('./ribbonGlKit')).fakeThree(original));
afterEach(() => vi.restoreAllMocks());

const { pitch, unitsPerPixel } = layoutFor(1440, 836);
const PITCH_PX = pitch / unitsPerPixel;
const N = LABELS.length;
let clock = 0;
const at = (clientX: number) => ({ pointerId: 1, button: 0, clientX, clientY: 400 });
/** Arrastra en horizontal por `steps` (px desde 720), con 16 ms entre movimientos, y suelta `wait` ms después. */
function drag({ hit, group }: MountedRibbon, steps: number[], wait: number) {
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  fireEvent.pointerDown(hit(0), at(720));
  for (const step of steps) {
    clock += 16;
    fireEvent.pointerMove(group(), at(720 + step));
  }
  clock += wait;
  fireEvent.pointerUp(group(), at(720 + (steps.at(-1) ?? 0)));
  // El clic sintético que cierra el arrastre, en el botón que se pulsó (así llega si el navegador no lo
  // manda al contenedor que capturó el puntero): si no se descartara, centraría o abriría esa foto.
  fireEvent.click(hit(0), { ...at(720), detail: 1 });
}

describe('PhotoRibbon con WebGL: arrastre, rueda y clics', () => {
  it('arrastrar a la izquierda avanza con el dedo; el clic que cierra el arrastre no abre nada', async () => {
    const mounted = await mountRibbon();
    drag(mounted, [-300, -PITCH_PX], 150);
    mounted.advance();
    expect(mounted.live()).toHaveTextContent(/^Foto 2 de/);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(mounted.group()).not.toHaveAttribute('data-dragging');
  });

  it('lanzamiento × 6 si se suelta antes de 100 ms del último movimiento', async () => {
    const slow = await mountRibbon();
    drag(slow, [-250, -300], 150);
    slow.advance(120);
    expect(slow.live()).toHaveTextContent(/^Foto 1 de/); // 300 px: menos de media foto
    slow.unmount();
    const fast = await mountRibbon();
    drag(fast, [-250, -300], 16);
    fast.advance(120);
    expect(fast.live()).toHaveTextContent(/^Foto 2 de/); // + 50 px × 6
  });

  it('clic en una vecina la centra por el camino más corto; un segundo clic, ya en el centro, la abre', async () => {
    const { hit, advance, live, frames } = await mountRibbon();
    advance(2);
    const left = () => Number(/translate\(([-\d.]+)px/.exec(hit(0).style.transform)?.[1]);
    const before = left();
    fireEvent.click(hit(N - 1), { detail: 1 });
    act(() => void frames.run(3));
    expect(left()).toBeGreaterThan(before); // la del centro se aparta a la derecha: un paso atrás, no seis adelante
    advance();
    expect(live()).toHaveTextContent(`Foto ${N} de ${N}`);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(hit(N - 1), { detail: 1 });
    expect(await screen.findByRole('dialog', { name: LABELS.at(-1) ?? '' })).toBeInTheDocument();
  });

  it('con movimiento reducido la rueda no mueve la cinta y el arrastre no lanza', async () => {
    const mounted = await mountRibbon({ reducedMotion: true });
    fireEvent.wheel(mounted.group(), { deltaY: 4 * PITCH_PX });
    act(() => void mounted.frames.run(1));
    expect(mounted.live()).toHaveTextContent(/^Foto 1 de/);
    drag(mounted, [-250, -300], 16);
    act(() => void mounted.frames.run(1));
    expect(mounted.live()).toHaveTextContent(/^Foto 1 de/);
    expect(mounted.frames.pending.size).toBe(0);
  });

  it('zonas de clic proyectadas: la centrada cubre el centro, recortada a su contorno; las de fuera, aparcadas', async () => {
    const { hit, advance } = await mountRibbon();
    advance(2);
    const center = hit(0).style;
    const [left = 0] = /translate\(([-\d.]+)px/.exec(center.transform)?.slice(1).map(Number) ?? [];
    expect(left).toBeLessThan(720);
    expect(left + Number.parseFloat(center.width)).toBeGreaterThan(720);
    expect(center.clipPath).toMatch(/^polygon\(/);
    expect(hit(0)).not.toHaveAttribute('data-parked');
    for (const neighbor of [1, N - 1]) expect(hit(neighbor)).not.toHaveAttribute('data-parked');
    expect(hit(3)).toHaveAttribute('data-parked', 'true');
    expect(hit(3).style.pointerEvents).toBe('none');
  });
});
