# -*- coding: utf-8 -*-
"""조립 영상 — 부품이 순서대로 제자리에 들어간다.

실행:  python render_video.py            → out/assembly.mp4

🔴 조립 순서·설명·벌어지는 방향은 **모델 파일의 STEPS 하나**에서 온다. 영상용 목록을
   따로 두면 모델과 영상이 갈라진다 — 실제로 갈라진 적이 있다: 여기가 옛 사출 설계
   (reflector.py)를 그리는 동안 자막은 2부품 프린팅 이야기를 했고, 화면에는 이제 없는
   부품(초록 rocker_pad)이 스쳐 지나갔다.
🔴 그리고 그 영상은 **다시 뽑을 방법이 없었다** — 만든 스크립트가 저장소에 없었다.
   산출물(out/*.mp4)만 남기고 스크립트를 버리면 모델을 고쳐도 영상을 못 고친다.
"""

import math, os, shutil, subprocess, sys
import vtk
from PIL import Image, ImageDraw, ImageFont
import printable as C

W, H, FPS = 1280, 720, 30
FLY, HOLD, INTRO, OUTRO = 1.0, 0.45, 0.8, 3.2      # 초
BG = (0.968, 0.957, 0.941)

COLORS = {
    "print_body":   (0.88, 0.24, 0.14),
    "print_tongue": (0.11, 0.58, 0.44),
    "print_mirror": (0.80, 0.94, 0.98),
    "phone":        (0.16, 0.18, 0.22),
}

FONTS = ["C:/Windows/Fonts/malgun.ttf", "C:/Windows/Fonts/MALGUN.TTF",
         "C:/Windows/Fonts/gulim.ttc"]


def _font(sz):
    for p in FONTS:
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def ease(t):
    """뒤로 갈수록 느려진다 — 부품이 자리에 '앉는' 느낌."""
    return 1 - (1 - t) ** 3


def build():
    os.makedirs(C.OUT, exist_ok=True)
    stl = {}
    # 🔴 **매번 다시 굽는다.** 있으면 건너뛰게 두었더니 모델을 고친 뒤에도 옛 STL 로
    #    영상이 나왔다 — 영상이 모델을 따라오게 만든 의미가 없어진다.
    import cadquery as cq
    for n, f in getattr(C, "SHOW", C.PARTS).items():
        p = os.path.join(C.OUT, "_v_" + n + ".stl")
        cq.exporters.export(f(), p)
        stl[n] = p

    ren = vtk.vtkRenderer()
    ren.SetBackground(*BG)
    ren.SetUseDepthPeeling(1)
    win = vtk.vtkRenderWindow()
    win.SetOffScreenRendering(1)
    win.AddRenderer(ren)
    win.SetSize(W, H)
    win.SetMultiSamples(8)

    actors = {}
    for n, path in stl.items():
        r = vtk.vtkSTLReader(); r.SetFileName(path)
        nrm = vtk.vtkPolyDataNormals()
        nrm.SetInputConnection(r.GetOutputPort())
        nrm.SetFeatureAngle(38); nrm.SplittingOn()
        m = vtk.vtkPolyDataMapper(); m.SetInputConnection(nrm.GetOutputPort())
        a = vtk.vtkActor(); a.SetMapper(m)
        pr = a.GetProperty()
        pr.SetColor(*COLORS.get(n, (0.6, 0.6, 0.6)))
        pr.SetSpecular(0.32); pr.SetSpecularPower(28); pr.SetAmbient(0.22); pr.SetDiffuse(0.78)
        if n == "print_mirror":
            pr.SetSpecular(0.9); pr.SetSpecularPower(80)
        if n == "phone":
            pr.SetSpecular(0.5); pr.SetSpecularPower(50); pr.SetOpacity(0.92)
        ren.AddActor(a)
        actors[n] = a

    for pos, inten in (((1, -1, 1), 0.9), ((-1, -0.6, 0.4), 0.45), ((0, 1, -0.5), 0.3)):
        l = vtk.vtkLight(); l.SetLightTypeToCameraLight()
        l.SetPosition(*pos); l.SetIntensity(inten); ren.AddLight(l)

    ren.ResetCamera()
    cam = ren.GetActiveCamera()
    fp = cam.GetFocalPoint()
    dist = cam.GetDistance() * 0.78
    return win, ren, cam, actors, fp, dist


def main():
    win, ren, cam, actors, fp, dist = build()
    frames_dir = os.path.join(C.OUT, "frames")
    shutil.rmtree(frames_dir, ignore_errors=True)
    os.makedirs(frames_dir)

    steps = C.STEPS
    total = INTRO + len(steps) * (FLY + HOLD) + OUTRO
    nframes = int(total * FPS)

    w2i = vtk.vtkWindowToImageFilter(); w2i.SetInput(win); w2i.ReadFrontBufferOff()
    wr = vtk.vtkPNGWriter()

    f_big, f_small, f_tiny = _font(30), _font(19), _font(15)
    down, want = C.check_optics()

    for i in range(nframes):
        t = i / FPS

        # 카메라 — 천천히 돈다
        ang = math.radians(-58 + 34 * (t / total))
        elev = math.radians(16 + 8 * math.sin(t / total * math.pi))
        cam.SetPosition(fp[0] + dist * math.cos(ang) * math.cos(elev),
                        fp[1] + dist * math.sin(ang) * math.cos(elev),
                        fp[2] + dist * math.sin(elev))
        cam.SetFocalPoint(*fp); cam.SetViewUp(0, 0, 1)
        ren.ResetCameraClippingRange()

        # 부품 자리 — 아직 안 온 부품은 분해 위치에, 오는 중이면 보간
        caption, sub = "", ""
        for si, (name, ex, cap) in enumerate(steps):
            t0 = INTRO + si * (FLY + HOLD)
            if t < t0:
                k = 1.0
            elif t < t0 + FLY:
                k = 1.0 - ease((t - t0) / FLY)
            else:
                k = 0.0
            actors[name].SetPosition(ex[0] * k, ex[1] * k, ex[2] * k)
            actors[name].SetVisibility(0 if (si > 0 and t < t0 - 0.25) else 1)
            if t0 - 0.25 <= t < t0 + FLY + HOLD:
                caption, sub = f"{si + 1}. {cap}", ""

        # 🔴 제자리에 들어가면 몸체에 가려 **안 보인다** — 조립 영상인데 어디에 앉는지를
        #    모르게 된다(옛 영상이 그래서 자막만 넘어가는 것처럼 보였다).
        #    혀·거울이 앉는 동안만 몸체를 비춰 주고, 폰이 올 때 도로 채운다.
        t_in = INTRO + (FLY + HOLD)               # 혀가 오기 시작
        t_out = INTRO + 3 * (FLY + HOLD)          # 폰이 오기 시작
        fade = 0.3
        if t < t_in - fade or t >= t_out + fade:
            op = 1.0
        elif t < t_in:
            op = 1.0 - 0.65 * (t - (t_in - fade)) / fade
        elif t < t_out:
            op = 0.35
        else:
            op = 0.35 + 0.65 * (t - t_out) / fade
        actors["print_body"].GetProperty().SetOpacity(op)

        if t < INTRO:
            caption = "탱고 잠망경 반사경 — 조립"
            sub = (f"3D 프린팅 · 부품 2개 + 거울(구매) · 몸체 "
                   f"{C.BODY_W:.0f}×{C.CHANNEL + C.WALL + C.BODY_D:.0f}×{C.BODY_H + C.ROOF:.0f}mm")
        if t >= total - OUTRO:
            caption = "완성 — 폰 윗변에 물리기만 하면 된다"
            sub = f"거울각 {C.MU:.0f}° 고정 → 하향각 {down:.0f}°   ·   화각 {C.fov()[0]:.0f}° × {C.fov()[1]:.0f}°"

        win.Render()
        w2i.Modified(); w2i.Update()
        p = os.path.join(frames_dir, f"f{i:05d}.png")
        wr.SetFileName(p); wr.SetInputConnection(w2i.GetOutputPort()); wr.Write()

        # 자막 — VTK 한글이 불안해서 PIL 로 얹는다
        im = Image.open(p).convert("RGB")
        d = ImageDraw.Draw(im, "RGBA")
        d.rectangle([0, H - 96, W, H], fill=(28, 26, 23, 232))
        d.text((44, H - 74), caption, font=f_big, fill=(246, 243, 238))
        if sub:
            d.text((44, H - 36), sub, font=f_small, fill=(176, 168, 156))
        d.text((W - 250, 26), "TANGO  잠망경 반사경", font=f_small, fill=(120, 112, 100))
        im.save(p)

        if i % 45 == 0:
            print(f"  {i}/{nframes}")

    out = os.path.join(C.OUT, "assembly.mp4")
    cmd = ["ffmpeg", "-y", "-framerate", str(FPS),
           "-i", os.path.join(frames_dir, "f%05d.png"),
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
           "-movflags", "+faststart", out]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-1500:]); sys.exit(1)
    print(f"\n  {out}  {os.path.getsize(out)/1e6:.1f} MB  {total:.1f}초  {nframes}프레임")


if __name__ == "__main__":
    main()
