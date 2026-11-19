"""Clave del fondo magenta de las hojas de 32 cuadros (sprites32, D124).

Mismo criterio que scripts/sprite/color.mjs (isMagentaFamily): fondo, línea de suelo y halos claros
caen en tono 280–320°, saturación >= 0,45 y brillo >= 0,45. Las mejillas (tono ~0°), los corazones
(~355°), las chispas (~50°) y las pulseras lila (~260°, poco saturadas) quedan fuera del rango.
El borde del dibujo (a 1 px del fondo) se desmezcla: cada píxel se explica como un color de la
paleta mezclado con el fondo o con la línea de suelo; si pesa más el fondo, es transparente.
"""
import numpy as np

HUE = (280.0, 320.0)
SAT_MIN = 0.45
VAL_MIN = 0.45


def hsv(rgb):
    """rgb uint8 (..., 3) -> tono en grados, saturación y brillo (0–1), como rgbToHsv."""
    f = rgb.astype(np.float64) / 255.0
    mx, mn = f.max(-1), f.min(-1)
    d = mx - mn
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    safe = np.where(d > 0, d, 1.0)
    h = np.where(mx == r, 60 * (((g - b) / safe) % 6),
                 np.where(mx == g, 60 * ((b - r) / safe + 2), 60 * ((r - g) / safe + 4)))
    h = np.where(d > 0, h, 0.0) % 360
    s = np.where(mx > 0, d / np.where(mx > 0, mx, 1.0), 0.0)
    return h, s, mx


def magenta_mask(rgb):
    """True donde el píxel es fondo, línea de suelo o halo claro (familia magenta)."""
    h, s, v = hsv(rgb)
    return (h >= HUE[0]) & (h <= HUE[1]) & (s >= SAT_MIN) & (v >= VAL_MIN)


def near(mask, r=1):
    """True donde hay un píxel de `mask` a distancia de Chebyshev <= r."""
    out = np.zeros_like(mask)
    pad = np.pad(mask, r)
    hgt, wid = mask.shape
    for dy in range(2 * r + 1):
        for dx in range(2 * r + 1):
            out |= pad[dy:dy + hgt, dx:dx + wid]
    return out


def nearest(colors, palette):
    """Índice del color de la paleta más cercano (distancia euclídea) para cada color."""
    d = ((colors[:, None, :].astype(np.float64) - palette[None, :, :]) ** 2).sum(-1)
    return d.argmin(1)


def unmix(colors, palette, backs):
    """Para cada color de borde: (índice de paleta, peso del dibujo) de la mejor mezcla con un fondo."""
    p = colors.astype(np.float64)
    best_err = np.full(len(p), np.inf)
    best_idx = np.zeros(len(p), dtype=int)
    best_a = np.ones(len(p))
    for back in backs:
        b = np.asarray(back, dtype=np.float64)
        cb = palette - b                                   # (K, 3)
        pb = p - b                                         # (N, 3)
        a = np.clip(pb @ cb.T / np.maximum((cb ** 2).sum(1), 1e-9), 0, 1)   # (N, K)
        err = ((pb[:, None, :] - a[..., None] * cb[None]) ** 2).sum(-1)
        k = err.argmin(1)
        e = err[np.arange(len(p)), k]
        better = e < best_err
        best_err[better], best_idx[better] = e[better], k[better]
        best_a[better] = a[np.arange(len(p)), k][better]
    return best_idx, best_a


def key_cell(rgb, palette, backs):
    """Celda RGB -> (RGBA con alfa binaria y solo colores de la paleta, píxeles desmezclados)."""
    bg = magenta_mask(rgb)
    edge = ~bg & near(bg, 1)
    inner = ~bg & ~edge
    out = np.zeros(rgb.shape[:2] + (4,), dtype=np.uint8)
    ys, xs = np.nonzero(inner)
    out[ys, xs, :3] = palette[nearest(rgb[ys, xs], palette)]
    out[ys, xs, 3] = 255
    ys, xs = np.nonzero(edge)
    idx, a = unmix(rgb[ys, xs], palette, backs)
    keep = a >= 0.5
    out[ys[keep], xs[keep], :3] = palette[idx[keep]]
    out[ys[keep], xs[keep], 3] = 255
    return out, int(edge.sum())

