"""Read existing CAD without changing designs; report solid ABS equivalents.

Run: python hardware/costing/measure_abs.py
CAD cavities are excluded. FDM infill/support consumption is NOT estimated here.
"""
from pathlib import Path
import base64
import hashlib
import json
import re
import struct
import sys
import types

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).parent
# This host hangs importing optional native optimizers/GUI modules. Neither is
# used by STEP import, explicit OCCT solids, or volume integration.
sys.modules['vtk'] = types.ModuleType('vtk')
sys.modules['nlopt'] = types.ModuleType('nlopt')
sys.path[:0] = [str(ROOT/'hardware/studboard'), str(ROOT/'hardware/periscope')]
import cadquery as cq
import trimesh

DENSITY = 1.04  # g/cm3; LG Chem HI121 typical value, not a chosen production grade
rows = {}

def cad(name, shape, source):
    solids = shape.Solids() if isinstance(shape, cq.Shape) else shape.solids().vals()
    assert solids and all(s.isValid() for s in solids), name
    volume = sum(s.Volume() for s in solids)
    assert volume > 0
    rows[name] = dict(volume_mm3=volume, abs_solid_g=volume/1000*DENSITY,
                      method='OCCT all solids', solid_count=len(solids), source=source)
    print(name, round(rows[name]['abs_solid_g'], 3), 'g', flush=True)

html_path = ROOT/'packages/client/public/tango-board-only.standalone.html'
data = json.loads(re.search(r'<script id="meshData" type="application/json">(.*?)</script>',
                           html_path.read_text(encoding='utf-8'), re.S)[1])
def decoded(name):
    item = data[name]
    vertices = [tuple(x/item['scale']+c for x,c in zip(v,item['centre']))
                for v in struct.iter_unpack('<hhh',base64.b64decode(item['b64']))]
    mesh = trimesh.Trimesh(vertices, [[i,i+1,i+2] for i in range(0,len(vertices),3)])
    assert mesh.is_volume, name
    return mesh

# Board and stud heads overlap at their bases; UNION prevents double counting.
board = trimesh.boolean.union([decoded('board'), decoded('grid')], engine='manifold')
assert board.is_volume
rows['board_with_studs'] = dict(volume_mm3=float(board.volume),
    abs_solid_g=float(board.volume)/1000*DENSITY, method='closed display meshes, Boolean union',
    source=str(html_path.relative_to(ROOT)), source_sha256=hashlib.sha256(html_path.read_bytes()).hexdigest())
print('board_with_studs', round(rows['board_with_studs']['abs_solid_g'],3),'g',flush=True)

for name,file in [('square_block','sticker-block-2x2.step'),
                  ('vowel_block','sticker-block-1x2.step'),
                  ('cradle','tablet-cradle-backrest.step')]:
    path=ROOT/'hardware/studboard/out'/file
    cad(name,cq.importers.importStep(str(path)),str(path.relative_to(ROOT)))
    rows[name]['source_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
import flat_board
cad('front_foot',flat_board.foot(*flat_board.PINS[0]),'hardware/studboard/flat_board.py:foot')

import pebble_compact_fixed as fixed
for name,factory in fixed.PARTS.items():
    cad('fixed_'+name,factory(),'hardware/periscope/pebble_compact_fixed.py:'+name)

# Record measured primary BOM before computing the alternative reflector.
def save():
    # User selected a bought-in stand (KRW 1,500), not the custom CAD cradle.
    base=sum(rows[n]['abs_solid_g']*q for n,q in
             [('board_with_studs',1),('front_foot',2)])
    fixed_g=sum(r['abs_solid_g'] for n,r in rows.items() if n.startswith('fixed_'))
    totals={}
    for language,blocks in [('ko',{'square_block':28,'vowel_block':10}),
                            ('en',{'square_block':52}),
                            ('ko_en',{'square_block':80,'vowel_block':10})]:
        block_g=sum(rows[n]['abs_solid_g']*q for n,q in blocks.items())
        totals[language]=dict(block_quantities=blocks,blocks_g=block_g,
            board_assembly_g=base,reflector_fixed_g=fixed_g,total_fixed_g=base+block_g+fixed_g)
        if any(n.startswith('adjustable_') for n in rows):
            alt=sum(r['abs_solid_g'] for n,r in rows.items() if n.startswith('adjustable_'))
            totals[language].update(reflector_adjustable_g=alt,total_adjustable_g=base+block_g+alt)
    report=dict(primary_kit='ko_en',density_g_cm3=DENSITY,mirror_won_user_supplied=100, purchased_stand_won_user_supplied=1500,
                note='Custom cradle is measured for reference but excluded from kit totals; bought-in stand costs KRW 1500. Solid polymer equivalent; excludes mirror/foam/labels/packaging, runners/supports/infill. English full kit assumes same board and mirror; two existing front feet retained.',
                parts=rows,totals=totals)
    (OUT/'abs-volume-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(totals,indent=2),flush=True)
save()
import pebble_geared_print
for name,shape in pebble_geared_print.print_parts(height_only=True,modelkit=True,wrap=True).items():
    cad('adjustable_'+name,shape,'hardware/periscope/pebble_geared_print.py:print_parts(wrap=True)')
save()
