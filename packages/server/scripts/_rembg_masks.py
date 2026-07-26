#!/usr/bin/env python
"""단어 카드 폴더 → 알파 마스크 폴더 (rembg / BiRefNet).

세션을 한 번만 만들어 전체를 돌린다(장당 세션을 새로 만들면 모델 로딩이 매번 붙는다).
모델은 최초 1회 ~973MB 를 ~/.u2net/ 에 받는다.

    python scripts/_rembg_masks.py <in_dir> <out_dir> [model]
"""
import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

in_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
model = sys.argv[3] if len(sys.argv) > 3 else "birefnet-general"
out_dir.mkdir(parents=True, exist_ok=True)

session = new_session(model)
files = sorted(p for p in in_dir.iterdir() if p.suffix.lower() in {".webp", ".png", ".jpg", ".jpeg"})
for i, src in enumerate(files, 1):
    dst = out_dir / f"{src.stem}.png"
    if dst.exists():
        continue
    remove(Image.open(src), session=session, only_mask=True).save(dst)
    print(f"{i}/{len(files)} {src.stem}", flush=True)
