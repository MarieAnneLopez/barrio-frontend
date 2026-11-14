import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { Accordion } from './Accordion';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { Modal } from './Modal';
import { Skeleton } from './Skeleton';
import { Tooltip } from './Tooltip';

// jsdom no calcula layout: el contraste se verifica en tokens.test.ts.
async function violations(root: Element) {
  const result = await axe.run(root, { rules: { 'color-contrast': { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`);
}

describe('axe: componentes del design system', () => {
  it('control: detecta un botón sin nombre (la prueba no pasa en vacío)', async () => {
    const { container } = render(<button type="button" />);
    expect((await violations(container)).join()).toContain('button-name');
  });

  it('sin violaciones en todos los estados de los controles', async () => {
    const { container } = render(
      <main>
        <h1>Design system</h1>
        <Card>
          <h2>Tarjeta</h2>
          <Button>Primario</Button>
          <Button variant="secondary" disabled>
            Deshabilitado
          </Button>
          <Button variant="ghost" loading>
            Cargando
          </Button>
          <Input label="Nombre" hint="Ayuda" />
          <Input label="Correo" error="Falta el correo" />
          <Input label="Buscar" loading />
          <Tooltip content="Más información">
            <button type="button">Info</button>
          </Tooltip>
          <Skeleton lines={2} />
        </Card>
        <Accordion items={[{ id: 'q', title: 'Pregunta', content: 'Respuesta' }]} headingLevel={2} />
      </main>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Pregunta' }));
    expect(await violations(container)).toEqual([]);
  });

  it('sin violaciones con el modal abierto', async () => {
    render(
      <Modal open onClose={() => undefined} title="Ficha" description="Detalle del lugar">
        <p>Contenido</p>
      </Modal>,
    );
    expect(await violations(document.body)).toEqual([]);
  });
});
