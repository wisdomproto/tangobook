"""Flat-bottom board with two front feet and a rear foot/rail bridge."""
from pathlib import Path
import json,re,base64,io
import numpy as np
import trimesh
import manifold3d as md
import cadquery as cq
from tablet_cradle import BACK, part, encode

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).parent/'out'
FLOOR=10.4
PINS=[(-3.,5.),(213.,5.),(-3.,205.),(213.,205.)]

def mesh(shape):
    v,f=shape.val().tessellate(.04,.12)
    m=trimesh.Trimesh(vertices=[p.toTuple() for p in v],faces=f)
    m.update_faces(m.nondegenerate_faces());m.remove_unreferenced_vertices()
    assert m.is_volume
    return m

def foot(x,y,ribs=True):
    base=cq.Workplane('XY').center(x,y).circle(5).extrude(FLOOR).edges().fillet(.7)
    pin=cq.Workplane('XY').center(x,y).circle(2.4).extrude(4.15).translate((0,0,FLOOR-.15)).edges('>Z').chamfer(.4)
    if ribs:
        for a in (0,120,240):
            rad=np.deg2rad(a)
            rib=cq.Workplane('XY').center(x+2.33*np.cos(rad),y+2.33*np.sin(rad)).circle(.20).extrude(2.8).translate((0,0,FLOOR+.2)).edges('>Z').chamfer(.15)
            pin=pin.union(rib)
    return base.union(pin)

def stud():
    # Ellipsoidal head: radius 2.5, height 2.9; 12 sides and 3 curved bands.
    verts=[]
    for angle in (0,30,60):
        a=np.deg2rad(angle)
        for i in range(12):
            t=2*np.pi*i/12
            verts.append([2.5*np.cos(a)*np.cos(t),2.5*np.cos(a)*np.sin(t),12.59+2.91*np.sin(a)])
    verts.extend([[0,0,15.5],[0,0,12.59]])
    faces=[]
    for layer in range(2):
        for i in range(12):
            a=layer*12+i;b=layer*12+(i+1)%12;c=b+12;d=a+12
            faces.extend([[a,b,c],[a,c,d]])
    for i in range(12):
        faces.extend([[24+i,24+(i+1)%12,36],[(i+1)%12,i,37]])
    result=trimesh.Trimesh(vertices=verts,faces=faces)
    assert result.is_volume
    return result

def main():
    shell=cq.importers.importStep(str(OUT/'recognition-board-14x14.step'))
    slab=cq.Workplane('XY').box(300,247.35,20,centered=(True,False,False)).translate((105,-30,FLOOR))
    plate=shell.intersect(slab)
    holes=None
    for x,y in PINS:
        hole=cq.Workplane('XY').center(x,y).circle(2.45).extrude(4.4).translate((0,0,FLOOR-.1))
        plate=plate.cut(hole)
        holes=hole if holes is None else holes.union(hole)
    front=[foot(*p) for p in PINS[:2]]
    rail=shell.intersect(cq.Workplane('XY').box(300,30,30,centered=(True,False,False)).translate((105,BACK-.5,0)))
    bridge=(cq.Workplane('XY').box(216,15.5,2.9,centered=(True,False,False)).edges().fillet(.6).translate((105,202.5,7.5)))
    rear=rail.union(bridge).union(foot(*PINS[2])).union(foot(*PINS[3]))
    smooth=rail.union(bridge).union(foot(*PINS[2],ribs=False)).union(foot(*PINS[3],ribs=False))
    assert rear.val().isValid() and rear.solids().size()==1
    nominal=[foot(*p,ribs=False) for p in PINS[:2]]+[smooth]
    for f in nominal:
        for shift in (0,.5,2,5,12):
            assert plate.intersect(f.translate((0,0,-shift))).val().Volume()<1e-6
    cradle=cq.importers.importStep(str(OUT/'tablet-cradle.step'))
    assert plate.intersect(cradle).val().Volume()<1e-6
    assert rear.intersect(cradle).val().Volume()<20
    base_mesh=mesh(plate)
    solid=md.Manifold(md.Mesh64(base_mesh.vertices,base_mesh.faces.astype(np.uint64)))
    dome=stud(); heads=[]
    dome_solid=md.Manifold(md.Mesh64(dome.vertices,dome.faces.astype(np.uint64)))
    for x in range(0,211,15):
        for y in range(0,211,15):
            solid=solid+dome_solid.translate([x,y,0])
            head=dome.copy();head.apply_translation([x,y,0]);heads.append(head)
    solid=solid.simplify(.025)
    # Cut precise sockets after simplification so press-fit dimensions do not drift.
    hole_mesh=mesh(holes)
    solid=solid-md.Manifold(md.Mesh64(hole_mesh.vertices,hole_mesh.faces.astype(np.uint64)))
    simplified=solid.to_mesh64()
    full=trimesh.Trimesh(vertices=simplified.vert_properties[:,:3],faces=simplified.tri_verts,process=True)
    assert full.is_volume and full.body_count==1 and len(full.faces)<25000
    assert not full.contains([[105,105,FLOOR-.1]])[0]
    assert full.contains([[105,105,FLOOR+.2]])[0]
    htmlfile=ROOT/'packages/client/public/tango-board-only.standalone.html'
    h=htmlfile.read_text(encoding='utf8');match=re.search(r'<script id="meshData" type="application/json">(.*?)</script>',h,re.S);data=json.loads(match[1])
    b=data['block'];vertices=np.frombuffer(base64.b64decode(b['b64']),dtype='<i2').reshape(-1,3)/b['scale']+b['centre']
    block=trimesh.Trimesh(vertices=vertices,faces=np.arange(len(vertices)).reshape(-1,3))
    overlap=trimesh.boolean.intersection([full,block],engine='manifold')
    block_collision=overlap.volume if len(overlap.faces) else 0.
    assert block_collision<.001
    ready=full.copy();ready.apply_translation(-ready.bounds[0]);ready.export(OUT/'tango-camera-flat-board-print.stl')
    sample=np.array([[x,y,-1] for x in (15,60,105,150,195) for y in (15,60,105,150,195)])
    hits,indices,_=ready.ray.intersects_location(sample,np.tile([0,0,1],(len(sample),1)),multiple_hits=False)
    assert len(indices)==25 and np.max(np.abs(hits[:,2]))<.001
    foot_meshes=[]
    for name,p,rotate in [('front-foot-left',front[0],False),('front-foot-right',front[1],False),('rear-foot-rail',rear,True)]:
        m=mesh(p)
        if rotate:m.apply_transform(trimesh.transformations.rotation_matrix(-np.pi/2,[1,0,0]))
        m.apply_translation(-m.bounds[0])
        # Normalize OCC tessellation through the same float32 weld as STL export.
        m=trimesh.load(io.BytesIO(m.export(file_type='stl')),file_type='stl',force='mesh')
        mm=md.Mesh(m.vertices.astype(np.float32),m.faces.astype(np.uint32))
        sm=md.Manifold(mm)
        light=sm.simplify(.01).to_mesh64()
        m=trimesh.Trimesh(vertices=light.vert_properties[:,:3],faces=light.tri_verts)
        components=sorted(m.split(only_watertight=False),key=lambda q:abs(q.volume),reverse=True)
        assert components and all(abs(q.volume)<1e-6 for q in components[1:])
        m=components[0]
        assert m.is_volume
        m.apply_translation(-m.bounds[0]);m.export(OUT/(name+'-print.stl'))
        foot_meshes.append(m)
    rear_depth=foot_meshes[2].extents[1]
    foot_meshes[0].apply_translation([0,rear_depth+8,0])
    foot_meshes[1].apply_translation([18,rear_depth+8,0])
    feet_plate=trimesh.util.concatenate(foot_meshes)
    assert np.all(feet_plate.extents[:2]<240)
    feet_plate.export(OUT/'tango-camera-feet-print-plate.stl')
    data['board']=part(plate.val())
    head_mesh=trimesh.util.concatenate(heads)
    data['grid']=encode(head_mesh.vertices[head_mesh.faces].reshape(-1,3))
    data['frontFootLeft']=part(front[0].val());data['frontFootRight']=part(front[1].val());data['rearFeetRail']=part(rear.val())
    h=h[:match.start(1)]+json.dumps(data,separators=(',',':'))+h[match.end(1):]
    h=h.replace('tango-camera-board-only-print.stl','tango-camera-flat-board-print.stl').replace('tango-camera-board-bezel8-open-bottom.stl','tango-camera-flat-board.stl')
    h=h.replace('베젤 8mm · 판 하부 개방형 · 놀이면 2.2mm · 하부 보강 리브','베젤 8mm · 평평한 판 바닥 · 모서리 조립 다리 4개 · 뒤 다리와 레일 일체형')
    if 'id="downloadFeet"' not in h:
        h=re.sub(r'(<a id="downloadBoard".*?</a>)',r'\1 <a id="downloadFeet" href="../../../hardware/studboard/out/tango-camera-feet-print-plate.stl" download="tango-camera-board-feet.stl">다리·레일 STL 다운로드</a>',h,count=1)
    h=h.replace('?240:0,0,0);gl.uniform3fv', '?240:0,0,exploded&&[\'frontFootLeft\',\'frontFootRight\',\'rearFeetRail\'].includes(p.name)?-25:0);gl.uniform3fv')
    htmlfile.write_text(h,encoding='utf8')
    report={'triangle_count':len(full.faces),'bounds_mm':ready.extents.tolist(),'feet_plate_bounds_mm':feet_plate.extents.tolist(),'feet_triangle_count':len(feet_plate.faces),'feet_simplification_mm':.01,'flat_bottom':True,'watertight':full.is_volume,'foot_count':4,'printed_parts':4,'plate_floor_mm':2.2,'stud_radius_mm':2.5,'stud_height_mm':2.9,'stud_sides':12,'stud_bands':3,'simplification_tolerance_mm':.025,'pin_diameter_mm':4.8,'socket_diameter_mm':4.9,'pin_depth_mm':4,'rib_peak_diameter_mm':5.06,'assembly_nominal_interference_mm3':0,'block_collision_mm3':block_collision,'physical_test':False,'support_note':'plate flat-bottom down; rear foot/rail bridge may need local support'}
    (OUT/'flat_board_report.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps(report,indent=2),flush=True)

if __name__=='__main__':
    main()
    import os
    os._exit(0)
