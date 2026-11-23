import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

type Watch = (entries: Array<{ isIntersecting: boolean; target: Element; boundingClientRect: DOMRect }>) => void;
const watchers: Watch[] = [];
const timeline = () => screen.findByRole('list', { name: 'Línea de tiempo' });
const renderHistory = async () => { mockApi(historyRoutes()); renderRoute('/historia'); return timeline(); };
const covers = () => Array.from(document.querySelectorAll<HTMLElement>('[data-hinge-cover]'));
/** Todas las tarjetas quedan por debajo de la ventana (aún cubiertas) y entran en la franja cercana. */
const approach = () => {
  const below = { top: window.innerHeight + 40, bottom: window.innerHeight + 300 } as DOMRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(below);
  act(() => watchers.forEach((watch) => watch([{ isIntersecting: true, target: document.body, boundingClientRect: below }])));
};

beforeEach(() => {
  hinge.available = true;
  hinge.calls.length = 0;
  setViewport(true);
  useA11yStore.setState({ reducedMotion: false });
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: Watch) { watchers.push(cb); }
    observe() {} unobserve() {} disconnect() {}
  });
});
afterEach(() => { watchers.length = 0; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

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

  it('cada tarjeta lleva su cubierta: capa oculta a lectores, sin eventos y sin escenario aparte', async () => {
    const items = within(await renderHistory()).getAllByRole('listitem');
    expect(covers()).toHaveLength(HISTORIA.hitos.length);
    covers().forEach((cover, index) => {
      expect(cover).toHaveAttribute('aria-hidden', 'true');
      expect(cover).toHaveClass('pointer-events-none', 'absolute', 'inset-0');
      expect(items[index]?.contains(cover)).toBe(true);
    });
    expect(document.querySelector('[data-hinge-stage], [data-hinge-nav]')).toBeNull();
    expect(document.querySelector('[aria-current]')).toBeNull();
  });

  it('monta el lienzo solo cerca de la pantalla, con el año de su tarjeta y cubierta desde 0', async () => {
    await renderHistory();
    expect(hinge.calls).toHaveLength(0);
    approach();
    await waitFor(() => expect(document.querySelectorAll('[data-hinge-canvas]')).toHaveLength(HISTORIA.hitos.length));
    HISTORIA.hitos.forEach((hito) => {
      expect(hinge.calls.find((call) => call.year === String(hito.anio))).toMatchObject({ start: 0 });
    });
    act(() => hinge.calls.forEach((call) => call.onRest()));
    expect(document.querySelectorAll('[data-hinge-canvas]')).toHaveLength(0);
  });

  it('con movimiento reducido o sin WebGL las tarjetas se ven completas, sin cubiertas', async () => {
    await renderHistory();
    act(() => useA11yStore.setState({ reducedMotion: true }));
    expect(covers()).toHaveLength(0);
  });

  it('degrada a la línea de tiempo completa cuando no hay WebGL', async () => {
    hinge.available = false;
    const items = within(await renderHistory()).getAllByRole('listitem');
    expect(covers()).toHaveLength(0);
    expect(items).toHaveLength(HISTORIA.hitos.length);
    HISTORIA.hitos.forEach((hito, index) => {
      const source = hito.source_ref ?? '';
      expect(within(items[index] as HTMLElement).getByRole('link', { name: new URL(source).hostname.replace('www.', '') }))
        .toHaveAttribute('href', source);
    });
  });
});
