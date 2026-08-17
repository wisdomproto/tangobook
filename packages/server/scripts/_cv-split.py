"""평면 색 그림 → 도안 + 정답본 (OpenCV).

기존 JS 구현과 접근이 다르다:
  옛 방식 — 모델이 그린 **검은 획을 살려서** 선으로 쓴다.
             그래서 굵기·부슬거림·2중선과 계속 싸웠다(잉크 16%, 얼룩, 이중 테두리).
  새 방식 — 검은 획을 **버리고**, 색 영역의 경계를 findContours 로 뽑아
             **내가 정한 굵기로 다시 그린다**. 굵기가 입력이 아니라 출력이 된다.

정답본은 같은 색 영역에서 나오므로 순도는 여전히 원리상 100%.
"""
import sys, json
import cv2
import numpy as np

S = 1024
LINE_PX = 5          # 다시 그릴 윤곽선 굵기 — 이제 우리가 정한다
MIN_AREA_RATIO = 0.004   # 이보다 작은 칸은 이웃에 흡수 (네 살 손가락이 못 짚는다)
MAX_SHAPE_THICK = 30     # 형태선으로 인정할 최대 두께 — 그보다 두꺼우면 칠해진 면이다


def load(path):
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f"read fail: {path}")
    h, w = img.shape[:2]
    scale = S / max(h, w)
    img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    canvas = np.full((S, S, 3), 255, np.uint8)
    y0, x0 = (S - img.shape[0]) // 2, (S - img.shape[1]) // 2
    canvas[y0:y0 + img.shape[0], x0:x0 + img.shape[1]] = img
    return canvas


def quantize(img, k):
    """색을 k개로 줄인다. mean-shift 로 **경계를 지키며** 먼저 뭉갠 뒤 k-means.

    🔴 median 블러는 경계까지 뭉개서 모양이 상하는데, pyrMeanShiftFiltering 은
       색이 비슷한 곳만 평탄화하고 경계는 남긴다 — 실지렁이 잔선의 근본 대책이다.
    """
    sm = cv2.pyrMeanShiftFiltering(img, sp=12, sr=40)
    Z = sm.reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(Z, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    return centers.astype(np.uint8)[labels.flatten()].reshape(img.shape)


def absorb_small(quant):
    """작은 색 조각을 가장 많이 맞닿은 이웃 색으로 흡수한다."""
    flat = quant.reshape(-1, 3)
    colors, inv = np.unique(flat, axis=0, return_inverse=True)
    lab = inv.reshape(S, S)
    out = quant.copy()
    min_area = int(S * S * MIN_AREA_RATIO)
    for ci in range(len(colors)):
        mask = (lab == ci).astype(np.uint8)
        n, comp, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
        for j in range(1, n):
            if stats[j, cv2.CC_STAT_AREA] >= min_area:
                continue
            piece = (comp == j).astype(np.uint8)
            ring = cv2.dilate(piece, np.ones((3, 3), np.uint8)) - piece
            ys, xs = np.nonzero(ring)
            if len(ys) == 0:
                continue
            nb = quant[ys, xs]
            vals, cnts = np.unique(nb, axis=0, return_counts=True)
            out[comp == j] = vals[cnts.argmax()]
    return out


def build(quant):
    """색 영역 **사이의 경계**만 뽑아 정해진 굵기로 그린다.

    🔴 영역마다 각자 윤곽을 그리면 맞닿은 두 영역이 같은 자리를 두 번 그려 **2중선**이 된다.
       그래서 윤곽이 아니라 **경계 픽셀**(오른쪽/아래 이웃과 라벨이 다른 자리)을 먼저 구하고
       그 위에서 한 번만 그린다.
    🔴 캔버스 테두리도 배경이라는 색 영역의 윤곽이라 사각 액자가 그려진다 — 테두리에 닿는
       라벨(=바깥 여백)은 아예 제외한다.
    """
    flat = quant.reshape(-1, 3)
    colors, inv = np.unique(flat, axis=0, return_inverse=True)
    lab = inv.reshape(S, S).astype(np.int32)

    # 바깥 여백: 테두리에 닿는 연결 덩어리
    outside = np.zeros((S, S), np.uint8)
    for ci in range(len(colors)):
        m = (lab == ci).astype(np.uint8)
        n, comp, stats, _ = cv2.connectedComponentsWithStats(m, 8)
        for j in range(1, n):
            x, y, w, h = stats[j, :4]
            if x == 0 or y == 0 or x + w >= S or y + h >= S:
                outside[comp == j] = 1

    edge = np.zeros((S, S), np.uint8)
    edge[:, :-1] |= (lab[:, :-1] != lab[:, 1:]).astype(np.uint8)
    edge[:-1, :] |= (lab[:-1, :] != lab[1:, :]).astype(np.uint8)
    # 바깥 여백과 그림이 만나는 자리는 **그림의 실루엣**이라 남기고,
    # 여백끼리의 경계(캔버스 가장자리)는 지운다.
    edge[(outside == 1) & (np.roll(outside, -1, axis=1) == 1)] = 0
    edge[:, -1] = 0
    edge[-1, :] = 0

    # 🔴 경계를 **findContours 로 다시 뽑지 않는다** — 경계는 이미 1px 짜리 얇은 띠라,
    #    거기서 윤곽을 뽑으면 그 띠의 양쪽을 각각 그려 또 2중선이 되고 가는 선(깃대)은 끊긴다.
    #    띠 자체를 원하는 굵기로 **부풀리면** 된다. 굵기는 여전히 우리가 정한다.
    edge = cv2.dilate(edge, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (LINE_PX, LINE_PX)))
    # 티끌 제거 — 이어진 선은 길고, 잔선은 짧은 조각으로 남는다
    n, comp, stats, _ = cv2.connectedComponentsWithStats(edge, 8)
    for j in range(1, n):
        if stats[j, cv2.CC_STAT_AREA] < 60:
            edge[comp == j] = 0
    return np.where(edge > 0, 0, 255).astype(np.uint8)


def split_ink(img):
    """검은 획을 두 종류로 가른다.

    🔴 원본의 검은 획에는 성격이 다른 둘이 섞여 있다:
       - **경계선**: 두 색 사이를 가르는 획. 그 자체를 두면 획이 하나의 색 영역이 되어
         양쪽 경계가 각각 그어지며 **2중선**이 된다 → 지우고 색끼리 맞닿게 한다.
       - **형태선**: 깃대·안테나처럼 한쪽이 배경인, 그 자체가 그림인 획. 지우면 깃발이
         공중에 뜬다 → 그대로 선으로 남긴다.
       구분은 획을 지운 뒤 **양옆 색이 같은가**로 한다.

    반환: (획을 지운 그림, 남겨야 할 형태선 마스크)
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    ink = (gray < 90).astype(np.uint8)
    filled = cv2.inpaint(img, cv2.dilate(ink, np.ones((3, 3), np.uint8)), 5, cv2.INPAINT_TELEA)

    # 🔴 판정은 **조각이 아니라 픽셀 단위**로 한다. 깃대·윤곽선·지붕이 전부 한 덩어리로
    #    이어져 있어(실측: 잉크 6조각 중 하나가 158,708px) 조각으로는 못 가른다.
    #    각 잉크 픽셀 둘레에 배경이 얼마나 있는지를 본다 — 배경에 둘러싸인 획이 형태선이다.
    bg = (cv2.cvtColor(filled, cv2.COLOR_BGR2GRAY) > 235).astype(np.float32)
    around = cv2.blur(bg, (25, 25))
    keep = ((ink == 1) & (around > 0.55)).astype(np.uint8)
    # 🔴 배경에 둘러싸였다고 다 형태선은 아니다 — **검게 칠해진 면**(성 지붕)도 그렇게 보인다.
    #    가르는 기준은 **두께**다: 실측으로 깃대·깃발 6~8px vs 칠해진 지붕 106px 로 자릿수가 다르다.
    #    거리변환으로 두께를 재서 굵은 덩어리만 통째로 뺀다(침식·팽창으로 하면 가는 깃대까지 먹는다).
    # 🔴 판정은 **픽셀마다 자기 두께**로 한다. 덩어리 단위로 하면 깃대가 지붕과 이어져 있어서
    #    (실측: 한 덩어리 62,409px, y 42~979, 최대두께 107) 지붕 때문에 깃대까지 통째로 지워졌다.
    #    거리변환 값이 곧 그 자리의 두께/2 이므로, 두꺼운 속만 빼고 가는 획은 남긴다.
    dist = cv2.distanceTransform(keep, cv2.DIST_L2, 5)
    thick = (dist * 2 > MAX_SHAPE_THICK).astype(np.uint8)
    # 두꺼운 속을 지우면 그 면의 **테두리**가 가는 획으로 남아 다시 선이 된다 — 넉넉히 부풀려 뺀다.
    thick = cv2.dilate(thick, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (MAX_SHAPE_THICK, MAX_SHAPE_THICK)))
    keep[thick > 0] = 0
    # 형태선은 이어져야 뜻이 있다 — 몇 픽셀짜리 자투리는 버린다
    n, comp, stats, _ = cv2.connectedComponentsWithStats(keep, 8)
    for j in range(1, n):
        if stats[j, cv2.CC_STAT_AREA] < 80:
            keep[comp == j] = 0
    return filled, keep


src, out_line, out_answer, k = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
img, shape_ink = split_ink(load(src))
quant = absorb_small(quantize(img, k))
cv2.imwrite(out_answer, quant)
line = build(quant)
# 형태선(깃대 등)을 같은 굵기로 얹는다
shape = cv2.dilate(shape_ink, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (LINE_PX, LINE_PX)))
line[shape > 0] = 0
cv2.imwrite(out_line, line)
print(json.dumps({"ok": True}))
