# -*- coding: utf-8 -*-
"""빨간모자 블록 미리보기 — 부품 넷(역할 색) + 24×24 판 위 조립 장면을 VTK 로 찍어 한 장(out/review.png).

실행:  python preview.py        (형상은 blocks.py 가 원본 — 여기서는 그리기만)
"""
import os, math, tempfile
import vtk
from PIL import Image, ImageDraw, ImageFont
import cadquery as cq
import blocks as B

W, H = 900, 640
BG = (0.968, 0.957, 0.941)


def font(sz):
    for p in ("C:/Windows/Fonts/malgun.ttf", "C:/Windows/Fonts/gulim.ttc"):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def shot(path, parts, view, up=(0, 0, 1), zoom=0.9):
    """parts = [(shape, rgb)] → PNG. view = 카메라가 놓이는 방향(초점에서 카메라로)."""
    ren = vtk.vtkRenderer(); ren.SetBackground(*BG)
    win = vtk.vtkRenderWindow(); win.SetOffScreenRendering(1)
    win.AddRenderer(ren); win.SetSize(W, H); win.SetMultiSamples(8)
    tmp = tempfile.mkdtemp()
    for i, (shape, rgb) in enumerate(parts):
        f = os.path.join(tmp, f'{i}.stl')
        cq.exporters.export(shape, f, tolerance=0.05, angularTolerance=0.2)
        r = vtk.vtkSTLReader(); r.SetFileName(f)
        n = vtk.vtkPolyDataNormals(); n.SetInputConnection(r.GetOutputPort()); n.SetFeatureAngle(38); n.SplittingOn()
        m = vtk.vtkPolyDataMapper(); m.SetInputConnection(n.GetOutputPort())
        a = vtk.vtkActor(); a.SetMapper(m)
        pr = a.GetProperty(); pr.SetColor(*rgb); pr.SetSpecular(0.25); pr.SetSpecularPower(25); pr.SetAmbient(0.28); pr.SetDiffuse(0.72)
        ren.AddActor(a)
    for p, i in (((1, -1, 1), 0.95), ((-1, -0.6, 0.4), 0.5), ((0, 1, -0.5), 0.3)):
        l = vtk.vtkLight(); l.SetLightTypeToCameraLight(); l.SetPosition(*p); l.SetIntensity(i); ren.AddLight(l)
    ren.ResetCamera()
    cam = ren.GetActiveCamera(); fp = cam.GetFocalPoint(); d = cam.GetDistance() * zoom
    ln = math.sqrt(sum(c * c for c in view))
    cam.SetPosition(*[fp[k] + d * view[k] / ln for k in range(3)]); cam.SetFocalPoint(*fp); cam.SetViewUp(*up)
    ren.ResetCameraClippingRange(); win.Render()
    w2i = vtk.vtkWindowToImageFilter(); w2i.SetInput(win); w2i.ReadFrontBufferOff(); w2i.Update()
    wr = vtk.vtkPNGWriter(); wr.SetFileName(path); wr.SetInputConnection(w2i.GetOutputPort()); wr.Write()


def main():
    os.makedirs(B.OUT, exist_ok=True)
    C = B.COLORS
    # 고정물엔 종이(흰 판)를 반쯤 밀어 넣은 채로 — 양옆 턱 밑으로 들어가는 게 보인다
    pl, pw = B.paper_size(B.CELL_STUDS, B.CELL_STUDS)
    tw = B.footprint(B.CELL_STUDS, B.CELL_STUDS)[0]
    sheet = (cq.Workplane('XY').box(pl, pw, 0.25, centered=(False, True, False))
             .translate((tw / 2 - B.PAPER_INSET - pl - 22, 0, B.OBJ_H - B.LIP_T - B.SLOT_H + 0.25)))
    row = [(B.road().translate((-70, 0, 0)), C['road']), (B.obj().translate((10, 0, 0)), C['tree']),
           (sheet.translate((10, 0, 0)), (0.98, 0.98, 0.95)),
           (B.house().translate((70, 0, 0)), C['house'])]
    flipped = [(B.road().rotate((0, 0, 0), (1, 0, 0), 180).translate((-70, 0, 0)), C['road']),
               (B.house().rotate((0, 0, 0), (1, 0, 0), 180).translate((30, 0, 0)), C['house'])]
    scene = [(shape, C[key]) for _, shape, key in B.scene_parts()]
    p1, p2, p3, p4 = [os.path.join(B.OUT, f'_v{i}.png') for i in range(4)]
    shot(p1, row, (-0.6, -1, 0.7))
    shot(p2, flipped, (1, -1, 0.75))
    shot(p3, scene, (0.9, -1, 1.1), zoom=0.8)
    shot(p4, scene, (0, -0.001, 1), up=(0, 1, 0), zoom=0.75)
    gap, cap = 8, 30
    out = Image.new('RGB', (W * 2 + gap * 3, H * 2 + gap * 3 + cap * 2), (150, 150, 150))
    dr = ImageDraw.Draw(out); f = font(18)
    for (img, label, x, y) in ((p1, '부품 — 길 1×2(2단) · 고정물 1×1(종이를 반쯤 밀어 넣은 상태 — 양옆 턱 밑에 잡힌다) · 집(굴뚝 = 문 방향)', gap, gap),
                               (p2, '뒤집어서 — 밑면 소켓이 레고 돌기에 꽂힌다', W + gap * 2, gap),
                               (p3, '24×24 판 위 조립 (한 칸 = 6돌기 = 48mm, 4×4)', gap, H + gap * 2 + cap),
                               (p4, '위에서 — 4×4 격자 (집 문은 아래, 길 세 장, 나무 둘, 빨간모자, 늑대)', W + gap * 2, H + gap * 2 + cap)):
        out.paste(Image.open(img), (x, y + cap))
        dr.rectangle((x, y, x + W, y + cap), fill=(60, 60, 60)); dr.text((x + 8, y + 5), label, font=f, fill=(255, 255, 255))
    out = out.crop((0, 0, W * 2 + gap * 3, H * 2 + gap * 3 + cap * 2))
    dst = os.path.join(B.OUT, 'review.png'); out.save(dst)
    for p in (p1, p2, p3, p4): os.remove(p)
    print('미리보기 →', dst)


if __name__ == '__main__':
    main()
