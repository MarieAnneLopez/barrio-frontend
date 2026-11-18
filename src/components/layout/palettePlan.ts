import type { RevealColor } from '../intro/introVariant';

/** Tono de una pieza en el celular y desde 768 px, en ese orden. */
export type ToneByWidth = readonly [RevealColor, RevealColor];

export interface PalettePlan {
  /** Color que revela la entrada de la sección (D101), en el celular… */
  reveal: RevealColor;
  /** …y desde 768 px, si cambia (el reparto se mide por ancho; tampoco repite con sus vecinas). */
  revealWide?: RevealColor;
  /** Tarjeta de contacto del pie. */
  contact: ToneByWidth;
  /** Tarjeta Perfil de la Creadora del pie. */
  creator: ToneByWidth;
}

/**
 * Plan de color por ruta (D100). El reparto se mide por página como se ve, pantalla a pantalla y sin
 * fotos ni mapas, y debe quedar a ±3 puntos de 60/18/12/5/5. Lo que más lo mueve son tres piezas
 * grandes: la caja de la entrada y las dos tarjetas del pie; su color sale de esa medición (informe
 * de la gran actualización). Dos secciones seguidas del menú nunca repiten color de entrada. Las
 * rutas sin plan usan la regla general (introVariant y footerTones).
 */
export const PALETTE_PLANS: Readonly<Record<string, PalettePlan>> = {
  '/': { reveal: 'crema', contact: ['rosa', 'rosa'], creator: ['rosa-claro', 'rosa'] },
  '/historia': { reveal: 'rosa', contact: ['rosa-claro', 'rosa-claro'], creator: ['rosa', 'rosa-claro'] },
  '/ranking': { reveal: 'crema', contact: ['rosa', 'rosa'], creator: ['rosa-claro', 'crema'] },
  '/galeria': { reveal: 'rosa-claro', contact: ['rosa', 'rosa'], creator: ['crema', 'crema'] },
  '/preguntas': { reveal: 'crema', revealWide: 'rosa', contact: ['rosa', 'crema'], creator: ['rosa-claro', 'crema'] },
  '/creadora': { reveal: 'rosa-claro', revealWide: 'crema', contact: ['rosa', 'rosa'], creator: ['crema', 'crema'] },
  '/ayuda': { reveal: 'rosa', contact: ['crema', 'crema'], creator: ['crema', 'crema'] },
  '/acceso': { reveal: 'rosa-claro', revealWide: 'crema', contact: ['rosa', 'rosa'], creator: ['crema', 'crema'] },
  '/creditos-fotos': { reveal: 'crema', contact: ['crema', 'rosa-claro'], creator: ['crema', 'rosa-claro'] },
  '/no-existe': { reveal: 'crema', contact: ['rosa', 'crema'], creator: ['rosa-claro', 'rosa'] },
};

export const palettePlan = (path: string): PalettePlan | undefined => PALETTE_PLANS[path];
