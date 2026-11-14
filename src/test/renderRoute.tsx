import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '../app/routes';

/** Renderiza la app completa en una ruta (MemoryRouter con el árbol real). */
export function renderRoute(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return { router, ...render(<RouterProvider router={router} />) };
}

/** Simula el ancho de pantalla para useMediaQuery (jsdom no trae matchMedia). */
export function setViewport(desktop: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('min-width') ? desktop : !desktop,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
