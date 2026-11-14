import { useTranslation } from 'react-i18next';

/** Dominio legible de una URL de fuente (bogota.gov.co, es.wikipedia.org…). */
const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, '');

/** Enlaces a las fuentes de un registro; varias se separan con " | " (como source_ref). */
export function SourceLinks({ refs }: { refs: string | null }) {
  const { t } = useTranslation();
  const urls = (refs ?? '').split(' | ').filter((ref) => ref.startsWith('https://'));
  if (!urls.length) return null;
  return (
    <span className="text-fg-muted">
      {t('modules.source')}:{' '}
      {urls.map((url, i) => (
        <span key={url}>
          {i > 0 ? ' · ' : null}
          <a href={url} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4">
            {hostOf(url)}
          </a>
        </span>
      ))}
    </span>
  );
}
