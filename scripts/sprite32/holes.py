"""Huecos chicos del clave (sprites32, D124): el contorno morado de las pulseras cae en el rango
magenta de key.py; si un hueco encerrado por el dibujo no es magenta puro, es dibujo."""
import numpy as np
from scipy import ndimage

from key import nearest


def fill_enclosed(out, rgb, palette, back, area=60, pure=80.0):
    """Huecos chicos encerrados por el dibujo: lo que no es magenta puro (el contorno morado de las
    pulseras cae en el rango del clave) vuelve al dibujo con su color de paleta."""
    lab, _ = ndimage.label(out[..., 3] == 0)
    hgt, wid = lab.shape
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl[0].start == 0 or sl[1].start == 0 or sl[0].stop == hgt or sl[1].stop == wid:
            continue
        ys, xs = np.nonzero(lab[sl] == i)
        if len(ys) > area:
            continue
        ys, xs = ys + sl[0].start, xs + sl[1].start
        far = np.linalg.norm(rgb[ys, xs].astype(np.float64) - back, axis=1) > pure
        out[ys[far], xs[far], :3] = palette[nearest(rgb[ys[far], xs[far]], palette)]
        out[ys[far], xs[far], 3] = 255
