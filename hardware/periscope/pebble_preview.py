"""Render actual exported meshes as static CAD review images (no concept-image model)."""
from pathlib import Path
import vtk
from PIL import Image,ImageDraw,ImageFont
import pebble as p

OUT=p.OUT
COLORS={"shell_left":(0.96,0.70,0.51),"shell_right":(0.96,0.70,0.51),
        "paddle":(0.80,0.43,0.28),"mirror":(0.66,0.82,0.89),
        "foam":(0.12,0.14,0.15),"phone":(0.20,0.22,0.24)}


def render(name, position, exploded=False, cutaway=False, scene=None, scale=None):
    ren=vtk.vtkRenderer(); ren.SetBackground(0.97,0.955,0.93)
    win=vtk.vtkRenderWindow();win.SetOffScreenRendering(1);win.AddRenderer(ren)
    win.SetSize(1300,1000);win.SetMultiSamples(8)
    scene=scene or {n:(f(),(0,0,0)) for n,f in p.SHOW.items()}
    for n,(shape,offset) in scene.items():
        if cutaway and (n=="shell_right" or n.startswith(("screw","nut"))):continue
        path=OUT/("_preview_"+name+"_"+n+".stl")
        import cadquery as cq
        cq.exporters.export(shape,str(path),tolerance=0.08)
        reader=vtk.vtkSTLReader();reader.SetFileName(str(path))
        normals=vtk.vtkPolyDataNormals();normals.SetInputConnection(reader.GetOutputPort())
        normals.SetFeatureAngle(65)
        mapper=vtk.vtkPolyDataMapper();mapper.SetInputConnection(normals.GetOutputPort())
        actor=vtk.vtkActor();actor.SetMapper(mapper)
        prop=actor.GetProperty();prop.SetColor(*COLORS.get(n,(0.5,0.52,0.54)));prop.SetSpecular(0.3);prop.SetSpecularPower(40)
        prop.SetAmbient(0.2);prop.SetDiffuse(0.8)
        actor.SetPosition(*(p.EXPLODE[n] if exploded else offset))
        ren.AddActor(actor)
    ren.ResetCamera();camera=ren.GetActiveCamera()
    camera.SetViewUp(0,0,1);camera.SetPosition(*position);camera.SetFocalPoint(0,-8,-3)
    camera.ParallelProjectionOn();camera.SetParallelScale(scale or (56 if exploded else 35))
    ren.ResetCameraClippingRange();win.Render()
    grab=vtk.vtkWindowToImageFilter();grab.SetInput(win);grab.Update()
    writer=vtk.vtkPNGWriter();writer.SetFileName(str(OUT/(name+".png")))
    writer.SetInputConnection(grab.GetOutputPort());writer.Write();win.Finalize()


def main():
    render("assembled",(90,-120,80))
    render("exploded",(95,-125,80),True)
    insertion={"shell_left":(p.left(),(0,0,0)),"shell_right":(p.right(),(0,0,0)),
               "paddle":(p.paddle(),(0,0,0)),"phone":(p.phone(drop=-24),(0,0,0))}
    render("insertion",(85,90,-50),scene=insertion,scale=42)
    installed={"shell_left":(p.left(),(0,0,0)),"paddle":(p.installed_paddle(),(0,0,0)),
               "phone":(p.phone(),(0,0,0)),"mirror":(p.old.mirror(),(0,0,0))}
    render("installed",(115,55,15),cutaway=True,scene=installed,scale=40)
    font=ImageFont.truetype("C:/Windows/Fonts/malgun.ttf",30)
    small=ImageFont.truetype("C:/Windows/Fonts/malgun.ttf",23)
    board=Image.new("RGB",(1800,1540),(248,244,237));draw=ImageDraw.Draw(board)
    draw.text((55,28),"TANGO / 스마트폰 반사경 — 조약돌형 조립 시안",font=font,fill="#3f2f24")
    labels=[("assembled","01  완성 상태 — 누름판 축은 케이스 안에 숨음"),("exploded","02  케이스를 열어 거울·누름판 조립"),
            ("insertion","03  휴대폰 윗변을 아래에서 위로 밀어 넣음 ↑"),("installed","04  장착 단면 — 누름판이 뒤로 돌아 폰을 잡음")]
    for i,(n,label) in enumerate(labels):
        x=(i%2)*900;y=90+(i//2)*690
        im=Image.open(OUT/(n+".png")).resize((880,677))
        board.paste(im,(x+10,y))
        draw.rounded_rectangle((x+24,y+615,x+875,y+672),radius=12,fill="#f8f4ed")
        draw.text((x+35,y+630),label,font=small,fill="#3f2f24")
        if n=="insertion":
            draw.line((x+805,y+540,x+805,y+410),fill="#ff5e3a",width=12)
            draw.polygon([(x+805,y+375),(x+778,y+420),(x+832,y+420)],fill="#ff5e3a")
    draw.text((40,1490),"실제 CAD 형상 · 조립 검토용 시제품 / 실물 출력·착용 시험 전",font=small,fill="#796451")
    board.save(OUT/"review-board.png")


if __name__=="__main__":
    main()
    # This Windows VTK build crashes during native interpreter teardown after
    # successful offscreen rendering. All writers above complete synchronously.
    import os,sys
    sys.stdout.flush()
    os._exit(0)
