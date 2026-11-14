import type { RouteObject } from 'react-router-dom';
import { ModulePage } from '../features/modules/ModulePage';
import { HomePage } from '../features/pages/HomePage';
import { NotFoundPage } from '../features/pages/NotFoundPage';
import { SectionPage } from '../features/pages/SectionPage';
import { SECTION_PAGES } from '../lib/navigation';
import { AppShell } from './AppShell';

/** Árbol de rutas: compartido por la app (BrowserRouter) y las pruebas (MemoryRouter). */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      ...SECTION_PAGES.map((item) => ({
        path: item.path.slice(1),
        element: <SectionPage section={item.key} />,
      })),
      { path: 'categorias/:slug', element: <ModulePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
