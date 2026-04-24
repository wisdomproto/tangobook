"""
Hori sprite sheet processing pipeline.

입력: packages/client/public/mascot/hori/<name>/<name>-sheet-2x2.png
       (Gemini가 생성한 2x2 grid, 매젠타 #FF00FF 배경)

처리:
  1. 매젠타 배경 → alpha 투명 (flood-fill)
  2. 2x2 슬라이싱 (4프레임)
  3. bbox 기반 정렬 (발바닥 y + 중심 x 통일, 높이 편차 1.5%로 clamp)
  4. GIF 생성 (지정 duration)
  5. strip preview 생성

출력 (같은 폴더):
  - <name>-sheet-2x2-clean.png  # 매젠타 제거 원본
  - <name>-frame-1.png ~ -4.png # 정렬된 개별 프레임
  - <name>.webp                  # 애니메이션 (풀 RGBA alpha)
  - <name>-strip-preview.png     # 가로 스트립 프리뷰

사용법:
  python scripts/process-sprite-sheet.py <name> [duration_ms]

예시:
  python scripts/process-sprite-sheet.py idle 250    # idle, 4fps
  python scripts/process-sprite-sheet.py run 100     # run, 10fps
  python scripts/process-sprite-sheet.py jump 120    # jump, ~8fps
"""

import sys
from pathlib import Path
from collections import deque
from PIL import Image

MASCOT_ROOT = Path('packages/client/public/mascot/hori')
MAX_SCALE_DEV = 0.015  # 높이 편차 허용 범위 (1.5%)


def magenta_to_alpha(src: Path, dst: Path) -> None:
    """매젠타 배경(#FF00FF)을 alpha=0으로 변환 (코너에서 flood-fill)."""
    img = Image.open(src).convert('RGBA')
    w, h = img.size
    px = img.load()
    visited = bytearray(w * h)

    def is_magenta(r: int, g: int, b: int) -> bool:
        # 매젠타 계열: r,b 높고 g 낮음 (순수 매젠타 + 어두운 보라 셀 경계선)
        if r > 100 and b > 100 and max(r, b) - g > 80:
            return True
        # 체커 패턴 (레거시): 회색 또는 밝은 흰색 (r≈g≈b, 루미넌스 > 180)
        if abs(r - g) <= 15 and abs(g - b) <= 15 and abs(r - b) <= 15 and max(r, g, b) > 180:
            return True
        return False

    q: deque = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        idx = y * w + x
        if visited[idx]:
            continue
        visited[idx] = 1
        r, g, b, _ = px[x, y]
        if not is_magenta(r, g, b):
            continue
        px[x, y] = (r, g, b, 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    # 2차 패스: 고립된 매젠타 섬 제거 (캐릭터 뒤에 갇힌 매젠타 블롭)
    # 엄격 조건 — 호리 cheek blush(249,184,184)나 pink nose는 건드리지 않도록
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            # 순수 매젠타 계열: r,b 매우 높고 g 매우 낮음
            if r > 180 and b > 180 and g < 60 and max(r, b) - g > 120:
                px[x, y] = (r, g, b, 0)

    img.save(dst)


def slice_2x2(sheet: Image.Image) -> list[Image.Image]:
    """2x2 그리드를 4장(top-left, top-right, bottom-left, bottom-right)으로 슬라이싱."""
    w, h = sheet.size
    cw, ch = w // 2, h // 2
    return [
        sheet.crop((0, 0, cw, ch)),
        sheet.crop((cw, 0, w, ch)),
        sheet.crop((0, ch, cw, h)),
        sheet.crop((cw, ch, w, h)),
    ]


def align_frames(frames: list[Image.Image]) -> list[Image.Image]:
    """첫 프레임 기준으로 발바닥 y + 중심 x 정렬, 높이 편차는 MAX_SCALE_DEV로 clamp."""
    bboxes = [f.getbbox() for f in frames]
    if any(b is None for b in bboxes):
        raise ValueError('빈 프레임 감지 — 매젠타 제거 결과 확인 필요')

    ref = bboxes[0]
    ref_cx = (ref[0] + ref[2]) // 2
    ref_bottom = ref[3]
    ref_h = ref[3] - ref[1]

    aligned = []
    for i, (frame, bbox) in enumerate(zip(frames, bboxes), start=1):
        cw, ch = frame.size
        bx1, by1, bx2, by2 = bbox
        bh = by2 - by1
        bcx = (bx1 + bx2) // 2

        # 높이 편차가 허용 범위 초과 시 스케일 조정
        ratio = bh / ref_h
        if abs(ratio - 1) > MAX_SCALE_DEV:
            target = 1 + MAX_SCALE_DEV if ratio > 1 else 1 - MAX_SCALE_DEV
            scale = target / ratio
            frame = frame.resize(
                (int(cw * scale), int(ch * scale)), Image.LANCZOS
            )
            new_bbox = frame.getbbox()
            if new_bbox is None:
                continue
            bcx = (new_bbox[0] + new_bbox[2]) // 2
            by2 = new_bbox[3]

        dx = ref_cx - bcx
        dy = ref_bottom - by2

        canvas = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
        canvas.paste(frame, (dx, dy), frame)
        aligned.append(canvas)

        scale_pct = (ratio - 1) * 100
        print(
            f'  frame {i}: orig scale {scale_pct:+.1f}% | '
            f'shifted dx={dx:+d} dy={dy:+d}'
        )

    return aligned


def build_webp(frames: list[Image.Image], dst: Path, duration_ms: int) -> None:
    """애니메이션 WebP — GIF보다 풀 RGBA alpha 지원, 파일 작음."""
    frames[0].save(
        dst,
        save_all=True,
        append_images=frames[1:],
        duration=duration_ms,
        loop=0,
        format='WEBP',
        lossless=True,
        quality=90,
        method=6,
    )


def build_strip_preview(frames: list[Image.Image], dst: Path) -> None:
    w, h = frames[0].size
    sheet = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f, (i * w, 0), f)
    sheet.thumbnail((2048, 512))
    sheet.save(dst)


def process(name: str, duration_ms: int) -> None:
    folder = MASCOT_ROOT / name
    src = folder / f'{name}-sheet-2x2.png'
    if not src.exists():
        print(f'ERROR: {src} not found', file=sys.stderr)
        sys.exit(1)

    print(f'processing "{name}" (duration={duration_ms}ms)')

    clean = folder / f'{name}-sheet-2x2-clean.png'
    print(f'1/4 magenta -> alpha: {clean.name}')
    magenta_to_alpha(src, clean)

    print('2/4 slicing 2x2')
    raw_frames = slice_2x2(Image.open(clean))

    print('3/4 aligning frames')
    aligned = align_frames(raw_frames)

    for i, f in enumerate(aligned, start=1):
        f.save(folder / f'{name}-frame-{i}.png')

    webp = folder / f'{name}.webp'
    print(f'4/4 building WebP: {webp.name}')
    build_webp(aligned, webp, duration_ms)

    strip = folder / f'{name}-strip-preview.png'
    build_strip_preview(aligned, strip)

    print(f'done. {len(aligned)} frames + webp + strip in {folder}')


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    name = sys.argv[1]
    duration_ms = int(sys.argv[2]) if len(sys.argv) >= 3 else 100
    process(name, duration_ms)


if __name__ == '__main__':
    main()
