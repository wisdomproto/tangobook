"""격자판 위쪽 태블릿 거치 홈 시안. CadQuery로 STEP/STL 및 HTML 메시 생성."""
import base64
import json
from pathlib import Path
import re
import struct
import cadquery as cq

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).parent/'out'
SLOT_LENGTH,SLOT_WIDTH,LEAN=260.0,13.0,15.0

def part(shape, center=(120,277.5,13)):
    vv,tt=shape.tessellate(.05,.1)
    raw=b''.join(struct.pack('<hhh',*(round((vv[i].toTuple()[k]-center[k])*100) for k in range(3))) for tri in tt for i in tri)
    return {'b64':base64.b64encode(raw).decode(),'centre':list(center),'scale':100}

def main():
    # 높인 베젤18.1에서 전체높이20의 거치부까지 연속 경사면으로 연결한다.
    body=(cq.Workplane('YZ').polyline([(239.8,0),(315,0),(315,20),(265,20),(239.8,18.1)])
          .close().extrude(270).translate((-15,0,0)))
    body=body.edges('|Z').fillet(8)
    cutter=(cq.Workplane('XY').box(SLOT_LENGTH,SLOT_WIDTH,45,centered=(True,True,False))
            .edges('|Z').fillet(3).rotate((0,0,0),(1,0,0),-LEAN).translate((120,280,5)))
    rail=body.cut(cutter).val()
    assert rail.isValid() and len(rail.Solids())==1
    assert rail.isInside(cq.Vector(120,280,2),1e-5)
    assert not rail.isInside(cq.Vector(120,282,15),1e-5)
    # 폭240/두께8/높이170mm 가상 태블릿: 실제 기종이 아닌 맞춤 확인용.
    tablet=(cq.Workplane('XY').box(240,8,170,centered=(True,True,False))
            .edges('|Z').fillet(2).rotate((0,0,0),(1,0,0),-LEAN).translate((120,280,5))).val()
    collision=rail.intersect(tablet).Volume()
    assert collision<1e-6,collision
    OUT.mkdir(exist_ok=True)
    cq.exporters.export(rail,str(OUT/'tablet-cradle.step'))
    cq.exporters.export(rail,str(OUT/'tablet-cradle.stl'),tolerance=.05,angularTolerance=.1)
    f=ROOT/'packages/client/public/tango-board-only.standalone.html'
    h=f.read_text(encoding='utf8')
    match=re.search(r'<script id="meshData" type="application/json">(.*?)</script>',h,re.S)
    data=json.loads(match[1])
    # 기존 판의 뒤쪽 둥근 끝을 제거하고 경사 거치부와 하나의 메시로 잇는다.
    base_match=re.search(r'<script id="boardBase" type="application/json">(.*?)</script>',h,re.S)
    if base_match:
        original=json.loads(base_match[1])
    else:
        original=data['board']
    raw=base64.b64decode(original['b64'])
    points=[tuple(q[k]/original['scale']+original['centre'][k]+(8.1 if k==2 else 0) for k in range(3)) for q in struct.iter_unpack('<hhh',raw)]
    kept=[]
    for i in range(0,len(points),3):
        poly=list(points[i:i+3]);clipped=[]
        for j,u in enumerate(poly):
            v=poly[(j+1)%3];du=240-u[1];dv=240-v[1]
            if du>=-1e-8:clipped.append(u)
            if (du>=0)!=(dv>=0):
                t=du/(du-dv);clipped.append(tuple(u[k]+(v[k]-u[k])*t for k in range(3)))
        for j in range(1,len(clipped)-1):kept.extend([clipped[0],clipped[j],clipped[j+1]])
    base=(cq.Workplane('XY').box(270,330,8.1,centered=(True,True,False)).edges('|Z').fillet(15).translate((120,150,0))).val()
    bv,bt=base.tessellate(.05,.1)
    kept.extend(tuple(bv[i].toTuple()) for t in bt for i in t)
    rv,rt=rail.tessellate(.05,.1)
    kept.extend(tuple(rv[i].toTuple()) for t in rt for i in t)
    center=(120,150,15)
    combined=b''.join(struct.pack('<hhh',*(round((v[k]-center[k])*100) for k in range(3))) for v in kept)
    data['board']={'b64':base64.b64encode(combined).decode(),'centre':list(center),'scale':100,'integratedCradle':True,'size':[270,330,20]}
    data.pop('cradle',None)
    data['board'].update(slotLength=SLOT_LENGTH,slotWidth=SLOT_WIDTH,lean=LEAN,insertionDepth=15)
    data['tablet']=part(tablet,(120,292,88))
    h=h[:match.start(1)]+json.dumps(data,separators=(',',':'))+h[match.end(1):]
    if not base_match:
        h=h.replace('<script>','<script id="boardBase" type="application/json">'+json.dumps(original,separators=(',',':'))+'</script>\n<script>',1)
    f.write_text(h,encoding='utf8')
    print(f'Cradle valid single solid; slot {SLOT_LENGTH}x{SLOT_WIDTH}mm, lean{LEAN}deg; sample tablet collision {collision:.6f}mm3')

if __name__=='__main__':main()
