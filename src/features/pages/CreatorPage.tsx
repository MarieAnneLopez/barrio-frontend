import { useTranslation } from 'react-i18next';
import { CreatorProfileSection } from '../profile/CreatorProfileSection';
import { PageHeader } from './PageHeader';

/** /creadora: Perfil de la Creadora. */
export function CreatorPage() {
  const { t } = useTranslation();
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader title={t('nav.creator')} description={t('pages.creator')} />
      <CreatorProfileSection headingLevel={2} />
    </div>
  );
}
