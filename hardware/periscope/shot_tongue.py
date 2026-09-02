# -*- coding: utf-8 -*-
"""혀 한 부품만 여러 각도로 찍는다 — 실물 사진과 나란히 놓고 보려고.

실행:  python shot_tongue.py      → out/tongue_views.png
"""
import os, math
import vtk
from PIL import Image, ImageDraw, ImageFont
import cadquery as cq
import printable as K

W, H = 520, 520
BG = (0.968, 0.957, 0.941)
VIEWS = [("옆에서 (단면 방향)", (0, -1, 0), (0, 0, 1)),
         ("비스듬히", (-0.9, -1, 0.55), (0, 0, 1)),
         ("앞에서 (폰이 보는 쪽)", (0, -0.25, -1), (0, 1, 0)),
         ("위에서", (0, 0, 1), (0, 1, 0))]


def font(sz):
    for p in ("C:/Windows/Fonts/malgun.ttf", "C:/Windows/Fonts/gulim.ttc"):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def shot(path, view):
    ren = vtk.vtkRenderer(); ren.SetBackground(*BG)
    win = vtk.vtkRenderWindow(); win.SetOffScreenRendering(1)
    win.AddRenderer(ren); win.SetSize(W, H); win.SetMultiSamples(8)
    r = vtk.vtkSTLReader(); r.SetFileName(os.path.join(K.OUT, "print_tongue.stl"))
    n = vtk.vtkPolyDataNormals(); n.SetInputConnection(r.GetOutputPort())
    n.SetFeatureAngle(38); n.SplittingOn()
    m = vtk.vtkPolyDataMapper(); m.SetInputConnection(n.GetOutputPort())
    a = vtk.vtkActor(); a.SetMapper(m)
    pr = a.GetProperty(); pr.SetColor(0.86, 0.16, 0.13)
    pr.SetSpecular(0.35); pr.SetSpecularPower(30); pr.SetAmbient(0.24); pr.SetDiffuse(0.76)
    ren.AddActor(a)
    for p, i in (((1, -1, 1), 0.95), ((-1, -0.6, 0.4), 0.5), ((0, 1, -0.5), 0.3)):
        l = vtk.vtkLight(); l.SetLightTypeToCameraLight()
        l.SetPosition(*p); l.SetIntensity(i); ren.AddLight(l)
    ren.ResetCamera()
    cam = ren.GetActiveCamera()
    fp = cam.GetFocalPoint(); d = cam.GetDistance() * 0.85
    v, up = view
    ln = math.sqrt(sum(c * c for c in v))
    cam.SetPosition(*[fp[k] + d * v[k] / ln for k in range(3)])
    cam.SetFocalPoint(*fp); cam.SetViewUp(*up)
    ren.ResetCameraClippingRange()
    win.Render()
    w2i = vtk.vtkWindowToImageFilter(); w2i.SetInput(win); w2i.ReadFrontBufferOff()
    w2i.Update()
    wr = vtk.vtkPNGWriter(); wr.SetFileName(path)
    wr.SetInputConnection(w2i.GetOutputPort()); wr.Write()


def main():
    cq.exporters.export(K.tongue(), os.path.join(K.OUT, "print_tongue.stl"))
    gap = 8
    out = Image.new("RGB", ((W + gap) * len(VIEWS) + gap, H + 34), (150, 150, 150))
    d = ImageDraw.Draw(out)
    f = font(17)
    for i, (name, v, up) in enumerate(VIEWS):
        p = os.path.join(K.OUT, f"_tv{i}.png")
        shot(p, (v, up))
        out.paste(Image.open(p).convert("RGB"), (gap + (W + gap) * i, 26))
        d.text((gap + (W + gap) * i, 5), name, font=f, fill=(20, 20, 20))
    dst = os.path.join(K.OUT, "tongue_views.png")
    out.save(dst)
    b = K.tongue().val().BoundingBox()
    print(f"{dst}   혀 {b.xlen:.1f} × {b.ylen:.1f} × {b.zlen:.1f} mm  두께 {K.TONGUE_T}")


if __name__ == "__main__":
    main()
