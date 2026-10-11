"""Render the existing print-sticker PDF labels without redrawing their glyphs."""
from pathlib import Path
import json
import fitz

root = Path(__file__).resolve().parents[3]
pdf = root / 'output/pdf/tango-hangul-block-stickers-a4.pdf'
layout = json.loads(pdf.with_name(pdf.stem + '-layout.json').read_text(encoding='utf-8'))
out = root / 'docs/marketing/assets/investor-20261010/blender'
doc = fitz.open(pdf)
for letter, name in [('ㄱ', 'original-label-giyeok'), ('ㅏ', 'original-label-a')]:
    item = next(x for x in layout if x['character'] == letter)
    page = doc[item['page'] - 1]
    mm = 72 / 25.4
    x, y, w, h = (item[key] * mm for key in ['x_mm', 'y_mm', 'size_mm', 'height_mm'])
    clip = fitz.Rect(x, page.rect.height - y - h, x + w, page.rect.height - y)
    page.get_pixmap(matrix=fitz.Matrix(8, 8), clip=clip, alpha=False).save(out / (name + '.png'))
    print(letter, 'label_mm', item['size_mm'], item['height_mm'])
