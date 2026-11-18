import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearBaseMapCache } from '../../../components/map/baseMapData';
import { mockApi } from '../../../test/mockApi';
import { BASE_MAP, FEATURES } from '../../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../../test/renderRoute';
import { worldReady } from '../../../test/emptyWorld';

// jsdom no tiene WebGL: la escena se sustituye; aquí se prueba el Inicio que la envuelve.
vi.mock('../../../three/TintalScene', () => ({ default: () => <div data-testid="escena-3d" /> }));

beforeEach(() => {
  worldReady();
  window.localStorage.clear();
  clearBaseMapCache();
  setViewport(true);
  mockApi({ ...BASE_MAP, '/centros-educativos/geojson': FEATURES });
});

const chapter = (n: number) => screen.getByRole('main').querySelector<HTMLElement>(`[data-chapter="${n}"]`) as HTMLElement;
const hero = () => within(chapter(3)).getByRole('region', { name: 'Maqueta 3D de El Tintal' });

describe('Inicio: película de 4 capítulos (etapa 3)', () => {
  it('los 4 capítulos van en orden, a todo el ancho, con un solo h1 y el título del documento', async () => {
    renderRoute('/');
    await screen.findByTestId('escena-3d');
    const main = screen.getByRole('main');
    expect([...main.querySelectorAll('[data-chapter]')].map((el) => el.getAttribute('data-chapter'))).toEqual(['1', '2', '3', '4']);
    expect(main.querySelectorAll('h1')).toHaveLength(1);
    expect(main.className).not.toMatch(/max-w-\[1200px\]/); // sin la columna: cada capítulo ocupa todo el ancho
    expect(document.title).toBe('Reconoce tu Barrio: El Tintal · El Tintal');
  });

  it('las demás páginas siguen en la columna de 1200 px', async () => {
    renderRoute('/ayuda');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ayuda' })).toBeInTheDocument();
    expect(screen.getByRole('main').className).toMatch(/max-w-\[1200px\]/);
  });

  it('el capítulo 3 acoge la maqueta en un recuadro sticky de 100svh dentro de 200svh, sin marco y con tono noche', async () => {
    renderRoute('/');
    await screen.findByTestId('escena-3d');
    expect(chapter(3).className).toMatch(/h-\[200svh\]/);
    expect(chapter(3)).toHaveAttribute('data-tone', 'noche');
    expect(chapter(3)).not.toHaveAttribute('data-header-float'); // sobre las vías claras del mapa el header va sólido
    expect(hero().closest('.sticky')?.className).toMatch(/\btop-0\b.*\bh-svh\b/);
    expect(hero().className).not.toMatch(/border|rounded|shadow|-mx-4/);
  });

  it('su HUD es sobrio: coordenadas, Recentrar y Pausar y la atribución; sin leyenda ni texto de ayuda', async () => {
    renderRoute('/');
    await screen.findByTestId('escena-3d');
    expect(within(hero()).getByText('4,653° N · 74,157° O')).toBeInTheDocument();
    for (const name of ['Recentrar', 'Pausar la órbita']) expect(within(hero()).getByRole('button', { name })).toBeInTheDocument();
    expect(within(hero()).getByText('Datos © UAECD (Catastro Bogotá, CC BY 4.0) · © OpenStreetMap (ODbL)')).toBeInTheDocument();
    expect(within(hero()).queryByRole('button', { name: 'Leyenda y filtro' })).toBeNull();
    expect(within(hero()).queryByText(/usa la rueda para acercar/)).toBeNull(); // aquí la rueda desplaza la página
  });

  it('la rueda desplaza la página: solo llega a la maqueta con Ctrl o ⌘, y nunca se cancela', async () => {
    renderRoute('/');
    await screen.findByTestId('escena-3d');
    const target = hero().querySelector('[data-scene-slot]')?.appendChild(document.createElement('div')) as HTMLElement;
    const seen = vi.fn();
    target.addEventListener('wheel', seen);
    const plain = new WheelEvent('wheel', { bubbles: true, cancelable: true });
    target.dispatchEvent(plain);
    expect(seen).not.toHaveBeenCalled();
    for (const init of [{ ctrlKey: true }, { metaKey: true }]) target.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init }));
    expect(seen).toHaveBeenCalledTimes(2);
    expect(plain.defaultPrevented).toBe(false);
  });

  it('en Mapa 3D la rueda sí llega a la maqueta', async () => {
    renderRoute('/mapa');
    await screen.findByTestId('escena-3d');
    const map = screen.getByRole('region', { name: 'Maqueta 3D de El Tintal' });
    const target = map.querySelector('[data-scene-slot]')?.appendChild(document.createElement('div')) as HTMLElement;
    const seen = vi.fn();
    target.addEventListener('wheel', seen);
    target.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('enlace discreto a los créditos de las fotos, fuera de los capítulos', async () => {
    renderRoute('/');
    await screen.findByTestId('escena-3d');
    const credits = within(screen.getByRole('main')).getByRole('link', { name: 'Créditos de fotos' });
    expect(credits).toHaveAttribute('href', '/creditos-fotos');
    expect(credits.closest('[data-chapter]')).toBeNull();
  });
});
