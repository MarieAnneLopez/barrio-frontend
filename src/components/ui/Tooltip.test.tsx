import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
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
