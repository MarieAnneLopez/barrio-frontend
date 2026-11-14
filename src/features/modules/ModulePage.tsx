import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { findCategory } from '../../lib/categoryConfig';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PageHeader } from '../pages/PageHeader';
import { ModuleDetailView } from './ModuleDetailView';

/** Ruta de cada uno de los 14 módulos: /categorias/:slug. */
export function ModulePage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const category = findCategory(slug);
  if (!category) return <NotFoundPage />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t('categories.module', { id: category.id })}
        emoji={category.emoji}
        title={t(`categories.${category.slug}.name`)}
        description={t(`categories.${category.slug}.description`)}
      />
      <ModuleDetailView key={category.slug} category={category} />
    </div>
  );
}
