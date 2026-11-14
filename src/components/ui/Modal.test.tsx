import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { Modal } from './Modal';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir ficha</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Biblioteca El Tintal"
        description="Ficha del lugar"
        footer={<Button onClick={() => setOpen(false)}>Listo</Button>}
      >
        Contenido
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('abre como diálogo modal con título y descripción', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir ficha' }));
    const dialog = screen.getByRole('dialog', { name: 'Biblioteca El Tintal' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Ficha del lugar');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('atrapa Tab dentro y cierra con Escape devolviendo el foco', async () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Abrir ficha' });
    await userEvent.click(trigger);
    const close = screen.getByRole('button', { name: 'Cerrar' });
    const done = screen.getByRole('button', { name: 'Listo' });
    expect(close).toHaveFocus();
    await userEvent.tab();
    expect(done).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
});
