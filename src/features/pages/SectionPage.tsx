import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from './PageHeader';

/** Dónde está hoy el contenido de cada sección en construcción (D62). */
const MEANWHILE: Record<string, { to: string; label: string }> = {
  gallery: { to: '/categorias/zonas-verdes', label: 'categories.zonas-verdes.name' },
};

/** Sección del Sidebar que todavía no tiene su página propia: lo dice y lleva a lo que ya existe. */
export function SectionPage({ section }: { section: string }) {
  const { t } = useTranslation();
  const meanwhile = MEANWHILE[section];
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title={t(`nav.${section}`)} description={t(`pages.${section}`)} eyebrow={t('construction.badge')} />
      <p className="m-0 rounded-md border border-warning p-4 text-fg">
        {t('construction.notice')} {t(`construction.${section}`, { defaultValue: '' })}{' '}
        {meanwhile ? (
          <Link to={meanwhile.to} className="text-accent underline underline-offset-4">
            {t('chat.go', { place: t(meanwhile.label) })}
          </Link>
        ) : null}
      </p>
    </div>
  );
}
