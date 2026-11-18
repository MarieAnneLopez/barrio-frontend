// Colores de la escena leídos de los tokens del design system en el momento de pintar: así la cinta
// sigue al alto contraste y nunca lleva colores escritos en el código.
import { cssVar } from '../../../lib/cssToken';
import { type LabelPalette, readLabelPalette } from './ribbonLabel';

export interface RibbonTheme {
  /** Color de la tarjeta mientras llega su foto. */
  placeholder: string;
  /** Color del brillo especular. */
  sheen: string;
  /** Foco doble: por fuera y por dentro. */
  ring: string;
  ringInner: string;
  /** Líneas de la rejilla del suelo. */
  line: string;
  label: LabelPalette;
}

export function readTheme(): RibbonTheme {
  return {
    placeholder: cssVar('--bg-accent', 'gray'),
    sheen: cssVar('--bg-primary', 'white'),
    ring: cssVar('--focus-ring', 'white'),
    ringInner: cssVar('--focus-ring-inner', 'black'),
    line: cssVar('--border-ink', 'gray'),
    label: readLabelPalette(),
  };
}
