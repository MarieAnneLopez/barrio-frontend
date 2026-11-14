import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ModulePage } from '../features/modules/ModulePage';
import { CreatorPage } from '../features/pages/CreatorPage';
import { FaqPage } from '../features/pages/FaqPage';
import { HomePage } from '../features/pages/HomePage';
import { NotFoundPage } from '../features/pages/NotFoundPage';
import { RankingsPage } from '../features/ranking/RankingsPage';
import { SectionPage } from '../features/pages/SectionPage';
import { SECTION_PAGES } from '../lib/navigation';
import { AppShell } from './AppShell';

/** Secciones con página propia; el resto usa SectionPage hasta su hito. */
const DEDICATED: Record<string, ReactNode> = {
  faq: <FaqPage />,
  creator: <CreatorPage />,
  ranking: <RankingsPage />,
};

/** Árbol de rutas: compartido por la app (BrowserRouter) y las pruebas (MemoryRouter). */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      ...SECTION_PAGES.map((item) => ({
        path: item.path.slice(1),
        element: DEDICATED[item.key] ?? <SectionPage section={item.key} />,
      })),
      { path: 'categorias/:slug', element: <ModulePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
