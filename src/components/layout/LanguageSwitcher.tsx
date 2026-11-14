import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, isLanguage, setLanguage } from '../../i18n/i18n';

/** Selector ES/EN (§11.2.2): persiste en localStorage y actualiza <html lang>. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = isLanguage(i18n.language) ? i18n.language : 'es';

  return (
    <div
      role="group"
      aria-label={t('header.language')}
      className="inline-flex rounded-md border border-line bg-surface p-1"
    >
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = lng === current;
        return (
          <button
            key={lng}
            type="button"
            lang={lng}
            aria-pressed={active}
            onClick={() => void setLanguage(lng)}
            className={`ui-pressable min-h-9 min-w-11 rounded-sm px-2 font-mono text-step--1 font-medium uppercase tracking-wider ${
              active ? 'bg-interactive text-on-interactive' : 'ui-btn--ghost text-fg-secondary'
            }`}
          >
            {lng}
            <span className="sr-only"> ({t(`header.languageNames.${lng}`)})</span>
          </button>
        );
      })}
    </div>
  );
}
