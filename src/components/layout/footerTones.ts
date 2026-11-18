import { introVariant } from '../intro/introVariant';

export type FooterTone = 'crema' | 'rosa-claro' | 'rosa';

/**
 * Tonos de las dos tarjetas del pie (D100). La entrada de cada ruta revela crema, rosa claro o rosa
 * (D101) en una caja grande: en una página corta eso movería el reparto de color unos 10 puntos.
 * Las tarjetas del pie toman los colores que la entrada no usó, así cada página suma lo mismo:
 * contacto en rosa (crema si la entrada ya es rosa) y creadora en rosa claro (crema si la entrada
 * ya es rosa claro).
 */
export function footerTones(pathname: string): { contact: FooterTone; creator: FooterTone } {
  const { reveal } = introVariant(pathname);
  return {
    contact: reveal === 'rosa' ? 'crema' : 'rosa',
    creator: reveal === 'rosa-claro' ? 'crema' : 'rosa-claro',
  };
}

/** Clases que se suman a .ui-card: crema con línea de 1 px, o superficie de color con texto negro. */
export const TONE_CLASS: Record<FooterTone, string> = {
  crema: '',
  'rosa-claro': 'ui-card--paper tone-papel',
  rosa: 'ui-card--rosa tone-papel',
};
