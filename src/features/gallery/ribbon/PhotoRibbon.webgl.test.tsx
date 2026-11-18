import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LABELS, mountRibbon } from './ribbonHarness';

vi.mock('three', async (original) => (await import('./ribbonGlKit')).fakeThree(original));
afterEach(() => vi.restoreAllMocks());

const N = LABELS.length;
const tabbable = (root: HTMLElement) => [...root.querySelectorAll('[data-ribbon-index]')].filter((node) => node.getAttribute('tabindex') === '0');

describe('PhotoRibbon con WebGL: botones, teclado y anuncios', () => {
  it('un botón nativo por foto, con la etiqueta real como nombre; solo la activa entra con Tab', async () => {
    const { group, root } = await mountRibbon();
    const buttons = within(group()).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(LABELS);
    expect(buttons[2]).toHaveAccessibleName('Biblioteca El Tintal');
    expect(tabbable(root())).toEqual([buttons[0]]);
    expect(group()).toHaveAccessibleDescription(/Arrastra, usa la rueda o las flechas/);
    expect(root().querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('list', { name: 'Fotos de la galería' })).toBeNull(); // la rejilla es solo el respaldo
  });

  it('empieza en la primera; las flechas pasan de foto (el anillo da la vuelta) y Home vuelve a la primera', async () => {
    const { hit, advance, live, root } = await mountRibbon();
    act(() => hit(0).focus());
    expect(fireEvent.keyDown(hit(0), { key: 'ArrowRight' })).toBe(false); // la usa: no desplaza la página
    expect(hit(1)).toHaveFocus();
    expect(tabbable(root())).toEqual([hit(1)]);
    advance();
    expect(live()).toHaveTextContent(`Foto 2 de ${N}: Calle 8. Vista 2 de Calle 8.`);
    for (let step = 0; step < 2; step += 1) fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowLeft' });
    expect(hit(N - 1)).toHaveFocus();
    advance();
    expect(live()).toHaveTextContent(`Foto ${N} de ${N}: ${LABELS[N - 1]}.`);
    fireEvent.keyDown(hit(N - 1), { key: 'Home' });
    expect(hit(0)).toHaveFocus();
    advance();
    expect(live()).toHaveTextContent(`Foto 1 de ${N}: Calle 6.`);
  });

  it('Escape y las teclas que no son de la cinta siguen siendo del navegador, también los atajos', async () => {
    const { hit, advance, live } = await mountRibbon();
    act(() => hit(0).focus());
    for (const key of ['Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'End', 'PageDown']) expect(fireEvent.keyDown(hit(0), { key })).toBe(true);
    expect(fireEvent.keyDown(hit(0), { key: 'ArrowLeft', altKey: true })).toBe(true); // Alt + ← es «atrás»
    advance();
    expect(hit(0)).toHaveFocus();
    expect(live()).toHaveTextContent(/^Foto 1 de/);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Enter abre la foto en el visor con su autor y licencia; al cerrar, el foco vuelve a su botón', async () => {
    const user = userEvent.setup({ advanceTimers: () => undefined });
    const { hit, advance } = await mountRibbon();
    act(() => hit(0).focus());
    fireEvent.keyDown(hit(0), { key: 'ArrowRight' });
    advance();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Calle 8' });
    expect(within(dialog).getByText('Foto: Autor2')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Licencia CC BY-SA 4.0' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(hit(1)).toHaveFocus();
  });

  it('si en el visor se pasa a otra foto, al cerrar la cinta queda en ella y el foco va a su botón', async () => {
    const user = userEvent.setup();
    const { hit, advance, live } = await mountRibbon();
    act(() => hit(0).focus());
    await user.keyboard('{Enter}');
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByRole('dialog', { name: 'Calle 8' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    advance();
    expect(hit(1)).toHaveFocus();
    expect(live()).toHaveTextContent(/^Foto 2 de/);
  });

  it('la foto centrada se anuncia con aria-live polite cuando la cinta se detiene', async () => {
    const { hit, advance, live, frames } = await mountRibbon();
    expect(live()).toHaveAttribute('aria-live', 'polite');
    act(() => hit(0).focus());
    fireEvent.keyDown(hit(0), { key: 'ArrowRight' });
    act(() => void frames.run(2));
    expect(live()).toHaveTextContent(/^Foto 1 de/); // aún de camino: no se anuncia nada nuevo
    advance();
    expect(live()).toHaveTextContent(/^Foto 2 de/);
  });

  it('axe: sin violaciones con la cinta montada', async () => {
    const { default: axe } = await import('axe-core');
    const { container } = await mountRibbon();
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`)).toEqual([]);
  });
});
