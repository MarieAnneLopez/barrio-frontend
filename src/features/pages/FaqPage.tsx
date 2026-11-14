import { useTranslation } from 'react-i18next';
import { FaqSection } from '../faq/FaqSection';
import { PageHeader } from './PageHeader';

/** /preguntas: todas las preguntas frecuentes. */
export function FaqPage() {
  const { t } = useTranslation();
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader title={t('nav.faq')} description={t('faq.intro')} />
      <FaqSection headingLevel={2} />
    </div>
  );
}
