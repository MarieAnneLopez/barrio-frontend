import { useTranslation } from 'react-i18next';
import { Stars } from '../../components/ui/Stars';
import { useApi } from '../../hooks/useApi';
import type { RatingSummary } from '../../lib/apiTypes';
import { AuthGuard } from '../auth/AuthGuard';
import { LoginPrompt } from '../auth/LoginPrompt';
import { useRecentRating } from '../ranking/recentRating';
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
          {/* La cifra, como en Ranking: no depende del contorno fino que separa llenas de vacías. */}
          <span className="text-step--1 text-fg-secondary">
            {average === null ? null : <span aria-hidden="true" className="font-mono">{format(average)} · </span>}
            {average === null ? t('ratings.none') : t('ratings.count', { count: data.total })}
          </span>
        </div>
      ) : null}
      {data?.items.length ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {data.items.map((r) => (
            <li key={r.id} className="rounded-md border border-line p-3 text-step--1">
              <span className="flex items-center gap-2">
                <Stars value={r.estrellas} size={14} label={t('ratings.average', { value: format(r.estrellas) })} />
                <span aria-hidden="true" className="font-mono text-fg-secondary">{format(r.estrellas)}</span>
              </span>
              {r.comentario ? <p className="m-0 mt-1 text-fg">{r.comentario}</p> : null}
              <p className="m-0 mt-1 text-fg-muted">{r.autor_nombre ?? t('ratings.anonymous')}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <AuthGuard role="user" fallback={
        <p className="m-0 text-step--1 text-fg-secondary"><LoginPrompt message={t('ratings.needLogin')} /></p>
      }>
        <RatingForm path={path} onRated={() => { useRecentRating.getState().mark(slug, itemId); summary.retry(); }} />
      </AuthGuard>
    </section>
  );
}
