import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Hito } from '../../lib/apiTypes';
import { useA11yStore } from '../../store/a11yStore';
import { SourceLinks } from './SourceLinks';
import { useScrollReveal } from './useScrollReveal';

/** Línea de tiempo vertical (§11.3.1) con ScrollTrigger; cada hito muestra su fuente. */
export function Timeline({ hitos }: { hitos: Hito[] }) {
  const { t } = useTranslation();
  const root = useRef<HTMLOListElement>(null);
  const reduced = useA11yStore((s) => s.reducedMotion);
  useScrollReveal(root, hitos.length > 0, reduced);

  return (
    <ol ref={root} aria-label={t('history.timeline')} className="m-0 flex list-none flex-col gap-0 p-0">
      {hitos.map((hito) => {
        const key = `content:history.${hito.anio}-${hito.orden}`;
        return (
          <li key={hito.id} data-reveal className="relative flex gap-4 border-l-2 border-line pb-8 pl-6 last:pb-0">
            <span aria-hidden="true" className="absolute top-2 -left-[7px] size-3 rounded-full bg-accent" />
            <div className="flex min-w-0 flex-col gap-2">
              <p className="m-0 font-mono text-step-2 text-accent">{hito.anio}</p>
              <h3 className="m-0 text-step-1 text-fg">{t(`${key}.title`, { defaultValue: hito.titulo })}</h3>
              <p className="m-0 max-w-prose text-fg-secondary">
                {t(`${key}.description`, { defaultValue: hito.descripcion })}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-step--1">
                {hito.verified ? null : (
                  <span className="rounded-sm border border-warning px-2 py-0.5 text-warning">
                    {t('history.unverified')}
                  </span>
                )}
                <SourceLinks refs={hito.source_ref} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
