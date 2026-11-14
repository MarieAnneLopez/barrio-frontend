import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Stars } from '../../components/ui/Stars';
import type { RankingEntry } from '../../lib/apiTypes';
import { categoryPath, findCategory } from '../../lib/categoryConfig';

/** Lista ordenada: posición, categoría, lugar (enlace a su ficha), estrellas y votos. */
export function RankingList({ entries }: { entries: RankingEntry[] }) {
  const { t, i18n } = useTranslation();
  const format = (n: number) => n.toLocaleString(i18n.language === 'en' ? 'en-US' : 'es-CO');

  if (!entries.length) {
    return <p className="m-0 rounded-md border border-dashed border-line p-6 text-fg-secondary">{t('ranking.empty')}</p>;
  }
  return (
    <ol aria-label={t('ranking.list')} className="m-0 flex list-none flex-col gap-3 p-0">
      {entries.map((entry, index) => {
        const category = findCategory(entry.categoria_slug);
        return (
          <li
            key={`${entry.categoria_slug}-${entry.objeto_id}`}
            className="flex flex-wrap items-center gap-4 rounded-md border border-line bg-surface p-4"
          >
            <span className="w-8 font-mono text-step-1 text-accent" aria-hidden="true">
              {index + 1}
            </span>
            <span className="sr-only">{t('ranking.position', { position: index + 1 })}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                to={`${categoryPath(entry.categoria_slug)}?lugar=${entry.objeto_id}`}
                className="break-words text-step-0 text-fg underline-offset-4 hover:underline"
              >
                {entry.nombre}
              </Link>
              <span className="text-step--1 text-fg-muted">
                {category?.emoji} {t(`categories.${entry.categoria_slug}.name`)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Stars value={entry.promedio} label={t('ratings.average', { value: format(entry.promedio) })} />
              <span className="font-mono text-step--1 text-fg-secondary">
                {format(entry.promedio)} · {t('ratings.count', { count: entry.total })}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
