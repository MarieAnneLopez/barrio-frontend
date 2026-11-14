import { useTranslation } from 'react-i18next';
import type { ModuleItem } from '../../lib/apiTypes';

const isUrl = (ref: string) => /^https:\/\//.test(ref);

/**
 * Trazabilidad visible (CLAUDE.md): tipo de fuente y referencia. Las URL de la
 * fuente (OSM, portal de datos abiertos) se enlazan; varias se separan con " | ".
 */
export function SourceLine({ item }: { item: Pick<ModuleItem, 'source_type' | 'source_ref'> }) {
  const { t } = useTranslation();
  const refs = (item.source_ref ?? '').split(' | ').filter(Boolean);

  return (
    <p className="m-0 border-t border-line pt-3 text-step--1 text-fg-muted">
      <span>{t('modules.source')}: </span>
      <span>{t(`modules.sourceType.${item.source_type}`)}</span>
      {refs.map((ref) => (
        <span key={ref}>
          {' · '}
          {isUrl(ref) ? (
            <a href={ref} target="_blank" rel="noreferrer" className="break-all text-accent underline underline-offset-4">
              {ref.replace(/^https:\/\/(www\.)?/, '')}
            </a>
          ) : (
            <span className="break-all">{ref}</span>
          )}
        </span>
      ))}
    </p>
  );
}
