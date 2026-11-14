import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('asocia la etiqueta visible y la ayuda', () => {
    render(<Input label="Nombre del lugar" hint="Como aparece en el letrero" />);
    const input = screen.getByLabelText('Nombre del lugar');
    expect(input).toHaveAccessibleDescription('Como aparece en el letrero');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('error: aria-invalid y mensaje junto al campo', () => {
    render(<Input label="Teléfono" error="Escribe 10 dígitos" />);
    const input = screen.getByLabelText('Teléfono');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Escribe 10 dígitos');
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe 10 dígitos');
  });

  it('loading: aria-busy y spinner con texto para lectores', () => {
    render(<Input label="Buscar" loading />);
    expect(screen.getByLabelText('Buscar')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
  });

  it('disabled: no acepta escritura', async () => {
    render(<Input label="Barrio" disabled defaultValue="El Tintal" />);
    const input = screen.getByLabelText('Barrio');
    await userEvent.type(input, 'x');
    expect(input).toHaveValue('El Tintal');
  });
});
