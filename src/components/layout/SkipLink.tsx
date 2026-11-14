import { useTranslation } from 'react-i18next';

/** Enlace "Saltar al contenido principal": visible solo al recibir foco. */
export function SkipLink({ target }: { target: string }) {
  const { t } = useTranslation();
  return (
    <a
      href={`#${target}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-md focus:bg-interactive focus:px-4 focus:py-2 focus:text-on-interactive"
    >
      {t('a11y.skipToContent')}
    </a>
  );
}
