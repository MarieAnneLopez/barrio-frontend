import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Accordion } from './Accordion';

const items = [
  { id: 'a', title: '¿Qué es El Tintal?', content: 'Un barrio de Kennedy.' },
  { id: 'b', title: '¿Cómo llego?', content: 'Por la Av. Ciudad de Cali.' },
];

describe('Accordion', () => {
  it('empieza cerrado y abre con clic', async () => {
    render(<Accordion items={items} />);
    const first = screen.getByRole('button', { name: '¿Qué es El Tintal?' });
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Un barrio de Kennedy.')).not.toBeVisible();
    await userEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: '¿Qué es El Tintal?' })).toBeVisible();
  });

  it('modo simple: abrir uno cierra el otro; también funciona con teclado', async () => {
    render(<Accordion items={items} />);
    const first = screen.getByRole('button', { name: '¿Qué es El Tintal?' });
    const second = screen.getByRole('button', { name: '¿Cómo llego?' });
    await userEvent.click(first);
    second.focus();
    await userEvent.keyboard('{Enter}');
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });

  it('modo múltiple: permite varios abiertos', async () => {
    render(<Accordion items={items} multiple />);
    const first = screen.getByRole('button', { name: '¿Qué es El Tintal?' });
    const second = screen.getByRole('button', { name: '¿Cómo llego?' });
    await userEvent.click(first);
    await userEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });
});
