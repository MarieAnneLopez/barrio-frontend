// Lo que cambia en los uniformes compartidos al cambiar el lienzo de tamaño o el tema.
import type { RibbonLayout } from './ribbonGeometry';
import { LABEL } from './ribbonLabel';
import { SHADING } from './ribbonShading';
import type { SharedUniforms } from './ribbonShader';
import type { RibbonTheme } from './ribbonTheme';

/** Radio de las esquinas, en px. */
export const CORNER_PX = 20;

export function applyLayout(shared: SharedUniforms, layout: RibbonLayout): void {
  shared.uHalfW.value = layout.halfW;
  shared.uSize.value.set(layout.cardW, layout.cardH);
  shared.uRadius.value = CORNER_PX * layout.unitsPerPixel;
  shared.uPixel.value = layout.unitsPerPixel;
  shared.uLabelBand.value = Math.min(1, (LABEL.band * layout.unitsPerPixel) / layout.cardH);
  shared.uDepthRange.value = SHADING.depthShare * layout.halfW;
}

export function applyColors(shared: SharedUniforms, theme: RibbonTheme): void {
  shared.uPlaceholder.value.set(theme.placeholder);
  shared.uSheen.value.set(theme.sheen);
  shared.uRing.value.set(theme.ring);
  shared.uRingInner.value.set(theme.ringInner);
}
