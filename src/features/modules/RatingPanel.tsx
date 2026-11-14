import { useTranslation } from 'react-i18next';
import { Stars } from '../../components/ui/Stars';
import { useApi } from '../../hooks/useApi';
import type { RatingSummary } from '../../lib/apiTypes';
import { RatingForm } from './RatingForm';

/** Promedio, últimas reseñas y formulario de un lugar. */
export function RatingPanel({ slug, itemId }: { slug: string; itemId: number }) {
  const { t, i18n } = useTranslation();
  const path = `/${slug}/${itemId}/calificaciones`;
  const summary = useApi<RatingSummary>(path);
  const format = (n: number) => n.toLocaleString(i18n.language === 'en' ? 'en-US' : 'es-CO');
  const data = summary.status === 'success' ? summary.data : undefined;
  const average = data?.promedio ?? null;

  return (
    <section aria-labelledby={`${path}-title`} className="flex flex-col gap-3 border-t border-line pt-4">
      <h3 id={`${path}-title`} className="m-0 text-step-0 text-fg">
        {t('ratings.title')}
      </h3>
      {data ? (
        <div className="flex flex-wrap items-center gap-3">
          <Stars
            value={average}
            label={average === null ? t('ratings.none') : t('ratings.average', { value: format(average) })}
          />
          <span className="text-step--1 text-fg-secondary">
            {average === null ? t('ratings.none') : t('ratings.count', { count: data.total })}
          </span>
        </div>
      ) : null}
      {data?.items.length ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {data.items.map((r) => (
            <li key={r.id} className="rounded-md border border-line p-3 text-step--1">
              <Stars value={r.estrellas} size={14} label={t('ratings.average', { value: format(r.estrellas) })} />
              {r.comentario ? <p className="m-0 mt-1 text-fg">{r.comentario}</p> : null}
              <p className="m-0 mt-1 text-fg-muted">{r.autor_nombre ?? t('ratings.anonymous')}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <RatingForm path={path} onRated={summary.retry} />
    </section>
  );
}
