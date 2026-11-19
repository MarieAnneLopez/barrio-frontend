import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, isLanguage, setLanguage } from '../../i18n/i18n';

/**
 * Selector ES/EN (§11.2.2): persiste en localStorage y actualiza <html lang>. El idioma activo lleva
 * la línea del texto además del fondo de selección: sobre la cabecera, el color solo no llega a 3:1.
 */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = isLanguage(i18n.language) ? i18n.language : 'es';

  return (
    <div
      role="group"
      aria-label={t('header.language')}
      className="inline-flex rounded-sm border border-line p-1"
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
            className={`ui-pressable min-h-9 min-w-11 rounded-sm border px-2 font-mono text-step--1 font-medium uppercase tracking-wider ${
              active ? 'border-fg bg-active text-on-active' : 'ui-btn--ghost border-transparent text-fg-secondary'
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
