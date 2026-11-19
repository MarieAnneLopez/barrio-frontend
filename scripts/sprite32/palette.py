"""Paleta de una hoja de 32 cuadros (sprites32, D124): la de los colores que Martín entregó.

Se agrupan (k-medias con semilla fija) los píxeles del interior del dibujo, a 2 px o más del fondo,
donde la compresión JPEG no mezcla con el magenta. Así entran el rojo de los corazones y el amarillo
de las chispas si la hoja los trae, y no entra ningún tono de mezcla con el fondo. Los grupos casi
iguales (distancia < MERGE) se funden en el más poblado, para no inventar tonos intermedios.
"""
import numpy as np
from scipy.cluster.vq import kmeans2

from key import magenta_mask, near

MERGE = 14.0


def sheet_palette(rgb, k=32, seed=7):
    """Paleta (n, 3) uint8 de la hoja: centros redondeados de los grupos del interior del dibujo."""
    bg = magenta_mask(rgb)
    inner = ~near(bg, 2)
    samples = rgb[inner].astype(np.float64)
    rng = np.random.default_rng(seed)
    if len(samples) > 200_000:
        samples = samples[rng.choice(len(samples), 200_000, replace=False)]
    centers, labels = kmeans2(samples, k, seed=seed, minit='++', iter=30)
    counts = np.bincount(labels, minlength=k)
    order = np.argsort(-counts)
    kept, weights = [], []
    for i in order:
        if counts[i] == 0:
            continue
        c = centers[i]
        close = [j for j, q in enumerate(kept) if np.linalg.norm(q - c) < MERGE]
        if close:
            weights[close[0]] += counts[i]
            continue
        kept.append(c)
        weights.append(counts[i])
    pal = np.clip(np.rint(np.array(kept)), 0, 255).astype(np.uint8)
    keep = ~magenta_mask(pal[None])[0]
    return pal[keep], np.array(weights)[keep]
