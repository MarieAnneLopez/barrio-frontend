import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface MenuLinkProps {
  to: string;
  /** Coincidencia exacta (para "/"). */
  end?: boolean;
  /** Enlace principal: en la display, en mayúsculas. */
  display?: boolean;
  /** Emoji decorativo de la categoría (el nombre lo da el texto). */
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Enlace del menú desplegable. NavLink pone aria-current="page" en la página activa, que además
 * se subraya con la regla de realce (site-header.css): el color nunca va solo.
 */
export function MenuLink({ to, end = false, display = false, icon, children }: MenuLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={`site-menu__link ui-pressable ui-btn--ghost flex min-h-11 items-center gap-3 rounded-sm px-2 text-fg no-underline ${
        display ? 'font-display text-step-2 uppercase' : 'text-step-0'
      }`}
    >
      {icon ? (
        <span aria-hidden="true" className="inline-flex w-6 justify-center">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 py-1 leading-tight">{children}</span>
    </NavLink>
  );
}
