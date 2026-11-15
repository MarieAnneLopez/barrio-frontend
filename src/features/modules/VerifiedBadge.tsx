import { useTranslation } from 'react-i18next';
import type { ModuleItem } from '../../lib/apiTypes';
import { verificationKind, type VerificationKind } from './verification';

// v2 (D68): placas con texto vino; el símbolo y la palabra dicen el estado, no el color.
const STYLE: Record<VerificationKind, string> = {
  verified: 'bg-stone text-on-stone border-ink',
  unverified: 'bg-pink text-on-pink border-ink border-dashed',
  sample: 'bg-stone text-on-stone border-ink border-dashed',
};
const MARK: Record<VerificationKind, string> = { verified: '✓', unverified: '?', sample: '◇' };

export function VerifiedBadge({ item }: { item: Pick<ModuleItem, 'verified' | 'source_type'> }) {
  const { t } = useTranslation();
  const kind = verificationKind(item);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border-2 px-2 py-0.5 font-mono text-[0.75rem] tracking-wide uppercase ${STYLE[kind]}`}
    >
      <span aria-hidden="true">{MARK[kind]}</span>
      {t(`modules.${kind}`)}
    </span>
  );
}
