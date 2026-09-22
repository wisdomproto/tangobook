"""Render actual exported meshes as static CAD review images (no concept-image model)."""
from pathlib import Path
import vtk
from PIL import Image,ImageDraw,ImageFont
import pebble as p

OUT=p.OUT
COLORS={"shell_left":(0.96,0.70,0.51),"shell_right":(0.96,0.70,0.51),
        "paddle":(0.29,0.34,0.36),"mirror":(0.66,0.82,0.89),"foam":(0.12,0.14,0.15)}


def render(name, position, exploded=False, cutaway=False):
    ren=vtk.vtkRenderer(); ren.SetBackground(0.97,0.955,0.93)
    win=vtk.vtkRenderWindow();win.SetOffScreenRendering(1);win.AddRenderer(ren)
    win.SetSize(1300,1000);win.SetMultiSamples(8)
    for n in p.SHOW:
        if cutaway and (n=="shell_right" or n.startswith(("screw","nut"))):continue
        reader=vtk.vtkSTLReader();reader.SetFileName(str(OUT/(n+".stl")))
        normals=vtk.vtkPolyDataNormals();normals.SetInputConnection(reader.GetOutputPort())
        normals.SetFeatureAngle(65)
        mapper=vtk.vtkPolyDataMapper();mapper.SetInputConnection(normals.GetOutputPort())
        actor=vtk.vtkActor();actor.SetMapper(mapper)
        prop=actor.GetProperty();prop.SetColor(*COLORS.get(n,(0.5,0.52,0.54)));prop.SetSpecular(0.3);prop.SetSpecularPower(40)
        prop.SetAmbient(0.2);prop.SetDiffuse(0.8)
        if exploded:actor.SetPosition(*p.EXPLODE[n])
        ren.AddActor(actor)
    ren.ResetCamera();camera=ren.GetActiveCamera()
    camera.SetViewUp(0,0,1);camera.SetPosition(*position);camera.SetFocalPoint(0,-8,-3)
    camera.ParallelProjectionOn();camera.SetParallelScale(56 if exploded else 35)
    ren.ResetCameraClippingRange();win.Render()
    grab=vtk.vtkWindowToImageFilter();grab.SetInput(win);grab.Update()
    writer=vtk.vtkPNGWriter();writer.SetFileName(str(OUT/(name+".png")))
    writer.SetInputConnection(grab.GetOutputPort());writer.Write();win.Finalize()


def main():
    render("assembled",(90,-120,80))
    render("underside",(75,90,-75))
    render("exploded",(95,-125,80),True)
    render("inside",(120,50,35),cutaway=True)
    font=ImageFont.truetype("C:/Windows/Fonts/malgun.ttf",30)
    small=ImageFont.truetype("C:/Windows/Fonts/malgun.ttf",23)
    board=Image.new("RGB",(1800,1540),(248,244,237));draw=ImageDraw.Draw(board)
    draw.text((55,28),"TANGO / 스마트폰 반사경 — 조약돌형 조립 시안",font=font,fill="#3f2f24")
    labels=[("assembled","01  둥근 외피 · 좌우 케이스"),("exploded","02  케이스를 열어 부품을 넣는 구조"),
            ("underside","03  아래쪽 광학 창 · 폰 삽입부"),("inside","04  내부 거울 자리 · 축 받침")]
    for i,(n,label) in enumerate(labels):
        x=(i%2)*900;y=90+(i//2)*690
        im=Image.open(OUT/(n+".png")).resize((880,677))
        board.paste(im,(x+10,y));draw.text((x+35,y+630),label,font=small,fill="#3f2f24")
    draw.text((40,1490),"실제 CAD 형상 · 조립 검토용 시제품 / 실물 출력·착용 시험 전",font=small,fill="#796451")
    board.save(OUT/"review-board.png")


if __name__=="__main__":
    main()
    # This Windows VTK build crashes during native interpreter teardown after
    # successful offscreen rendering. All writers above complete synchronously.
    import os,sys
    sys.stdout.flush()
    os._exit(0)
