// Entradas principales del Sidebar (§11.2.1), en orden. "Categorías" es el
// submenú de los 14 módulos y se inserta tras "Historia Local".
import type { IconName } from '../components/layout/NavIcon';

export interface NavItem {
  /** Clave i18n: nav.<key> y pages.<key>.* */
  key: string;
  path: string;
  icon: IconName;
}

export const NAV_BEFORE_CATEGORIES: readonly NavItem[] = [
  { key: 'home', path: '/', icon: 'home' },
  { key: 'map', path: '/mapa', icon: 'map' },
  { key: 'history', path: '/historia', icon: 'book' },
];

export const NAV_AFTER_CATEGORIES: readonly NavItem[] = [
  { key: 'ranking', path: '/ranking', icon: 'star' },
  { key: 'gallery', path: '/galeria', icon: 'image' },
  { key: 'faq', path: '/preguntas', icon: 'help' },
  { key: 'creator', path: '/creadora', icon: 'user' },
  { key: 'help', path: '/ayuda', icon: 'lifebuoy' },
  { key: 'access', path: '/acceso', icon: 'login' },
];

/** Secciones con página propia (todas menos Inicio). */
export const SECTION_PAGES = [...NAV_BEFORE_CATEGORIES, ...NAV_AFTER_CATEGORIES].filter(
  (item) => item.key !== 'home',
);
