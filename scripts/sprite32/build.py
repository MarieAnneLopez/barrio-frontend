"""Ciclos maestros de 32 cuadros desde las hojas de Martín (sprites32, D124).

Uso (venv de D108):  python -I scripts/sprite32/build.py [run wave sit]
Lee las copias de scripts/sprite/fuentes/*32.jpeg (nunca los originales de la raíz ni MINI MARIE.png)
y escribe scripts/sprite-cycles/<nombre>_ciclo.webp (sin pérdida, 8 × 4 al tamaño mayor), su paleta
<nombre>_paleta.json y la hoja de contacto docs/capturas/sprites32/nuevas/<nombre>_32.png.
Escala: entera con vecino más cercano si cabe (la carrera ×2, el saludo ×3); si hay que reducir (la
sentada), lanczos y luego cada píxel a su color de paleta con alfa binaria: nada borroso ni tonos nuevos.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).parent))
from grid import aligned_cells, window  # noqa: E402
from holes import fill_enclosed  # noqa: E402
from key import key_cell  # noqa: E402
from palette import sheet_palette  # noqa: E402
from scale import scale  # noqa: E402
from sheet import contact_sheet  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
BACKS = [(251, 12, 251), (160, 2, 168)]  # fondo magenta y línea de suelo (medidos en las hojas)
SEQ = {
    # Carrera: los cuadros 5–8 de la fila 1 son una sentadilla deforme (manos fundidas, cabeza 30 px
    # más abajo): se descartan y se usan los 29–32 de Martín, que son la misma fase del paso.
    'run': {'file': 'corriendo32.jpeg', 'anchor': 'line', 'height': 420, 'swap': {4: 28, 5: 29, 6: 30, 7: 31}},
    'wave': {'file': 'saludando32.jpeg', 'anchor': 'line', 'height': 640, 'swap': {}},
    'sit': {'file': 'sentada32.jpeg', 'anchor': 'top', 'height': 192, 'swap': {}},
}


def body_width(frames):
    """Ancho que ocupa el cuerpo (el trozo opaco mayor de cada cuadro), sin chispas ni corazones."""
    right = 0
    for f in frames:
        lab, n = ndimage.label(f[..., 3] > 0, structure=np.ones((3, 3)))
        big = np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))) + 1
        right = max(right, int(np.nonzero((lab == big).any(0))[0].max()) + 1)
    return right


def build(name, spec, sizes):
    rgb = np.asarray(Image.open(ROOT / 'scripts/sprite/fuentes' / spec['file']).convert('RGB'))
    palette, _ = sheet_palette(rgb)
    rgba, edges = key_cell(rgb, palette, BACKS)
    fill_enclosed(rgba, rgb, palette, BACKS[0])
    cells, box, grid = aligned_cells(rgb, rgba, spec['anchor'])
    frames = window(cells, box, 0, box[1] - box[0] + 1)
    frames = [frames[spec['swap'].get(i, i)] for i in range(32)]
    unit = spec['height'] // min(sizes)
    master, factor = scale(frames, spec['height'], unit, palette)
    cell_w = master[0].shape[1]
    box_w = cell_w if name != 'wave' else min(cell_w, -(-int(body_width(master)) // unit) * unit)
    # Pose intermedia aprobada para la transición del cuadro 6 al 8, en la paleta original.
    master[7] = np.asarray(Image.open(ROOT / 'scripts/sprite-cycles' / f'{name}_intermedio.png').convert('RGBA'))
    atlas = np.zeros((4 * spec['height'], 8 * cell_w, 4), np.uint8)
    for n, f in enumerate(master):
        atlas[(n // 8) * spec['height']:(n // 8 + 1) * spec['height'], (n % 8) * cell_w:(n % 8 + 1) * cell_w] = f
    out = ROOT / 'scripts/sprite-cycles'
    Image.fromarray(atlas, 'RGBA').save(out / f'{name}_ciclo.webp', lossless=True, method=6)
    (out / f'{name}_paleta.json').write_text(json.dumps(palette.tolist()) + '\n')
    contact_sheet(master, ROOT.parent / 'docs/capturas/sprites32/nuevas' / f'{name}_32.png')
    return {'cell': [cell_w, spec['height']], 'box': [box_w, spec['height']], 'factor': factor, 'palette': len(palette),
            'edgePixels': edges, 'window': box, 'grid': grid, 'swap': spec['swap']}


if __name__ == '__main__':
    scales = json.loads((ROOT / 'src/components/avatar/spriteScales.json').read_text())
    for name in sys.argv[1:] or list(SEQ):
        print(name, json.dumps(build(name, SEQ[name], scales[name]['sizes']), default=int))
