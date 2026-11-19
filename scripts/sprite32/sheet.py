"""Hoja de contacto de un ciclo de 32 cuadros (sprites32, D124): 8 × 4 a tamaño real, numerados.

Cada cuadro va sobre gris claro, con su número (1–32) arriba a la izquierda, para revisarlos uno a
uno con la vista. Es un PNG sin pérdida y a 1:1: lo que se revisa es lo que va al atlas.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

GAP = 6
BACK = (222, 222, 222, 255)


def contact_sheet(frames, path):
    """Escribe en `path` los 32 cuadros (RGBA) en 8 columnas y 4 filas, numerados."""
    h, w = frames[0].shape[:2]
    label = 18
    sheet = Image.new('RGBA', (8 * (w + GAP) + GAP, 4 * (h + label + GAP) + GAP), (255, 255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    for n, frame in enumerate(frames):
        x = GAP + (n % 8) * (w + GAP)
        y = GAP + (n // 8) * (h + label + GAP)
        draw.text((x + 2, y + 2), str(n + 1), fill=(0, 0, 0, 255))
        cell = Image.new('RGBA', (w, h), BACK)
        cell.alpha_composite(Image.fromarray(np.ascontiguousarray(frame), 'RGBA'))
        sheet.paste(cell, (x, y + label))
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    sheet.convert('RGB').save(path, optimize=True)
