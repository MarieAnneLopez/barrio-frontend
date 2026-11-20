import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toneAttrs } from '../../components/layout/footerTones';
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

// Paleta D100: cada tema en una tarjeta, alternando rosa claro y crema; el enlace, botón secundario.
const TONE = 'ui-card--paper tone-papel';
const GO = 'ui-pressable ui-btn--secondary inline-flex min-h-11 items-center gap-2 self-start rounded-sm border border-fg bg-secondary px-4 font-medium text-on-mark no-underline';

/** /ayuda: cómo usar la plataforma (§5.3 del enunciado: «ayudas» en la barra lateral, H28). */
export function HelpPage() {
  const { t } = useTranslation();
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title={t('nav.help')} description={t('pages.help')} />
      {SECTIONS.map(({ key, to, label }, index) => (
        <details
          key={key}
          open={index === 0}
          aria-labelledby={`ayuda-${key}`}
          className={`ui-card flex max-w-3xl flex-col gap-3 p-6 ${index % 2 ? '' : TONE} ${index === 2 ? 'foot-card tone-papel' : ''}`}
          {...(index === 2 ? toneAttrs(['rosa-claro', 'rosa']) : {})}
        >
          <summary className="cursor-pointer">
            <h2 id={`ayuda-${key}`} className="m-0 inline text-step-1 text-fg">{t(`help.sections.${key}.title`)}</h2>
          </summary>
          <p className="m-0 max-w-prose text-fg-secondary">{t(`help.sections.${key}.body`)}</p>
          {to && label ? (
            <Link to={to} className={GO}>
              {t('chat.go', { place: t(label) })}
            </Link>
          ) : null}
        </details>
      ))}
    </div>
  );
}
