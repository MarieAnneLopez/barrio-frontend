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
        `ui-pressable ui-btn--ghost relative flex min-h-11 items-center gap-3 rounded-md border border-transparent px-3 text-step--1 no-underline ${
          collapsed ? 'justify-center' : ''
        } ${isActive ? 'bg-glass font-semibold text-fg shadow-[var(--glow-active)]' : 'text-fg-secondary'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              aria-hidden="true"
              className="absolute top-2 bottom-2 left-0 w-1 rounded-full bg-active"
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
