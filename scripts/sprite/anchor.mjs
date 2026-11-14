// Anclaje por frame: punto medio de los pies y altura sobre el suelo común.

/**
 * @param {Uint8Array} inPose máscara del frame (w × h)
 * @param {number} frameY fila de la hoja donde empieza el frame
 * @param {number} groundY fila de la hoja donde empieza el suelo (sombra)
 * @returns {{ footX: number, footY: number, offsetY: number }}
 *   footX/footY en coordenadas del frame; offsetY = px de los pies sobre el suelo.
 */
export function computeAnchor(inPose, w, h, frameY, groundY) {
  let bottom = -1;
  for (let y = h - 1; y >= 0 && bottom < 0; y--) {
    for (let x = 0; x < w; x++) {
      if (inPose[y * w + x]) {
        bottom = y;
        break;
      }
    }
  }
  if (bottom < 0) throw new Error('Frame vacío: no hay píxeles de la pose');

  // Banda de pies: el 8 % inferior de la altura (mínimo 14 px), para que
  // en walk y jump entren ambas botas aunque estén a distinta altura.
  const band = Math.max(14, Math.round(h * 0.08));
  let minX = w;
  let maxX = -1;
  for (let y = Math.max(0, bottom - band); y <= bottom; y++) {
    for (let x = 0; x < w; x++) {
      if (!inPose[y * w + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }
  const footX = Math.round((minX + maxX) / 2);
  const offsetY = groundY - 1 - (frameY + bottom);
  return { footX, footY: bottom, offsetY };
}
