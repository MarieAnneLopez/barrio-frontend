import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tooltip } from './Tooltip';

afterEach(() => vi.useRealTimers());

const wrapperOf = (name: string) => screen.getByRole('button', { name }).parentElement as HTMLElement;

// La prueba del grupo va primero: el estado «caliente» es del módulo y otra prueba lo dejaría activo.
describe('Tooltip', () => {
  it('en un grupo solo el primero espera: el vecino abre al instante y sin transición (H26)', () => {
    // performance.now real: el grupo se mide en tiempo de verdad; solo setTimeout es falso.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(
      <>
        <Tooltip content="Agrandar letra"><button type="button">A+</button></Tooltip>
        <Tooltip content="Achicar letra"><button type="button">A-</button></Tooltip>
      </>,
    );
    const [first, second] = screen.getAllByRole('tooltip', { hidden: true }) as [HTMLElement, HTMLElement];
    fireEvent.pointerEnter(wrapperOf('A+'));
    act(() => vi.advanceTimersByTime(399));
    expect(first).toHaveAttribute('data-open', 'false');
    act(() => vi.advanceTimersByTime(1));
    expect(first).toHaveAttribute('data-open', 'true');
    fireEvent.pointerLeave(wrapperOf('A+'));
    fireEvent.pointerEnter(wrapperOf('A-'));
    act(() => vi.advanceTimersByTime(0));
    expect(second).toHaveAttribute('data-open', 'true');
    expect(second.className).toContain('duration-0');
  });

  it('describe al disparador y se abre con el foco del teclado', async () => {
    render(
      <Tooltip content="Volver al inicio">
        <button type="button">Inicio</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Inicio' });
    const tip = screen.getByRole('tooltip', { hidden: true });
    expect(trigger).toHaveAccessibleDescription('Volver al inicio');
    expect(tip).toHaveAttribute('data-open', 'false');
    await userEvent.tab();
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(tip).toHaveAttribute('data-open', 'true');
    await userEvent.keyboard('{Escape}');
    expect(tip).toHaveAttribute('data-open', 'false');
  });
});
