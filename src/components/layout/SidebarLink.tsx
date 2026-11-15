import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Tooltip } from '../ui/Tooltip';

interface SidebarLinkProps {
  to: string;
  label: string;
  /** Icono SVG o emoji (decorativo: el nombre lo da `label`). */
  icon: ReactNode;
  collapsed: boolean;
  /** Coincidencia exacta (para "/"). */
  end?: boolean;
}

/**
 * Enlace del Sidebar: NavLink marca aria-current="page" y el indicador activo
 * (--interactive-active). Contraído, el texto pasa a sr-only y aparece un tooltip.
 */
export function SidebarLink({ to, label, icon, collapsed, end = false }: SidebarLinkProps) {
  const link = (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `ui-pressable ui-btn--ghost relative flex min-h-11 items-center gap-3 rounded-sm border-2 border-transparent px-3 text-step--1 no-underline ${
          collapsed ? 'justify-center' : ''
        } ${isActive ? 'ui-nav-active bg-pink font-semibold text-on-pink' : 'text-fg'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1 size-2 -translate-y-1/2 bg-ink"
            />
          ) : null}
          <span aria-hidden="true" className="inline-flex w-6 justify-center text-step-0">
            {icon}
          </span>
          <span className={collapsed ? 'sr-only' : 'min-w-0 py-2 leading-snug'}>{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <li className="list-none">
      {collapsed ? (
        <Tooltip content={label} side="right" delay={200}>
          {link}
        </Tooltip>
      ) : (
        link
      )}
    </li>
  );
}
