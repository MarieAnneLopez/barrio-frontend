import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountReel } from './reelHarness';

vi.mock('three', async (original) => (await import('./glKit')).fakeThree(original));
afterEach(() => vi.restoreAllMocks());

const DESCRIPTION = [
  'Módulo 1 de 14: Centros Educativos. Pulsa Enter para abrirlo.',
  'Módulo 2 de 14: Escenarios Deportivos. Pulsa Enter para abrirlo.',
  'Módulo 14 de 14: Barberías. Pulsa Enter para abrirlo.',
] as const;

describe('ModuleReel con WebGL: accesibilidad y teclado', () => {
  it('el contenedor del lienzo es enfocable y tiene nombre y descripción accesibles', async () => {
    const { reel, container } = await mountReel();
    expect(reel()).toHaveAttribute('tabindex', '0');
    expect(reel()).toHaveAccessibleDescription(DESCRIPTION[0]);
    expect(reel().querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('section')).toHaveAttribute('data-mode', 'reel');
    expect(container.querySelector('section')).toHaveAttribute('data-chapter', '4');
    expect(screen.queryByRole('navigation')).toBeNull(); // la rejilla es solo el respaldo
  });

  it('única copia visible: el titular y la pista inferior', async () => {
    const { container } = await mountReel();
    expect(screen.getByRole('heading', { level: 2, name: 'El Tintal' })).toBeInTheDocument();
    expect(screen.getByText('Desplaza o arrastra para explorar')).toHaveClass('reel-hint');
    const visible = [...container.querySelectorAll('section *')].filter((node) => !node.matches('.sr-only') && node.children.length === 0);
    expect(visible.map((node) => node.textContent).filter(Boolean)).toEqual(['El', 'Tintal', 'Desplaza o arrastra para explorar']);
  });

  it('las flechas avanzan o retroceden un módulo (el anillo da la vuelta) y Home vuelve al primero', async () => {
    const { reel, advance } = await mountReel();
    expect(fireEvent.keyDown(reel(), { key: 'ArrowRight' })).toBe(false); // la usa: no desplaza la página
    advance();
    expect(reel()).toHaveAccessibleDescription(DESCRIPTION[1]);
    for (const key of ['ArrowLeft', 'ArrowUp']) fireEvent.keyDown(reel(), { key });
    advance();
    expect(reel()).toHaveAccessibleDescription(DESCRIPTION[2]);
    fireEvent.keyDown(reel(), { key: 'Home' });
    advance();
    expect(reel()).toHaveAccessibleDescription(DESCRIPTION[0]);
  });

  it('no se queda con las teclas que no usa, ni con los atajos del navegador', async () => {
    const { reel } = await mountReel();
    for (const key of ['Tab', ' ', 'PageDown', 'End']) expect(fireEvent.keyDown(reel(), { key })).toBe(true);
    expect(fireEvent.keyDown(reel(), { key: 'ArrowLeft', altKey: true })).toBe(true); // Alt + ← es «atrás»
    expect(reel()).toHaveAccessibleDescription(DESCRIPTION[0]);
  });

  it('Enter abre el módulo que está en el centro', async () => {
    const { reel, advance, router } = await mountReel();
    for (const key of ['ArrowDown', 'ArrowRight']) fireEvent.keyDown(reel(), { key });
    advance();
    fireEvent.keyDown(reel(), { key: 'Enter' });
    expect(router.state.location.pathname).toBe('/categorias/camaras-seguridad');
  });

  it('con movimiento reducido responde al instante y no queda nada animándose', async () => {
    const { reel, frames } = await mountReel({ reducedMotion: true });
    act(() => frames.run(1));
    fireEvent.keyDown(reel(), { key: 'ArrowRight' });
    act(() => frames.run(1));
    expect(reel()).toHaveAccessibleDescription(DESCRIPTION[1]);
    expect(frames.pending.size).toBe(0);
  });

  it('axe: sin violaciones con el lienzo montado', async () => {
    const { default: axe } = await import('axe-core');
    const { container } = await mountReel();
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
  });

  it('la descripción solo se anuncia sola con el foco en el reel', async () => {
    const { reel } = await mountReel();
    const live = () => screen.getByText(DESCRIPTION[0]);
    expect(live()).toHaveAttribute('aria-live', 'off');
    fireEvent.focus(reel());
    expect(live()).toHaveAttribute('aria-live', 'polite');
    fireEvent.blur(reel());
    expect(live()).toHaveAttribute('aria-live', 'off');
  });
});
