import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from './PageHeader';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-6">
      <PageHeader title={t('notFound.title')} description={t('notFound.description')} />
      <Link
        to="/"
        className="ui-pressable ui-btn--primary inline-flex min-h-11 items-center rounded-md border border-interactive bg-interactive px-4 font-medium text-on-interactive no-underline"
      >
        {t('notFound.back')}
      </Link>
    </div>
  );
}
