"""One-by-two block matching the rounded two-by-two block and 15 mm board."""
import os,json,re,io
import numpy as np,trimesh,manifold3d as md,cadquery as cq
from sticker_block_2x2 import ROOT,OUT,make_block
from tablet_cradle import encode

def main():
    block=make_block(1,2)
    assert block.isValid() and len(block.Solids())==1
    bb=block.BoundingBox();assert abs(bb.xlen-14.6)<1e-6 and abs(bb.ylen-29.6)<1e-6 and abs(bb.zlen-5.5)<1e-6
    collisions=[]
    for x in (-7.5,7.5):
        for y in (-15,0,15):
            # Radius/height cylinder conservatively encloses the current dome.
            stud=cq.Workplane('XY').center(x-.05,y).circle(2.5).extrude(2.9).val()
            collisions.append(block.intersect(stud).Volume())
    assert max(collisions)<1e-6
    step=OUT/'sticker-block-1x2.step';cq.exporters.export(block,str(step))
    step.write_text('\n'.join(s.rstrip() for s in step.read_text().splitlines())+'\n')
    cq.exporters.export(block,str(OUT/'sticker-block-1x2.stl'),tolerance=.025,angularTolerance=.1)
    m=trimesh.load(OUT/'sticker-block-1x2.stl',force='mesh');m.update_faces(m.nondegenerate_faces());m.remove_unreferenced_vertices()
    sm=md.Manifold(md.Mesh(m.vertices.astype(np.float32),m.faces.astype(np.uint32))).simplify(.01).to_mesh64()
    m=trimesh.Trimesh(vertices=sm.vert_properties[:,:3],faces=sm.tri_verts)
    assert m.is_volume and len(m.split())==1
    m.apply_translation(-m.bounds[0]);m.export(OUT/'sticker-block-1x2.stl')
    f=ROOT/'packages/client/public/tango-board-only.standalone.html';h=f.read_text(encoding='utf8')
    match=re.search(r'<script id="meshData" type="application/json">(.*?)</script>',h,re.S);d=json.loads(match[1])
    v,t=block.tessellate(.025,.1)
    d['block1x2']=encode([v[i].toTuple() for tri in t for i in tri],center=(0,0,4))
    d['block1x2']['centre']=[67.5,105,17]
    d['block1x2'].update(size=[14.6,29.6,5.5],grid=[1,2])
    h=h[:match.start(1)]+json.dumps(d,separators=(',',':'))+h[match.end(1):]
    if 'id="block1x2Top"' not in h:
        h=h.replace('<button id="blockBottom">블록 아래</button>','<button id="blockBottom">2×2 블록 아래</button><button id="block1x2Top">1×2 블록 위</button><button id="block1x2Bottom">1×2 블록 아래</button>')
        h=h.replace('const focus=view===\'assembly\'?null:mesh.block;',"const focus=view==='assembly'?null:view==='block1x2'?mesh.block1x2:mesh.block;")
        h=h.replace(":p.name==='block'))",":p.name===(view==='block1x2'?'block1x2':'block')))")
        h=h.replace("if(name!=='block'&&", "if(!['block','block1x2'].includes(name)&&")
        h=h.replace("name==='block'?[", "['block','block1x2'].includes(name)?[")
        h=h.replace("window.addEventListener('resize',draw);","document.getElementById('block1x2Top').onclick=()=>{view='block1x2';yaw=0;pitch=-.5;zoom=1;draw();};document.getElementById('block1x2Bottom').onclick=()=>{view='block1x2';yaw=0;pitch=Math.PI-.45;zoom=1;draw();};window.addEventListener('resize',draw);")
    f.write_text(h,encoding='utf8')
    report=dict(size_mm=[14.6,29.6,5.5],socket_count=6,socket_radius_mm=2.85,socket_depth_mm=3.2,sticker_area_mm=[12.6,27.6],bottom_round_mm=.5,stud_envelope_collision_mm3=collisions,triangles=len(m.faces),closed_single_body=True,physical_test=False)
    (OUT/'sticker-block-1x2-report.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps(report),flush=True)

if __name__=='__main__':
    main();os._exit(0)
