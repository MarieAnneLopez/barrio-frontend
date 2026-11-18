import { denserThan } from '../../lib/density';

const WIDE = '(min-width: 640px)';

/**
 * Fuentes del logo por densidad (D86), las mismas para el póster y para su ciclo: 32 px en móvil y
 * 48 px desde 640 px, con el múltiplo exacto en pantallas densas (64 o 96 px). Van dentro de un
 * <picture>, antes de su <img> (que lleva el de 32).
 */
export function LogoSources({ file }: { file: (size: number) => string }) {
  return (
    <>
      <source media={denserThan(1.01, WIDE)} srcSet={file(96)} />
      <source media={WIDE} srcSet={file(48)} />
      <source media={denserThan(2.01)} srcSet={file(96)} />
      <source media={denserThan(1.01)} srcSet={file(64)} />
    </>
  );
}
