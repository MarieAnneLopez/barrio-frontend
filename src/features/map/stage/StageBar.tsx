import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useHeroStore } from '../../../three/heroStore';

const GLASS_BUTTON =
  'vidrio vidrio--boton tone-papel ui-pressable pointer-events-auto inline-flex min-h-11 shrink-0 items-center justify-center text-fg';

interface StageBarProps {
  title: string;
  emoji?: string | undefined;
  panelId: string;
  open: boolean;
  onToggle: () => void;
  menuRef: RefObject<HTMLButtonElement>;
}

/**
 * Fila de arriba del escenario: el botón de tres barras (siempre visible, 44 × 44 px, vidrio con
 * borde negro de 2 px: ≥ 3:1 sobre el mapa de día y de noche), el título de la sección (h1) y
 * «Recentrar». Escape con el foco en el botón cierra el panel. La esquina de arriba a la derecha
 * queda libre para Mini Marie (Mapa 3D) y, en pantallas anchas, para la barra de accesibilidad.
 */
export function StageBar({ title, emoji, panelId, open, onToggle, menuRef }: StageBarProps) {
  const { t } = useTranslation();
  const recenter = useHeroStore((s) => s.recenter);

  return (
    <div className="pointer-events-none absolute top-3 right-14 left-3 z-30 flex items-center gap-2 md:right-16">
      <button
        ref={menuRef}
        type="button"
        aria-label={t('stage.menu')}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || !open) return;
          event.preventDefault();
          onToggle();
        }}
        className={`${GLASS_BUTTON} size-11`}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <path d="M3 5.5h16M3 11h16M3 16.5h16" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
        </svg>
      </button>
      <h1 className="vidrio tone-papel pointer-events-auto m-0 flex min-h-11 min-w-0 items-center gap-2 px-3 font-sans text-step-0 leading-tight font-semibold text-fg">
        {emoji ? <span aria-hidden="true">{emoji}</span> : null}
        <span className="truncate">{title}</span>
      </h1>
      <button type="button" onClick={recenter} className={`${GLASS_BUTTON} ml-auto px-3 text-step--1 font-semibold`}>
        {t('hero.recenter')}
      </button>
    </div>
  );
}
