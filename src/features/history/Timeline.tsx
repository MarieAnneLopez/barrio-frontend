import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toneAttrs } from '../../components/layout/footerTones';
import type { Fuente, Hito } from '../../lib/apiTypes';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SourceLinks } from './SourceLinks';
import { titleTone, WIDE_ROSA } from './timelineTone';
import { useScrollReveal } from './useScrollReveal';
import { isWebGLAvailable } from './hinge/webglSupport';
import { TimelineStage } from './TimelineStage';

/** Etiqueta de un hito sin fuente oficial (D56): «Prensa» si lo respalda un medio, si no «Por verificar». */
function badgeOf(hito: Hito, press: Set<string>) {
  if (hito.verified) return null;
  const refs = (hito.source_ref ?? '').split(' | ');
  return refs.some((ref) => press.has(ref)) ? 'press' : 'unverified';
}

// Paleta D100: tarjetas alternas rosa claro y crema; el año va en una etiqueta amarilla (texto negro).
const TONE = 'ui-card--paper tone-papel';

/** Línea de tiempo vertical (§11.3.1); cada hito muestra su fuente. */
export function Timeline({ hitos, fuentes }: { hitos: Hito[]; fuentes: Fuente[] }) {
  const { t } = useTranslation();
  const press = new Set(fuentes.flatMap((f) => (f.tipo === 'prensa' && f.url ? [f.url] : [])));
  const root = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion(); // barra de accesibilidad o sistema (H30)
  // HINGE: cada tarjeta lleva su cubierta de 12 piezas. Sin WebGL 2, si falla o con movimiento reducido,
  // las tarjetas se ven completas de inmediato, como siempre.
  const [hingeOn, setHingeOn] = useState(isWebGLAvailable);
  const hingeOff = useCallback(() => setHingeOn(false), []);
  const covers = hingeOn && !reduced;
  useScrollReveal(root, hitos.length > 0, reduced);

  return (
    <ol ref={root} aria-label={t('history.timeline')} className="m-0 flex list-none flex-col gap-0 p-0">
      {hitos.map((hito, index) => {
        const key = `content:history.${hito.anio}-${hito.orden}`;
        const badge = badgeOf(hito, press);
        return (
          <li key={hito.id} data-reveal className="relative flex gap-4 pb-6 pl-6 last:pb-0">
            <span aria-hidden="true" data-reveal-line className="absolute inset-y-0 left-0 w-px origin-top bg-line-strong" />
            <span aria-hidden="true" className="absolute top-7 -left-[5px] size-[9px] rounded-full bg-highlight" />
            <div
              className={`ui-card relative flex min-w-0 max-w-3xl flex-1 flex-col gap-2 p-5 ${index % 2 ? '' : TONE} ${index % 4 === 3 ? WIDE_ROSA : ''}`}
              {...(index % 4 === 3 ? toneAttrs(['crema', 'rosa']) : {})}
            >
              <p className="m-0 self-start rounded-sm bg-mark px-3 font-display text-step-3 text-on-mark md:px-4 md:py-1">{hito.anio}</p>
              <h3 className={`m-0 ${titleTone(index)}`}>{t(`${key}.title`, { defaultValue: hito.titulo })}</h3>
              <p className="m-0 max-w-prose text-fg-secondary">
                {t(`${key}.description`, { defaultValue: hito.descripcion })}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-step--1">
                {badge === 'unverified' ? (
                  <span className="rounded-sm border border-dashed border-line-strong px-2 py-0.5 text-fg-secondary">
                    {t('history.unverified')}
                  </span>
                ) : null}
                {badge === 'press' ? (
                  <span className="rounded-sm border border-line-strong px-2 py-0.5 text-fg-secondary">
                    {t('history.press')}
                  </span>
                ) : null}
                <SourceLinks refs={hito.source_ref} />
              </div>
              {covers ? <TimelineStage year={String(hito.anio)} onUnavailable={hingeOff} /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
