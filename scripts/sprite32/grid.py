"""Rejilla fija 8 × 4 de las hojas de 32 cuadros (sprites32, D124), sin cajas por cuadro.

Las columnas miden 200 px (1600 / 8) y cada corte cae en columnas vacías. Las filas no miden 225
exactos (en la sentada los pies de la fila 1 bajan hasta y = 231), así que cada corte de fila va al
centro del hueco vacío más cercano a k · 225. Cada fila se alinea entera, los 8 cuadros juntos, por
su ancla: la línea de suelo que Martín dibujó bajo la fila (carrera y saludo) o lo más alto del pelo
(sentada, que no trae suelo). Así no se inventa movimiento: dentro de una fila nada se mueve.
"""
import numpy as np

from key import hsv

COLS, ROWS = 8, 4


def cuts(empty, size, count):
    """Centros de los huecos vacíos (True = vacío) más cercanos a size·k, k = 1 … count−1."""
    out = [0]
    for k in range(1, count):
        target = size * k
        free = np.nonzero(empty)[0]
        near = free[np.abs(free - target) <= size // 3]
        if len(near) == 0:
            raise ValueError(f'No hay hueco vacío cerca de {target}')
        run = [v for v in near if abs(v - near[np.abs(near - target).argmin()]) <= 40]
        lo = hi = near[np.abs(near - target).argmin()]
        while lo - 1 in run:
            lo -= 1
        while hi + 1 in run:
            hi += 1
        out.append((lo + hi) // 2)
    out.append(len(empty))
    return out


def ground_line(rgb, top, bottom):
    """Primera fila de la banda donde la línea de suelo (magenta oscuro) cubre >= 25 % del ancho."""
    h, s, v = hsv(rgb[top:bottom])
    line = (h >= 280) & (h <= 320) & (s >= 0.45) & (v >= 0.45) & (v <= 0.85)
    rows = np.nonzero(line.sum(1) >= 0.25 * rgb.shape[1])[0]
    if len(rows) == 0:
        raise ValueError(f'Sin línea de suelo entre y = {top} e y = {bottom}')
    return top + int(rows[0])


def aligned_cells(rgb, rgba, anchor):
    """Las 32 celdas (fila a fila), cada fila desplazada por su ancla, y la caja común."""
    opaque = rgba[..., 3] > 0
    xs = cuts(~opaque.any(0), rgb.shape[1] // COLS, COLS)
    ys = cuts(~opaque.any(1), rgb.shape[0] // ROWS, ROWS)
    if xs[1:-1] != [rgb.shape[1] // COLS * k for k in range(1, COLS)]:
        xs = [rgb.shape[1] // COLS * k for k in range(COLS + 1)]
        assert all(not opaque[:, x].any() for x in xs[1:-1]), 'Un corte de columna toca el dibujo'
    anchors = []
    for r in range(ROWS):
        if anchor == 'line':
            anchors.append(ground_line(rgb, ys[r], ys[r + 1]))
        else:
            anchors.append(ys[r] + int(np.nonzero(opaque[ys[r]:ys[r + 1]].any(1))[0][0]))
    cells, boxes = [], []
    for r in range(ROWS):
        for c in range(COLS):
            cell = rgba[ys[r]:ys[r + 1], xs[c]:xs[c + 1]]
            yy, xx = np.nonzero(cell[..., 3])
            boxes.append((xx.min(), xx.max(), yy.min() + ys[r] - anchors[r], yy.max() + ys[r] - anchors[r]))
            cells.append((cell, ys[r] - anchors[r]))
    b = np.array(boxes)
    box = (int(b[:, 0].min()), int(b[:, 1].max()), int(b[:, 2].min()), int(b[:, 3].max()))
    return cells, box, {'cols': xs, 'rows': ys, 'anchors': anchors}


def window(cells, box, pad_top, width):
    """Cada celda recortada a la caja común (alto + pad_top arriba; ancho `width` desde box[0])."""
    x0, _x1, y0, y1 = box
    height = y1 - y0 + 1 + pad_top
    out = []
    for cell, shift in cells:
        w = np.zeros((height, width, 4), dtype=np.uint8)
        for y in range(cell.shape[0]):
            ty = y + shift - y0 + pad_top
            if 0 <= ty < height:
                part = cell[y, x0:x0 + width]
                w[ty, :len(part)] = part
        out.append(w)
    return out
