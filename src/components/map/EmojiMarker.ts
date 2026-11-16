// Marcador DOM con el emoji de la categoría (§11.3.3): botón enfocable con nombre
// accesible. Texto con textContent (nunca innerHTML: los nombres vienen de datos).
import type { MarkerShape } from '../../lib/markerShape';

export interface MarkerContent {
  emoji: string;
  label: string;
  verified: boolean;
  /** D82, opción B: círculo, cuadrado o rombo según el grupo de la categoría. */
  shape: MarkerShape;
}

export function createEmojiMarker(content: MarkerContent, onSelect: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'map-marker';
  button.dataset.verified = String(content.verified);
  button.dataset.shape = content.shape;
  button.setAttribute('aria-label', content.label);
  const glyph = document.createElement('span');
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = content.emoji;
  // Etiqueta corta con el nombre: se ve solo al elegir el lugar (CSS).
  const name = document.createElement('span');
  name.className = 'map-marker__label';
  name.setAttribute('aria-hidden', 'true');
  name.textContent = content.label;
  button.append(glyph, name);
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onSelect();
  });
  return button;
}

export function setMarkerSelected(element: HTMLElement, selected: boolean): void {
  element.dataset.selected = String(selected);
  if (selected) element.setAttribute('aria-current', 'true');
  else element.removeAttribute('aria-current');
}
