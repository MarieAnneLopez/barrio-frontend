import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useApi } from '../../hooks/useApi';
import type { RankingEntry } from '../../lib/apiTypes';
import { CATEGORIES } from '../../lib/categoryConfig';
import { PageHeader } from '../pages/PageHeader';
import { RankingList } from './RankingList';

const LIMIT = 20;

/** Ranking (§11.3 punto 5): global o por categoría, por promedio de estrellas. */
export function RankingsPage() {
  const { t } = useTranslation();
  const selectId = useId();
  const [slug, setSlug] = useState('');
  const ranking = useApi<RankingEntry[]>(slug ? `/${slug}/ranking` : '/ranking', { limit: LIMIT });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('nav.ranking')} description={t('pages.ranking')} />
      <div className="flex max-w-sm flex-col gap-1">
        <label htmlFor={selectId} className="text-step--1 font-medium text-fg-secondary">
          {t('ranking.category')}
        </label>
        <select
          id={selectId}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="ui-field min-h-11 rounded-sm border-2 border-ink bg-stone px-3 text-step-0 text-on-stone"
        >
          <option value="">{t('ranking.all')}</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.emoji} {t(`categories.${c.slug}.name`)}
            </option>
          ))}
        </select>
      </div>
      {ranking.status === 'loading' ? <Skeleton className="h-24 w-full" lines={4} /> : null}
      {ranking.status === 'error' ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-sm border-2 border-error bg-surface p-6">
          <p className="m-0 text-fg">{t('modules.error')}</p>
          <Button variant="secondary" size="sm" onClick={ranking.retry}>{t('modules.retry')}</Button>
        </div>
      ) : null}
      {ranking.status === 'success' ? <RankingList entries={ranking.data} /> : null}
    </div>
  );
}
