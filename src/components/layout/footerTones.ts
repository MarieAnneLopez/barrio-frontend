import { introVariant, type RevealColor } from '../intro/introVariant';
import { palettePlan, type ToneByWidth } from './palettePlan';

export type FooterTone = RevealColor;

/**
 * Tonos de las dos tarjetas del pie, en el celular y desde 768 px (D100). La entrada de cada ruta
 * revela crema, rosa claro o rosa (D101) en una caja grande que, en una página corta, movería el
 * reparto unos 10 puntos: por regla general las tarjetas toman los colores que la entrada no usó
 * (contacto en rosa, o crema si la entrada es rosa; creadora en rosa claro, o crema si la entrada es
 * rosa claro). Las rutas medidas una a una llevan su propio plan (palettePlan).
 */
export function footerTones(pathname: string): { contact: ToneByWidth; creator: ToneByWidth } {
  const plan = palettePlan(pathname.replace(/\/+$/, '') || '/');
  if (plan) return { contact: plan.contact, creator: plan.creator };
  const { reveal } = introVariant(pathname);
  const contact: FooterTone = reveal === 'rosa' ? 'crema' : 'rosa';
  const creator: FooterTone = reveal === 'rosa-claro' ? 'crema' : 'rosa-claro';
  return { contact: [contact, contact], creator: [creator, creator] };
}

/** Atributos de una tarjeta del pie: la clase .foot-card pinta el tono de cada ancho (surfaces.css). */
export const toneAttrs = ([m, d]: ToneByWidth) => ({ 'data-m': m, 'data-d': d });
