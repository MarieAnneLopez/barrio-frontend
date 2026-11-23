import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HingePanelCanvasProps } from '../hinge/types';
import { useA11yStore } from '../../../store/a11yStore';
import { HISTORIA, historyRoutes } from '../../../test/historyFixtures';
import { mockApi } from '../../../test/mockApi';
import { renderRoute, setViewport } from '../../../test/renderRoute';

const hinge = vi.hoisted(() => ({ available: true, calls: [] as HingePanelCanvasProps[] }));
vi.mock('../hinge/webglSupport', () => ({ isWebGLAvailable: () => hinge.available }));
vi.mock('../hinge/HingePanelCanvas', () => ({ default: (props: HingePanelCanvasProps) => {
  hinge.calls.push(props); return <div data-hinge-canvas />;
} }));

const timeline = () => screen.findByRole('list', { name: 'Línea de tiempo' });
const renderHistory = async () => { mockApi(historyRoutes()); renderRoute('/historia'); return timeline(); };
const navigation = () => document.querySelector<HTMLElement>('[data-hinge-nav]') as HTMLElement;

beforeEach(() => {
  hinge.available = true;
  hinge.calls.length = 0;
  setViewport(true);
  useA11yStore.setState({ reducedMotion: false });
});

describe('Timeline HINGE', () => {
  it('conserva cada hito y sus bloques hermanos sin duplicarlos en el árbol accesible', async () => {
    const items = within(await renderHistory()).getAllByRole('listitem');
    expect(items).toHaveLength(HISTORIA.hitos.length);
    HISTORIA.hitos.forEach((hito, index) => {
      const item = items[index] as HTMLElement;
      const source = hito.source_ref ?? '';
      expect(within(item).getByText(String(hito.anio))).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { name: hito.titulo })).toHaveLength(1);
      expect(within(item).getByText(hito.descripcion)).toBeInTheDocument();
      if (!hito.verified) expect(within(item).getByText(source.includes('portafolio') ? 'Prensa' : 'Por verificar')).toBeInTheDocument();
      expect(within(item).getByRole('link', { name: new URL(source).hostname.replace('www.', '') })).toHaveAttribute('href', source);
    });
    expect(screen.getByRole('img', { name: /Bandera de Kennedy/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Kennedy y El Tintal en cifras' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /El Tintal resaltado/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Fuentes' })).toBeInTheDocument();
    expect(screen.queryByText(/FORME|TIDAL|INDEX|MORPH|MAISON|VERDANT/)).not.toBeInTheDocument();
  });

  it('monta un escenario oculto para lectores y una navegación con estado activo', async () => {
    await renderHistory();
    expect(document.querySelector('[data-hinge-stage]')).toHaveAttribute('aria-hidden', 'true');
    const nav = navigation();
    expect(nav).toHaveAttribute('role', 'group');
    const prev = within(nav).getByRole('button', { name: 'Hito anterior' });
    const next = within(nav).getByRole('button', { name: 'Hito siguiente' });
    expect(prev).toHaveClass('hinge-nav__btn');
    expect(next).toHaveClass('hinge-nav__btn');
    expect(prev).toBeDisabled();
    await waitFor(() => expect(hinge.calls.at(-1)).toMatchObject({
      activeIndex: 0, faces: HISTORIA.hitos.map((hito) => ({ year: String(hito.anio) })),
    }));
    expect(within(await timeline()).getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step');
    fireEvent.click(next);
    expect(within(await timeline()).getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step');
    fireEvent.click(next); fireEvent.click(next);
    expect(next).toBeDisabled();
  });

  it('solo responde a flechas con foco dentro de la navegación y pasa reducedMotion al canvas', async () => {
    await renderHistory();
    const nav = navigation();
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(within(await timeline()).getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step');
    const next = within(nav).getByRole('button', { name: 'Hito siguiente' });
    next.focus(); expect(next).toHaveFocus(); fireEvent.keyDown(next, { key: 'ArrowRight' });
    expect(within(await timeline()).getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step');
    act(() => useA11yStore.setState({ reducedMotion: true }));
    await waitFor(() => expect(hinge.calls.at(-1)?.reducedMotion).toBe(true));
  });

  it('degrada al timeline completo cuando no hay WebGL, sin escenario ni navegación', async () => {
    hinge.available = false;
    const items = within(await renderHistory()).getAllByRole('listitem');
    expect(document.querySelector('[data-hinge-stage]')).toBeNull();
    expect(document.querySelector('[data-hinge-nav]')).toBeNull();
    expect(items).toHaveLength(HISTORIA.hitos.length);
    HISTORIA.hitos.forEach((hito, index) => {
      const source = hito.source_ref ?? '';
      expect(within(items[index] as HTMLElement).getByRole('link', { name: new URL(source).hostname.replace('www.', '') }))
        .toHaveAttribute('href', source);
    });
  });
});
