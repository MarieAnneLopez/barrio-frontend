import type { ModuleItem } from './apiTypes';

export type VerificationKind = 'verified' | 'unverified' | 'sample';

type Audited = Pick<ModuleItem, 'verified' | 'source_type'>;

/** Estado de verificación (CLAUDE.md): verificado, "por verificar" o "dato de ejemplo". */
export function verificationKind(item: Audited): VerificationKind {
  if (item.verified) return 'verified';
  return item.source_type === 'seed' ? 'sample' : 'unverified';
}

/**
 * Registro de ejemplo (semilla inventada): sigue en la lista de su módulo con la etiqueta «Dato de
 * ejemplo», pero nunca se dibuja en la maqueta ni en los mapas (CLAUDE.md, D105).
 */
export function isSampleRecord(item: Audited): boolean {
  return verificationKind(item) === 'sample';
}
