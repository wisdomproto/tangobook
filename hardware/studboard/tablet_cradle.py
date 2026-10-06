"""격자판 위쪽 태블릿 거치 홈 시안. CadQuery로 STEP/STL 및 HTML 메시 생성."""
import base64
import json
from pathlib import Path
import re
import struct
import cadquery as cq

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).parent/'out'
SLOT_LENGTH,SLOT_WIDTH,LEAN=250.0,13.0,15.0

def part(shape, center=(120,277.5,13)):
    vv,tt=shape.tessellate(.05,.1)
    raw=b''.join(struct.pack('<hhh',*(round((vv[i].toTuple()[k]-center[k])*100) for k in range(3))) for tri in tt for i in tri)
    return {'b64':base64.b64encode(raw).decode(),'centre':list(center),'scale':100}

def main():
    body=(cq.Workplane('XY').box(270,47,26,centered=(True,True,False))
          .edges('|Z').fillet(8).faces('>Z').edges().fillet(2).translate((120,276.5,0)))
    cutter=(cq.Workplane('XY').box(SLOT_LENGTH,SLOT_WIDTH,45,centered=(True,True,False))
            .edges('|Z').fillet(3).rotate((0,0,0),(1,0,0),-LEAN).translate((120,270,6)))
    rail=body.cut(cutter).val()
    assert rail.isValid() and len(rail.Solids())==1
    assert rail.isInside(cq.Vector(120,270,2),1e-5)
    assert not rail.isInside(cq.Vector(120,273,18),1e-5)
    # 폭240/두께8/높이170mm 가상 태블릿: 실제 기종이 아닌 맞춤 확인용.
    tablet=(cq.Workplane('XY').box(240,8,170,centered=(True,True,False))
            .edges('|Z').fillet(2).rotate((0,0,0),(1,0,0),-LEAN).translate((120,270,6))).val()
    collision=rail.intersect(tablet).Volume()
    assert collision<1e-6,collision
    OUT.mkdir(exist_ok=True)
    cq.exporters.export(rail,str(OUT/'tablet-cradle.step'))
    cq.exporters.export(rail,str(OUT/'tablet-cradle.stl'),tolerance=.05,angularTolerance=.1)
    f=ROOT/'packages/client/public/tango-board-only.standalone.html'
    h=f.read_text(encoding='utf8')
    match=re.search(r'<script id="meshData" type="application/json">(.*?)</script>',h,re.S)
    data=json.loads(match[1]);data['cradle']=part(rail);data['cradle'].update(slotLength=SLOT_LENGTH,slotWidth=SLOT_WIDTH,lean=LEAN)
    data['tablet']=part(tablet,(120,292,88))
    f.write_text(h[:match.start(1)]+json.dumps(data,separators=(',',':'))+h[match.end(1):],encoding='utf8')
    print(f'Cradle valid single solid; slot {SLOT_LENGTH}x{SLOT_WIDTH}mm, lean{LEAN}deg; sample tablet collision {collision:.6f}mm3')

if __name__=='__main__':main()
