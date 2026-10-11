"""Local Bambu Studio costing simulation only; never sends jobs to a printer.

Requires CadQuery, trimesh, manifold3d and Bambu Studio default installation.
Profiles are flattened from bundled files; user profiles/accounts are not read.
"""
from pathlib import Path
import base64
import hashlib
import json
import math
import re
import struct
import subprocess
import sys
import types

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'tmp/abs-slice'
OUT.mkdir(exist_ok=True)
PRESETS=Path('C:/Program Files/Bambu Studio/resources/profiles/BBL')
sys.modules['vtk']=types.ModuleType('vtk')
sys.modules['nlopt']=types.ModuleType('nlopt')
sys.path[:0]=[str(ROOT/'hardware/studboard'),str(ROOT/'hardware/periscope')]
import cadquery as cq
import trimesh
import flat_board
import pebble_compact_fixed as fixed

def profile(kind,name):
    d=json.loads((PRESETS/kind/(name+'.json')).read_text(encoding='utf-8'))
    parent=d.pop('inherits',None)
    p=profile(kind,parent) if parent else {}
    p.update(d)
    return p

settings={}
for kind,name in [('machine','Bambu Lab H2S 0.4 nozzle'),
                  ('process','0.20mm Standard @BBL H2S'),('filament','Generic ABS @BBL H2S 0.4 nozzle')]:
    d=profile(kind,name)
    if kind=='process':
        d.update(wall_loops='3',sparse_infill_density='15%',enable_support='1',
                 support_type='tree(auto)',support_on_build_plate_only='1',
                 brim_type='outer_only',brim_width='5')
    if kind=='filament':d.update(filament_density=['1.04'])
    settings[kind]=d
    (OUT/(kind+'.json')).write_text(json.dumps(d),encoding='utf-8')

def cadmesh(shape):
    solids=shape.Solids() if isinstance(shape,cq.Shape) else shape.solids().vals()
    meshes=[]
    for solid in solids:
        v,f=solid.tessellate(.025,.1)
        m=trimesh.Trimesh([p.toTuple() for p in v],f)
        m.update_faces(m.nondegenerate_faces());m.remove_unreferenced_vertices()
        assert m.is_volume
        meshes.append(m)
    return trimesh.util.concatenate(meshes)

data=json.loads(re.search(r'<script id="meshData" type="application/json">(.*?)</script>',
    (ROOT/'packages/client/public/tango-board-only.standalone.html').read_text(encoding='utf-8'),re.S)[1])
def decoded(name):
    it=data[name]
    v=[tuple(x/it['scale']+c for x,c in zip(v,it['centre']))
       for v in struct.iter_unpack('<hhh',base64.b64decode(it['b64']))]
    m=trimesh.Trimesh(v,[[i,i+1,i+2] for i in range(0,len(v),3)])
    assert m.is_volume
    return m

meshes={'board_with_studs':trimesh.boolean.union([decoded('board'),decoded('grid')],engine='manifold')}
for name,file in [('square_block','sticker-block-2x2.step'),('vowel_block','sticker-block-1x2.step'),
                  ('cradle','tablet-cradle-backrest.step')]:
    meshes[name]=cadmesh(cq.importers.importStep(str(ROOT/'hardware/studboard/out'/file)))
meshes['front_foot']=cadmesh(flat_board.foot(*flat_board.PINS[0]))
# Same separated print orientations as compact_fixed_build.py, no CAD changes.
b=fixed.b
angle=math.degrees(math.atan2(-(b.TONGUE_BOT-b.PIVOT_Z),b.old.GRIP_FREE+b.old.PLATE_T+.5-b.old.PIVOT_Y))
rotations={'shell_left':((0,1,0),90),'shell_right':((0,1,0),-90),
           'paddle':((1,0,0),angle+180),'rear_panel':((1,0,0),-90),'keeper':((1,0,0),180)}
parts=[];x=y=row_height=0
for name,factory in fixed.PARTS.items():
    axis,deg=rotations[name]
    mesh=cadmesh(factory().rotate((0,0,0),axis,deg))
    mesh.apply_translation(-mesh.bounds[0])
    if x and x+mesh.extents[0]>220:
        x=0;y+=row_height+12;row_height=0
    mesh.apply_translation((x,y,0));parts.append(mesh)
    x+=mesh.extents[0]+12;row_height=max(row_height,mesh.extents[1])
meshes['reflector_fixed']=trimesh.util.concatenate(parts)

measured=json.loads((ROOT/'hardware/costing/abs-volume-report.json').read_text(encoding='utf-8'))
results={}
for name,mesh in meshes.items():
    target=(measured['totals']['ko']['reflector_fixed_g'] if name=='reflector_fixed'
            else measured['parts'][name]['abs_solid_g'])
    assert abs(mesh.volume/1000*1.04-target)/target < .003,(name,target,mesh.volume)
    folder=OUT/name;folder.mkdir(exist_ok=True)
    mesh.apply_translation(-mesh.bounds[0]);stl=folder/(name+'.stl');mesh.export(stl)
    args=['C:/Program Files/Bambu Studio/bambu-studio.exe',
          '--load-settings',str(OUT/'machine.json')+';'+str(OUT/'process.json'),
          '--load-filaments',str(OUT/'filament.json'),'--curr-bed-type','Textured PEI Plate',
          '--arrange','1','--slice','0','--export-3mf',name+'.3mf','--outputdir',str(folder),str(stl)]
    p=subprocess.run(args,cwd=folder,capture_output=True,creationflags=0x08000000,timeout=180)
    report=json.loads((folder/'result.json').read_text())
    assert p.returncode==0 and report['return_code']==0,(name,report)
    plates=report['sliced_plates']
    assert len(plates)==1,(name,len(plates))
    plate=plates[0]
    results[name]=dict(total_used_g=sum(f['total_used_g'] for f in plate['filaments']),
        main_used_g=sum(f['main_used_g'] for f in plate['filaments']),
        estimated_seconds=plate['total_predication'],warning=plate.get('warning_message'),
        gcode_sha256=hashlib.sha256((folder/'plate_1.gcode').read_bytes()).hexdigest())
    print(name,results[name],flush=True)
totals={}
for language,counts in [('ko',{'square_block':28,'vowel_block':10}),('en',{'square_block':52}),
                       ('ko_en',{'square_block':80,'vowel_block':10})]:
    # The custom cradle remains a reference measurement, not a purchased kit part.
    counts.update(board_with_studs=1,front_foot=2,reflector_fixed=1)
    totals[language]=dict(quantities=counts,
        estimated_used_g=sum(results[n]['total_used_g']*q for n,q in counts.items()),
        separate_job_seconds=sum(results[n]['estimated_seconds']*q for n,q in counts.items()))
output=dict(primary_kit='ko_en',profile_settings=settings,parts=results,totals=totals,purchased_stand_won_user_supplied=1500,mirror_won_user_supplied=100,
    note='Custom cradle excluded from totals per user decision. Simulation, not a printed/weighed sample. Individual block/foot jobs multiplied; batching will change brims/supports/time. Failure allowance excluded. ABS+ price conversion uses 1.06/1.04 density ratio.')
(ROOT/'hardware/costing/abs-slice-report.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(totals,indent=2),flush=True)
