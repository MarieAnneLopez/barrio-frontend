import { useTranslation } from 'react-i18next';
import { StateIcon } from '../../components/ui/StateIcon';
import { PageHeader } from './PageHeader';

/**
 * Sección del Sidebar que todavía no tiene su página propia (D62). Desde D66
 * todas la tienen; queda como respaldo para una sección nueva del menú.
 */
export function SectionPage({ section }: { section: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title={t(`nav.${section}`)} description={t(`pages.${section}`)} eyebrow={t('construction.badge')} />
      <p className="m-0 rounded-sm border border-warning bg-surface p-4 text-fg">
        <StateIcon kind="warning" />
        {t('construction.notice')} {t(`construction.${section}`, { defaultValue: '' })}
      </p>
    </div>
  );
}
