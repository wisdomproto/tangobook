#!/usr/bin/env node
/** PNG 의 baked 체크무늬 배경(흰/회색) 을 transparent 로 변환.
 *  4 모서리에서 floodfill — 색 변화 threshold 안 영역만 transparent. 일러스트 외곽까지만.
 *  대상: packages/client/public/icons/mode/{book,video,word}.png
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targets = ['book.png', 'video.png', 'word.png'].map((f) =>
  path.join(__dirname, '..', '..', 'client', 'public', 'icons', 'mode', f)
);

const py = `
import sys
from PIL import Image, ImageDraw
for fp in sys.argv[1:]:
    img = Image.open(fp).convert('RGBA')
    w, h = img.size
    # 4 모서리에서 floodfill — threshold 60 (체크무늬 색 변화 ~50 보다 큼, 일러스트는 보통 100+ 차이)
    for corner in [(0,0), (w-1,0), (0,h-1), (w-1,h-1)]:
        try:
            ImageDraw.floodfill(img, corner, (0,0,0,0), thresh=60)
        except Exception as e:
            print(f'  floodfill error at {corner} for {fp}: {e}')
    img.save(fp)
    px = img.getpixel((10, 10))
    print(f'{fp}: corner now {px}')
`;

const r = spawnSync('python', ['-c', py, ...targets], { stdio: 'inherit' });
process.exit(r.status ?? 0);
