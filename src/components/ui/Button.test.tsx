import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('es un botón accesible por teclado que dispara onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Explorar</Button>);
    const button = screen.getByRole('button', { name: 'Explorar' });
    expect(button).toHaveAttribute('type', 'button');
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled: no responde y lo anuncia', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Guardar
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading: aria-busy, sigue enfocable y bloquea el clic', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Guardar
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).not.toBeDisabled();
    button.focus();
    expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('aplica la clase de estados compartidos (hover/active/focus)', () => {
    render(<Button variant="secondary">Ver</Button>);
    expect(screen.getByRole('button')).toHaveClass('ui-pressable', 'ui-btn--secondary');
  });
});
