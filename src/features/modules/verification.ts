import type { ModuleItem } from '../../lib/apiTypes';

export type VerificationKind = 'verified' | 'unverified' | 'sample';

/** Estado de verificación (CLAUDE.md): verificado, "por verificar" o "dato de ejemplo". */
export function verificationKind(item: Pick<ModuleItem, 'verified' | 'source_type'>): VerificationKind {
  if (item.verified) return 'verified';
  return item.source_type === 'seed' ? 'sample' : 'unverified';
}
