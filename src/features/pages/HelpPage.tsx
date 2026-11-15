import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from './PageHeader';

/** Secciones de la ayuda (texto en help.sections.<key>) y el enlace que lleva a esa parte de la app. */
const SECTIONS: readonly { key: string; to?: string; label?: string }[] = [
  { key: 'navigate', to: '/categorias/centros-educativos', label: 'categories.centros-educativos.name' },
  { key: 'accessibility' },
  { key: 'language' },
  { key: 'chat' },
  { key: 'account', to: '/acceso', label: 'nav.access' },
  { key: 'data', to: '/historia', label: 'nav.history' },
  { key: 'contact', to: '/creadora', label: 'nav.creator' },
];

/** /ayuda: cómo usar la plataforma (§5.3 del enunciado: «ayudas» en la barra lateral, H28). */
export function HelpPage() {
  const { t } = useTranslation();
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader title={t('nav.help')} description={t('pages.help')} />
      {SECTIONS.map(({ key, to, label }) => (
        <section key={key} aria-labelledby={`ayuda-${key}`} className="flex flex-col gap-2">
          <h2 id={`ayuda-${key}`} className="m-0 text-step-1 text-fg">{t(`help.sections.${key}.title`)}</h2>
          <p className="m-0 max-w-prose text-fg-secondary">{t(`help.sections.${key}.body`)}</p>
          {to && label ? (
            <Link to={to} className="self-start text-accent underline underline-offset-4">
              {t('chat.go', { place: t(label) })}
            </Link>
          ) : null}
        </section>
      ))}
    </div>
  );
}
