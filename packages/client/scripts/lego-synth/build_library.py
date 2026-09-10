"""Cut real pieces and clean plate backgrounds out of the uploaded frames.
pieces/<id>.png (RGBA) + pieces.json ; bg/<frame>.png + bg.json ; sheet.png to eyeball."""
import json, os, sys
import numpy as np, cv2
HERE = os.environ.get('SYNTH_DIR') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
FR = os.path.join(HERE, 'frames')
B = json.load(open(os.path.join(HERE, 'boxes.json'), encoding='utf-8'))
os.makedirs(os.path.join(HERE, 'pieces'), exist_ok=True)
os.makedirs(os.path.join(HERE, 'bg'), exist_ok=True)
A_THR = 105          # OpenCV Lab a*: plate ~85, yellow/white pieces 125-139
pieces, bgs = [], {}
for f, r in B.items():
    img = cv2.imread(os.path.join(FR, f))
    if img is None: continue
    H, W = img.shape[:2]
    s = W / r['W']
    boxes = r['boxes']; det = r['detail']
    # frame-space boxes
    # reco.boxes y is measured from the image bottom (detBuf is bottom-0); frame rows are top-0
    fb = [(b['x']*s, H - (b['y'] + b['h'])*s, b['w']*s, b['h']*s, b['ch'], b['cell']*s, (det[i]['iou'] if i < len(det) else 0)) for i, b in enumerate(boxes)]
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2Lab)
    a = lab[:, :, 1]
    for i, (x, y, w, h, ch, cell, iou) in enumerate(fb):
        if not ch or ch == '?' or iou < 0.72: continue
        # isolated: gap to every other box >= 0.3 cell
        iso = True
        for j, (x2, y2, w2, h2, *_r) in enumerate(fb):
            if j == i: continue
            gx = max(x2 - (x + w), x - (x2 + w2)); gy = max(y2 - (y + h), y - (y2 + h2))
            if max(gx, gy) < 0.3 * cell: iso = False; break
        if not iso: continue
        m = int(0.35 * cell)
        x0, y0 = max(0, int(x - m)), max(0, int(y - m)); x1, y1 = min(W, int(x + w + m)), min(H, int(y + h + m))
        if x - m < 0 or y - m < 0 or x + w + m > W or y + h + m > H: continue   # touches the frame edge
        crop = img[y0:y1, x0:x1]; ca = a[y0:y1, x0:x1]
        # the crop must sit on the plate: its border is mostly green
        border = np.concatenate([ca[0], ca[-1], ca[:, 0], ca[:, -1]])
        if (border < 100).mean() < 0.6: continue
        mask = (ca > A_THR).astype(np.uint8)
        n, lab_, st, _ = cv2.connectedComponentsWithStats(mask, 8)
        if n < 2: continue
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        mask = (lab_ == big).astype(np.uint8) * 255
        if st[big, cv2.CC_STAT_AREA] < 0.12 * crop.shape[0] * crop.shape[1]: continue
        # piece colour sanity: yellow (b* high) or white (L high), never wood/grey
        cl = cv2.cvtColor(crop, cv2.COLOR_BGR2Lab); mm = mask > 0
        Lm, bm = cl[:, :, 0][mm].mean(), cl[:, :, 2][mm].mean()
        if not (bm > 150 or Lm > 190): continue
        mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))
        rgba = cv2.cvtColor(crop, cv2.COLOR_BGR2BGRA); rgba[:, :, 3] = mask
        pid = f'{f[:-4]}_{i}_{ord(ch):x}'
        cv2.imencode('.png', rgba)[1].tofile(os.path.join(HERE, 'pieces', pid + '.png'))
        ys, xs = np.where(mask > 0)
        pieces.append({'id': pid, 'ch': ch, 'iou': iou, 'frame': f, 'cell': round(cell, 2),
                       'w': int(xs.max() - xs.min() + 1), 'h': int(ys.max() - ys.min() + 1),
                       'x0': int(xs.min()), 'y0': int(ys.min()), 'src_y': round((y + h/2) / H, 3)})
    # background: cover every box with plate texture copied from a clean strip on the same rows,
    # shifted by a whole number of stud pitches so the studs line up (inpainting smeared yellow blobs
    # that the recogniser then read as pieces).
    if r['line']:
        bg = img.copy()
        occ = np.zeros((H, W), np.uint8)
        for (x, y, w, h, ch, cell, iou) in fb:
            m = int(0.45 * cell)
            cv2.rectangle(occ, (max(0, int(x - m)), max(0, int(y - m))), (min(W-1, int(x + w + m)), min(H-1, int(y + h + m))), 255, -1)
        L = r['line']; sdet = s
        def cell_at(yf):
            return sdet * (L['a'] + L['b'] * (yf / sdet))
        for (x, y, w, h, ch, cell, iou) in fb:
            m = int(0.45 * cell)
            x0, y0, x1, y1 = max(0, int(x - m)), max(0, int(y - m)), min(W, int(x + w + m)), min(H, int(y + h + m))
            pitch = cell_at((y0 + y1) / 2)
            done = False
            for n in list(range(1, 12)) + [-k for k in range(1, 12)]:
                dx = int(round(n * pitch)) * (1 if n > 0 else 1)
                sx0, sx1 = x0 + dx, x1 + dx
                if sx0 < 0 or sx1 > W: continue
                if occ[y0:y1, sx0:sx1].any(): continue
                bg[y0:y1, x0:x1] = img[y0:y1, sx0:sx1]
                done = True; break
            if not done:
                bg[y0:y1, x0:x1] = cv2.inpaint(img, occ, 5, cv2.INPAINT_TELEA)[y0:y1, x0:x1]
        cv2.imwrite(os.path.join(HERE, 'bg', f[:-4] + '.png'), bg)
        L = r['line']
        bgs[f[:-4]] = {'W': W, 'H': H, 's': s, 'detH': r['H'], 'a': L['a'], 'b': L['b'], 'lo': L['lo'],
                       'plateY': r['plateY'], 'boxes': [[round(v) for v in (x, y, w, h)] for (x, y, w, h, *_r) in fb]}
json.dump(pieces, open(os.path.join(HERE, 'pieces.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(bgs, open(os.path.join(HERE, 'bg.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
print('pieces', len(pieces), dict(sorted(Counter(p['ch'] for p in pieces).items())))
print('bgs', len(bgs))
# contact sheet
tiles = []
for p in pieces:
    im = cv2.imdecode(np.fromfile(os.path.join(HERE, 'pieces', p['id'] + '.png'), np.uint8), cv2.IMREAD_UNCHANGED)
    h, w = im.shape[:2]; sc = 90 / max(h, w)
    im = cv2.resize(im, (max(1, int(w*sc)), max(1, int(h*sc))))
    t = np.full((100, 100, 3), 60, np.uint8)
    al = im[:, :, 3:4] / 255.0
    t[:im.shape[0], :im.shape[1]] = (im[:, :, :3] * al + t[:im.shape[0], :im.shape[1]] * (1 - al)).astype(np.uint8)
    cv2.putText(t, f"{p['iou']:.2f}", (2, 98), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
    tiles.append(t)
cols = 14; rows = (len(tiles) + cols - 1) // cols
sheet = np.full((rows * 100, cols * 100, 3), 60, np.uint8)
for i, t in enumerate(tiles): sheet[(i // cols) * 100:(i // cols) * 100 + 100, (i % cols) * 100:(i % cols) * 100 + 100] = t
cv2.imwrite(os.path.join(HERE, 'sheet.png'), sheet)
