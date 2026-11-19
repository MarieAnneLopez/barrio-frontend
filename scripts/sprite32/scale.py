"""Escala de los ciclos de 32 cuadros (sprites32, D124) sin borrar ni inventar colores.

Para ampliar, vecino más cercano: cada píxel de salida es uno de la hoja, sin tonos nuevos ni
desenfoque. La carrera (212 filas) y el saludo (215) no caben en ×2 y ×3 exactos, así que unas
pocas filas y columnas se repiten una vez menos; el dibujo de la hoja no sigue una rejilla de píxel
regular, así que no se nota. Para reducir (la sentada), lanczos sobre alfa premultiplicada y luego
`snap`: alfa binaria y cada píxel a su color de la paleta de la hoja.
"""
import numpy as np
from PIL import Image

from key import nearest


def snap(rgba, palette):
    """Alfa binaria (desde 128) y cada píxel opaco al color de paleta más cercano."""
    out = np.zeros_like(rgba)
    ys, xs = np.nonzero(rgba[..., 3] >= 128)
    out[ys, xs, :3] = palette[nearest(rgba[ys, xs, :3], palette)]
    out[ys, xs, 3] = 255
    return out


def scale(frames, height, unit, palette):
    """Cuadros al alto `height` con ancho múltiplo de `unit`; devuelve (cuadros, factor)."""
    h, w = frames[0].shape[:2]
    wm = -(-round(w * height / h) // unit) * unit
    while round(wm * h / height) < w:
        wm += unit
    wp = round(wm * h / height)
    out = []
    for f in frames:
        src = np.zeros((h, wp, 4), np.uint8)
        src[:, :w] = f
        img = Image.fromarray(src, 'RGBA')
        if height >= h:
            out.append(np.asarray(img.resize((wm, height), Image.NEAREST)).copy())
        else:
            small = img.convert('RGBa').resize((wm, height), Image.LANCZOS).convert('RGBA')
            out.append(snap(np.asarray(small), palette))
    return out, height / h
