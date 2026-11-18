import { useTranslation } from 'react-i18next';
import type { CategoryConfig } from '../../lib/categoryConfig';

/**
 * Cabeza del panel de un módulo: su número, su descripción y, si la tiene, su advertencia. El título
 * (h1) va siempre a la vista, junto al botón del panel (StageBar).
 */
export function ModuleIntro({ category }: { category: CategoryConfig }) {
  const { t, i18n } = useTranslation();
  const notice = `categories.${category.slug}.notice`;
  return (
    <div className="flex flex-col gap-2">
      <p className="ui-eyebrow m-0">{t('categories.module', { id: category.id })}</p>
      <p className="m-0">{t(`categories.${category.slug}.description`)}</p>
      {i18n.exists(notice) ? (
        <p role="note" className="m-0 rounded-sm border border-warning border-dashed bg-surface p-3 text-step--1 text-fg">
          {t(notice)}
        </p>
      ) : null}
    </div>
  );
}
