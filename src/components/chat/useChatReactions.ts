import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { NAV_AFTER_CATEGORIES, NAV_BEFORE_CATEGORIES } from '../../lib/navigation';
import { useAvatarSettle, useAvatarStore } from '../../store/avatarStore';

/** Inactividad que duerme a Mini Marie (§11.4.2). */
export const INACTIVE_MS = 45_000;
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;

/** Orden del menú: define hacia qué lado camina Mini Marie al navegar. */
const ORDER = [
  ...NAV_BEFORE_CATEGORIES.map((item) => item.path),
  ...CATEGORIES.map((c) => categoryPath(c.slug)),
  ...NAV_AFTER_CATEGORIES.map((item) => item.path),
];
const THEFT_PATH = categoryPath('robos');

/** Clave i18n del nombre de la sección actual (saludo contextual del chat). */
export function placeKeyOf(pathname: string): string {
  if (pathname === '/') return 'nav.home';
  const category = CATEGORIES.find((c) => categoryPath(c.slug) === pathname);
  if (category) return `categories.${category.slug}.name`;
  const item = [...NAV_BEFORE_CATEGORIES, ...NAV_AFTER_CATEGORIES].find((i) => i.path === pathname);
  return item ? `nav.${item.key}` : 'chat.thisPage';
}

/** Posición de una ruta en el menú; las desconocidas van al final. */
export function navIndex(pathname: string): number {
  const i = ORDER.indexOf(pathname);
  return i === -1 ? ORDER.length : i;
}

/**
 * Reacciones de Mini Marie a la navegación: camina hacia la sección nueva,
 * se alerta en el módulo de robos y se duerme tras 45 s sin actividad.
 */
export function useChatReactions(): void {
  useAvatarSettle();
  const dispatch = useAvatarStore((s) => s.dispatch);
  const { pathname } = useLocation();
  const previous = useRef(pathname);

  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    if (from === pathname) return;
    if (pathname === THEFT_PATH) {
      dispatch({ type: 'ALERT' });
      return;
    }
    const direction = navIndex(pathname) < navIndex(from) ? 'left' : 'right';
    dispatch({ type: 'NAVIGATE', direction });
  }, [pathname, dispatch]);

  useEffect(() => {
    let timer = window.setTimeout(sleep, INACTIVE_MS);
    function sleep() {
      dispatch({ type: 'INACTIVE' });
    }
    function wake() {
      window.clearTimeout(timer);
      timer = window.setTimeout(sleep, INACTIVE_MS);
      if (useAvatarStore.getState().state === 'sleep') dispatch({ type: 'ACTIVITY' });
    }
    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, wake, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, wake));
    };
  }, [dispatch]);
}
