import { useTranslation } from 'react-i18next';
import type { Fuente } from '../../lib/apiTypes';

/** Sección Fuentes (D55): cada fuente con su entidad, tipo y nota de uso. */
export function SourcesList({ fuentes, consultado }: { fuentes: Fuente[]; consultado: string }) {
  const { t, i18n } = useTranslation();
  const date = new Date(`${consultado}T00:00:00Z`).toLocaleDateString(
    i18n.language === 'en' ? 'en-US' : 'es-CO',
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' },
  );

  return (
    <div className="band-text flex flex-col gap-4">
      <p className="m-0 text-step--1 text-fg-muted">{t('history.sources.consulted', { date })}</p>
      <ol className="m-0 flex flex-col gap-4 pl-5">
        {fuentes.map((fuente) => (
          <li key={fuente.url ?? fuente.titulo} className="text-fg-secondary">
            {fuente.url ? (
              <a
                href={fuente.url}
                target="_blank"
                rel="noreferrer"
                className="break-words text-accent underline underline-offset-4"
              >
                {fuente.titulo}
              </a>
            ) : (
              <span className="text-fg">{fuente.titulo}</span>
            )}
            <span className="text-fg-muted"> · {t(`history.sources.type.${fuente.tipo}`)}</span>
            <p className="m-0 text-step--1">{fuente.entidad}</p>
            {fuente.nota ? <p className="m-0 text-step--1 text-fg-muted">{fuente.nota}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
