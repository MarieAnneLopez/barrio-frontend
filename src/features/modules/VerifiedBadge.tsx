import { useTranslation } from 'react-i18next';
import type { ModuleItem } from '../../lib/apiTypes';
import { verificationKind, type VerificationKind } from './verification';

const STYLE: Record<VerificationKind, string> = {
  verified: 'border-success text-success',
  unverified: 'border-warning text-warning border-dashed',
  sample: 'border-line-strong text-fg-muted border-dashed',
};

export function VerifiedBadge({ item }: { item: Pick<ModuleItem, 'verified' | 'source_type'> }) {
  const { t } = useTranslation();
  const kind = verificationKind(item);
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[0.75rem] tracking-wide uppercase ${STYLE[kind]}`}
    >
      {t(`modules.${kind}`)}
    </span>
  );
}
