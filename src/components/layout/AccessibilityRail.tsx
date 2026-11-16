import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { FONT_SCALES, fontScaleOf, useA11yStore } from '../../store/a11yStore';
import { RailButton } from './RailButton';

const ICON = {
  contrast: 'M12 3a9 9 0 1 0 0 18V3Zm0 0a9 9 0 0 1 0 18',
  motion: 'M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0M3 6h4M3 18h4',
  reset: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  a11y: 'M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-7 2 7 1.5L19 8m-7 1.5V14m0 0-3 7m3-7 3 7',
  // "A" con menos/más: iconos sin texto, para que el nombre sea solo la etiqueta (WCAG 2.5.3).
  smaller: 'M3 19 8 6l5 13M5 14h6M16 9h6',
  larger: 'M3 19 8 6l5 13M5 14h6M16 9h6M19 6v6',
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Barra de accesibilidad fija a la derecha (§11.2.3); en móvil se pliega. */
export function AccessibilityRail() {
  const { t } = useTranslation();
  const panelId = useId();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [open, setOpen] = useState(false);
  const a11y = useA11yStore();
  const percent = Math.round(fontScaleOf(a11y.scaleIndex) * 1000) / 10;
  const visible = isDesktop || open;

  return (
    <aside
      aria-label={t('a11yRail.label')}
      className="fixed right-0 bottom-24 z-40 flex flex-col items-center gap-1 rounded-l-sm md:top-1/2 md:bottom-auto md:-translate-y-1/2 border border-r-0 border-line-strong bg-surface p-1"
    >
      {isDesktop ? null : (
        <RailButton
          label={open ? t('a11yRail.close') : t('a11yRail.open')}
          onClick={() => setOpen((value) => !value)}
          expanded={open}
          controls={panelId}
        >
          <Icon d={ICON.a11y} />
        </RailButton>
      )}
      <div id={panelId} hidden={!visible} className="flex flex-col items-center gap-1">
        <RailButton label={t('a11yRail.decrease')} onClick={a11y.decreaseFont}
          disabled={a11y.scaleIndex === 0}>
          <Icon d={ICON.smaller} />
        </RailButton>
        <p role="status" className="m-0 font-mono text-[0.75rem] tracking-tight whitespace-nowrap text-fg-secondary">
          <span aria-hidden="true">{percent}%</span>
          <span className="sr-only">{t('a11yRail.scale', { value: percent })}</span>
        </p>
        <RailButton label={t('a11yRail.increase')} onClick={a11y.increaseFont}
          disabled={a11y.scaleIndex === FONT_SCALES.length - 1}>
          <Icon d={ICON.larger} />
        </RailButton>
        <RailButton label={t('a11yRail.contrast')} onClick={a11y.toggleHighContrast}
          pressed={a11y.highContrast}>
          <Icon d={ICON.contrast} />
        </RailButton>
        <RailButton label={t('a11yRail.motion')} onClick={a11y.toggleReducedMotion}
          pressed={a11y.reducedMotion}>
          <Icon d={ICON.motion} />
        </RailButton>
        <RailButton label={t('a11yRail.reset')} onClick={a11y.reset}>
          <Icon d={ICON.reset} />
        </RailButton>
      </div>
    </aside>
  );
}
