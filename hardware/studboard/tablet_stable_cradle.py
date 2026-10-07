"""Extended heel and removable 7 mm tablet liners for the existing rail."""
from pathlib import Path
import json,re,sys,os,numpy as np,trimesh,manifold3d as md,cadquery as cq
from tablet_cradle import ROOT,OUT,BACK,part
from flat_board import mesh

# Printed long rails bound with the previous 0.10 mm clearance. Change only
# the female cradle, so already printed boards and foot rails stay usable.
RAIL_CLEARANCE=.35
RAIL_ENTRY_CLEARANCE=.65

def main():
    old=cq.importers.importStep(str(OUT/'tablet-cradle.step'))
    heel=(cq.Workplane('XY').box(226,51,4,centered=(True,False,False)).edges('|Z').fillet(8)
          .faces('>Z').edges().fillet(1).faces('<Z').edges().fillet(.6).translate((105,272,0)))
    holder=old.union(heel)
    profile=[(BACK-.5,5),(BACK+10,3),(BACK+10,15),(BACK-.5,13)]
    groove=(cq.Workplane('YZ').polyline(profile).close().offset2D(RAIL_CLEARANCE)
            .extrude(226.1).translate((-16,0,0)))
    entry=(cq.Workplane('YZ').polyline(profile).close().offset2D(RAIL_ENTRY_CLEARANCE)
           .extrude(5.5).translate((-8.5,0,0)))
    holder=holder.cut(groove).cut(entry)
    original_board=cq.importers.importStep(str(OUT/'recognition-board-14x14.step'))
    rail_collisions=[holder.intersect(original_board.translate((-dx,0,0))).val().Volume()
                     for dx in (0,1,5,20,100,210,230)]
    assert max(rail_collisions)<1e-6,rail_collisions
    rail=cq.Workplane('YZ').polyline(profile).close().extrude(210).edges().fillet(1.2)
    captures=[rail.intersect(holder.translate(shift)).val().Volume()
              for shift in ((0,0,1),(0,3,0))]
    assert min(captures)>1,captures
    liners=[];nominal=[]
    for x in (45,165):
        p=(cq.Workplane('XY').box(30,12.7,14,centered=(True,True,False)).edges('|Z').fillet(.6).translate((0,0,.8)))
        slit=cq.Workplane('XY').box(34,7.4,20,centered=(True,True,False)).translate((0,0,1.8))
        p=p.cut(slit).faces('>Z').edges().fillet(.3)
        nominal.append(p.rotate((0,0,0),(1,0,0),-15).translate((x,243,5)))
        for side in (-1,1):
            for xx in (-10,0,10):
                rib=cq.Workplane('XY').center(xx,side*6.34).circle(.22).extrude(10).translate((0,0,2)).edges('>Z').fillet(.15)
                p=p.union(rib)
        liners.append(p.rotate((0,0,0),(1,0,0),-15).translate((x,243,5)))
    for p in nominal:
        assert holder.intersect(p).val().Volume()<1e-6
        for dz in (1,3,10,20):assert holder.intersect(p.translate((0,dz*np.sin(np.deg2rad(15)),dz*np.cos(np.deg2rad(15))))).val().Volume()<1e-6
    overlaps=[holder.intersect(p).val().Volume() for p in liners]
    assert all(0<v<5 for v in overlaps)
    tablet=(cq.Workplane('XY').box(179.5,7,248.6,centered=(True,True,False)).edges('|Z').fillet(2)
            .translate((0,0,1.9)).rotate((0,0,0),(1,0,0),-15).translate((105,243,5)))
    assembly=holder.union(liners[0]).union(liners[1])
    assert assembly.intersect(tablet).val().Volume()<1e-6
    meshes=[]
    for name,p in [('tablet-cradle-stable',holder),('tablet-liner-left',liners[0]),('tablet-liner-right',liners[1])]:
        cq.exporters.export(p,str(OUT/(name+'.step')))
        m=mesh(p)
        # Normalize through STL then reduce redundant curved faces.
        import io
        m=trimesh.load(io.BytesIO(m.export(file_type='stl')),file_type='stl',force='mesh')
        sm=md.Manifold(md.Mesh(m.vertices.astype(np.float32),m.faces.astype(np.uint32))).simplify(.01).to_mesh64()
        q=trimesh.Trimesh(vertices=sm.vert_properties[:,:3],faces=sm.tri_verts)
        comps=sorted(q.split(only_watertight=False),key=lambda c:abs(c.volume),reverse=True)
        assert all(abs(c.volume)<1e-6 for c in comps[1:]);q=comps[0];assert q.is_volume
        q.export(OUT/(name+'-assembled.stl'))
        if name!='tablet-cradle-stable':q.apply_transform(trimesh.transformations.rotation_matrix(np.deg2rad(15),[1,0,0]))
        q.apply_translation(-q.bounds[0]);q.export(OUT/(name+'-print.stl'));meshes.append(q)
    meshes[1].apply_translation([0,115,0]);meshes[2].apply_translation([40,115,0])
    combined=trimesh.util.concatenate(meshes);assert max(combined.extents[:2])<240
    combined.export(OUT/'tango-camera-stable-cradle-print-plate.stl')
    mesh(assembly).export(OUT/'tablet-support-assembly.stl')
    f=ROOT/'packages/client/public/tango-board-only.standalone.html';h=f.read_text(encoding='utf8')
    match=re.search(r'<script id="meshData" type="application/json">(.*?)</script>',h,re.S);d=json.loads(match[1])
    d['cradle']=part(holder.val());d['tabletLinerLeft']=part(liners[0].val());d['tabletLinerRight']=part(liners[1].val())
    d['tablet']=part(tablet.val());d['tablet']['size_mm']=[179.5,7,248.6]
    h=h[:match.start(1)]+json.dumps(d,separators=(',',':'))+h[match.end(1):]
    h=h.replace('226 × 286 mm','226 × 331 mm').replace('13 mm · 삽입 약 15 mm','13 mm · 7mm 태블릿용 간격 패드 · 삽입 약 15 mm')
    if 'id="downloadCradle"' not in h:
        h=h.replace('</header>',' <a id="downloadCradle" href="../../../hardware/studboard/out/tango-camera-stable-cradle-print-plate.stl" download="tango-camera-stable-cradle-with-liners.stl">전도 보완 거치대·패드 STL 다운로드</a></header>')
    h=h.replace('download="tango-camera-stable-cradle-with-liners.stl"','download="tango-camera-cradle-clearance035-with-liners.stl"')
    h=h.replace('전도 보완 거치대·패드 STL 다운로드','홈 여유 0.35mm 거치대·패드 STL 다운로드')
    if "p.name==='tabletLinerLeft'" not in h:
        h=h.replace("p.name==='cradle'||p.name==='tablet'", "p.name==='cradle'||p.name==='tablet'||p.name==='tabletLinerLeft'||p.name==='tabletLinerRight'")
    f.write_text(h,encoding='utf8')
    report=dict(rail_clearance_per_face_mm=RAIL_CLEARANCE,rail_entry_clearance_mm=RAIL_ENTRY_CLEARANCE,rail_insertion_collision_mm3=rail_collisions,rail_capture_overlap_mm3=captures,heel_extension_mm=45,rear_support_y_mm=holder.faces('<Z').val().BoundingBox().ymax,slot_width_mm=13,liner_inner_width_mm=7.4,liner_outer_width_mm=12.7,liner_nominal_insertion_collision_mm3=0,liner_rib_overlap_mm3=overlaps,tablet_collision_mm3=0,print_plate_bounds_mm=combined.extents.tolist(),triangle_count=len(combined.faces),physical_test=False)
    (OUT/'stable_cradle_report.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps(report,indent=2),flush=True)

if __name__=='__main__':
    main();os._exit(0)
