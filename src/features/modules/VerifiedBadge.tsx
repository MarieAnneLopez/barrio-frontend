import { useTranslation } from 'react-i18next';
import type { ModuleItem } from '../../lib/apiTypes';
import { verificationKind, type VerificationKind } from './verification';

// Insignias de contorno (D85): el símbolo y la palabra dicen el estado, no el color; la línea
// punteada marca lo que no está verificado.
const STYLE: Record<VerificationKind, string> = {
  verified: 'border-line-strong text-fg',
  unverified: 'border-line-strong border-dashed text-fg-secondary',
  sample: 'border-line-strong border-dashed text-fg-secondary',
};
const MARK: Record<VerificationKind, string> = { verified: '✓', unverified: '?', sample: '◇' };

export function VerifiedBadge({ item }: { item: Pick<ModuleItem, 'verified' | 'source_type'> }) {
  const { t } = useTranslation();
  const kind = verificationKind(item);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[0.75rem] tracking-wide uppercase ${STYLE[kind]}`}
    >
      <span aria-hidden="true">{MARK[kind]}</span>
      {t(`modules.${kind}`)}
    </span>
  );
}
