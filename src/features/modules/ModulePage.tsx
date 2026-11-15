import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { findCategory } from '../../lib/categoryConfig';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PageHeader } from '../pages/PageHeader';
import { ModuleDetailView } from './ModuleDetailView';

/** Ruta de cada uno de los 14 módulos: /categorias/:slug. */
export function ModulePage() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const [params] = useSearchParams();
  const category = findCategory(slug);
  // ?lugar=ID abre la ficha de ese lugar (enlaces del ranking).
  const lugar = Number(params.get('lugar'));
  if (!category) return <NotFoundPage />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t('categories.module', { id: category.id })}
        emoji={category.emoji}
        title={t(`categories.${category.slug}.name`)}
        description={t(`categories.${category.slug}.description`)}
      />
      {category && i18n.exists(`categories.${category.slug}.notice`) ? (
        <p role="note" className="m-0 max-w-3xl rounded-sm border-2 border-warning border-dashed bg-surface p-4 text-step--1 text-fg">
          {t(`categories.${category.slug}.notice`)}
        </p>
      ) : null}
      <ModuleDetailView key={category.slug} category={category} initialOpenId={lugar > 0 ? lugar : null} />
    </div>
  );
}
