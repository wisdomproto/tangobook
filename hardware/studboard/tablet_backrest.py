"""15 degree contact backrest, rear braces, existing female rail unchanged."""
import os,sys,json,re,io
import numpy as np,trimesh,manifold3d as md,cadquery as cq
from tablet_cradle import ROOT,OUT,part
from flat_board import mesh

HEIGHT=85.
def posed(shape):
    return shape.rotate((0,0,0),(1,0,0),-15).translate((105,243,5))

def tablet(thickness=7.,angle=15.,rise=0):
    # All thicknesses rest against the same rear contact plane, local Y=6.5.
    return (cq.Workplane('XY').box(179.5,thickness,248.6,centered=(True,True,False))
            .edges('|Z').fillet(1).translate((0,6.45-thickness/2,1.+rise))
            .rotate((0,0,0),(1,0,0),-angle).translate((105,243,5)))

def main():
    base=cq.importers.importStep(str(OUT/'tablet-cradle-stable.step'))
    rest=posed(cq.Workplane('XY').box(190,4,HEIGHT-8,centered=(True,False,False))
                .edges().fillet(1.2).translate((0,6.5,8)))
    holder=base.union(rest)
    # Two wide triangular braces carry the backrest load to the rear heel.
    for x in (43,161):
        brace=(cq.Workplane('YZ').polyline([(252,2.8),(273,82),(279,82),(316,2.8)])
               .close().extrude(8).edges('|X').fillet(1.2).translate((x,0,0)))
        holder=holder.union(brace)
    assert holder.val().isValid() and len(holder.val().Solids())==1
    collisions=[]
    for t in (5,7,9,11):
        for rise in (0,5,20,100,260):
            v=holder.intersect(tablet(t,rise=rise)).val().Volume()
            collisions.append(dict(thickness_mm=t,rise_mm=rise,collision_mm3=v))
            assert v<1e-6,collisions[-1]
    lean=[]
    for a in (15,17,20,25,30):
        v=holder.intersect(tablet(angle=a)).val().Volume()
        lean.append(dict(angle_deg=a,collision_mm3=v))
    assert lean[0]['collision_mm3']<1e-6 and all(c['collision_mm3']>1 for c in lean[1:])
    old=cq.importers.importStep(str(OUT/'recognition-board-14x14.step'))
    rail_checks=[holder.intersect(old.translate((-dx,0,0))).val().Volume() for dx in (0,5,20,100,230)]
    assert max(rail_checks)<1e-6,rail_checks
    step=OUT/'tablet-cradle-backrest.step'
    cq.exporters.export(holder,str(step))
    step.write_text('\n'.join(s.rstrip() for s in step.read_text().splitlines())+'\n')
    m=mesh(holder)
    m=trimesh.load(io.BytesIO(m.export(file_type='stl')),file_type='stl',force='mesh')
    sm=md.Manifold(md.Mesh(m.vertices.astype(np.float32),m.faces.astype(np.uint32))).simplify(.01).to_mesh64()
    m=trimesh.Trimesh(vertices=sm.vert_properties[:,:3],faces=sm.tri_verts)
    assert m.is_volume and len(m.split())==1
    m.export(OUT/'tablet-cradle-backrest-assembled.stl')
    a=np.deg2rad(15)
    tablet_cg=np.array([105,243+2.95*np.cos(a)+125.3*np.sin(a),5-2.95*np.sin(a)+125.3*np.cos(a)])
    cases=[]
    for factor in (.25,.5,1):
        mass=m.volume/1000*1.2*factor/1000
        combined=(mass*m.center_mass+.477*tablet_cg)/(mass+.477)
        arm=322.4-combined[1];assert arm>0
        cases.append(dict(solid_mass_fraction=factor,assumed_cradle_mass_g=mass*1000,rear_margin_mm=arm,backward_top_push_tipping_N=(mass+.477)*9.81*arm/(5-2.95*np.sin(a)+249.6*np.cos(a))))
    m.apply_translation(-m.bounds[0]);assert max(m.extents[:2])<240
    m.export(OUT/'tablet-cradle-backrest-print.stl')
    f=ROOT/'packages/client/public/tango-board-only.standalone.html';h=f.read_text(encoding='utf8')
    match=re.search(r'<script id="meshData" type="application/json">(.*?)</script>',h,re.S);d=json.loads(match[1])
    d['cradle']=part(holder.val());d['tablet']=part(tablet().val());d['tablet']['size_mm']=[179.5,7,248.6]
    d.pop('tabletLinerLeft',None);d.pop('tabletLinerRight',None)
    h=h[:match.start(1)]+json.dumps(d,separators=(',',':'))+h[match.end(1):]
    h=re.sub(r'<a id="downloadCradle".*?</a>','<a id="downloadCradle" href="../../../hardware/studboard/out/tablet-cradle-backrest-print.stl" download="tango-camera-backrest15-cradle.stl">15° 등받이 거치대 STL 다운로드</a>',h)
    h=h.replace('베젤 폭 15 mm · 전체 높이 20 mm','베젤 폭 8 mm · 판 높이 20 mm · 등받이 높이 약 85 mm')
    h=h.replace('7mm 태블릿용 간격 패드는 홈의 경사 방향으로 위에서 끼우세요. 두꺼운 태블릿은 패드를 빼고 사용합니다.','태블릿 뒷면을 15° 등받이에 기대어 넣으세요. 기존 간격 패드는 사용하지 않습니다. 판과 다리·레일은 재사용합니다.')
    f.write_text(h,encoding='utf8')
    report=dict(backrest_angle_from_vertical_deg=15,backrest_contact_local_y_mm=6.5,backrest_height_local_mm=HEIGHT,backrest_width_mm=190,backrest_thickness_mm=4,brace_width_mm=8,tablet_thickness_checks_mm=[5,7,9,11],insertion_checks=collisions,backward_lean_checks=lean,rail_insertion_collision_mm3=rail_checks,tablet_bottom_local_z_mm=1,tablet_center_local_y_mm=2.95,rear_support_y_mm=322.4,print_bounds_mm=m.extents.tolist(),triangle_count=len(m.faces),physical_test=False)
    report['standalone_static_iPad_477g_cases']=cases
    report['static_assumptions']=['fully seated on rear face at 15 degrees','uniform effective material density 1.2 g/cm3 times fraction; NOT slicer infill','level rigid surface; no case, impact, sliding or strength validation']
    (OUT/'backrest_report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
    print(json.dumps(report,indent=2),flush=True)

if __name__=='__main__':
    main();os._exit(0)
