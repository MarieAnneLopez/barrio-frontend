import { useTranslation } from 'react-i18next';
import { PageHeader } from './PageHeader';

/** Página de una sección del Sidebar; su contenido se suma en su hito. */
export function SectionPage({ section }: { section: string }) {
  const { t } = useTranslation();
  return <PageHeader title={t(`nav.${section}`)} description={t(`pages.${section}`)} />;
}
