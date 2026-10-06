"""탱고 카메라 버전: 14×14 격자판과 도브테일 태블릿 거치부. CadQuery/trimesh 필요."""
import base64,json,re,struct
from pathlib import Path
import cadquery as cq
import trimesh
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).parent/'out'
PITCH,CELLS,GRID=15.,14,210.
WIDTH,HEIGHT,LEAN=240.,20.,15.

def encode(points,center=(105.,135.,10.)):
    raw=b''.join(struct.pack('<hhh',*(round((v[k]-center[k])*100) for k in range(3))) for v in points)
    return dict(b64=base64.b64encode(raw).decode(),centre=list(center),scale=100)
def part(shape):
    vv,tt=shape.tessellate(.035,.1)
    return encode([tuple(vv[i].toTuple()) for t in tt for i in t])
def clip(poly,axis,bound,sign):
    out=[]
    for i,a in enumerate(poly):
        b=poly[(i+1)%len(poly)];da=sign*(a[axis]-bound);db=sign*(b[axis]-bound)
        if da>=-1e-8:out.append(a)
        if (da>=0)!=(db>=0):
            t=da/(da-db);out.append(tuple(a[k]+t*(b[k]-a[k]) for k in range(3)))
    return out

def main():
    f=ROOT/'packages/client/public/tango-board-only.standalone.html';h=f.read_text(encoding='utf8')
    match=re.search(r'<script id="meshData" type="application/json">(.*?)</script>',h,re.S);data=json.loads(match[1])
    original=json.loads(re.search(r'<script id="boardBase" type="application/json">(.*?)</script>',h,re.S)[1])
    raw=base64.b64decode(original['b64']);verts=[tuple(q[k]/original['scale']+original['centre'][k] for k in range(3)) for q in struct.iter_unpack('<hhh',raw)]
    cell=[]
    for i in range(0,len(verts),3):
        poly=verts[i:i+3]
        for axis,bound,sign in ((0,75,1),(0,90,-1),(1,75,1),(1,90,-1),(2,4.49,1)):
            if len(poly)<3:break
            poly=clip(poly,axis,bound,sign)
        for j in range(1,len(poly)-1):cell.extend(tuple((v[0]-75,v[1]-75,v[2]+8.1)) for v in (poly[0],poly[j],poly[j+1]))
    grid=[(v[0]+x*PITCH,v[1]+y*PITCH,v[2]) for y in range(CELLS) for x in range(CELLS) for v in cell]
    board=(cq.Workplane('XY').box(WIDTH,WIDTH,HEIGHT,centered=(True,True,False)).edges('|Z').fillet(15)
           .faces('>Z').edges().fillet(1).translate((105,105,0)))
    pocket=(cq.Workplane('XY').box(GRID,GRID,10,centered=(True,True,False)).edges('|Z').fillet(1).translate((105,105,12.6)))
    board=board.cut(pocket)
    # 판 뒤쪽의 긴 수평 도브테일: 바깥 머리가 목보다 두꺼워 들림을 잡는다.
    profile=[(224.5,5),(235,3),(235,15),(224.5,13)]
    rail=(cq.Workplane('YZ').polyline(profile).close().extrude(210)
          .edges().fillet(1.2))
    board=board.union(rail)
    shell=board.val()
    body=(cq.Workplane('XY').box(WIDTH,60,HEIGHT,centered=(True,True,False)).edges('|Z').fillet(8)
          .faces('>Z').edges().fillet(1).translate((105,255,0)))
    cutter=(cq.Workplane('XY').box(260,13,40,centered=(True,True,False)).edges().fillet(.8).rotate((0,0,0),(1,0,0),-LEAN).translate((105,250,5)))
    holder=body.cut(cutter)
    holder=holder.edges(cq.selectors.BoxSelector((-16,240,19.8),(226,264,20.2))).fillet(.8)
    # 앞면 모서리 사이 접합면을 평평하게 연결한다.
    bridge=cq.Workplane('XY').box(220,2,HEIGHT,centered=(True,True,False)).translate((105,226,0))
    holder=holder.union(bridge)
    # 왼쪽이 열린 암레일. 오른쪽 끝 벽이 밀어 넣는 위치를 제한한다.
    groove=(cq.Workplane('YZ').polyline(profile).close().offset2D(.10).extrude(226.1).translate((-16,0,0)))
    holder=holder.cut(groove)
    holder=holder.faces('<X').edges().fillet(.5)
    nominal=board
    # 긴 레일 중 두 구간의 낮은 마찰 리브만 암레일에 살짝 닿는다.
    for x in (62.5,147.5):
        for z in (6.,12.):
            rib=cq.Workplane('XY').box(45,.14,1.2).translate((x,235.06,z))
            board=board.union(rib)
    shell=board.val();cradle=holder.val();nominal=nominal.val()
    assert shell.isValid() and cradle.isValid() and len(shell.Solids())==len(cradle.Solids())==1
    bulk_collision=cradle.intersect(nominal).Volume();press_volume=cradle.intersect(shell).Volume()
    assert bulk_collision<1e-6,bulk_collision
    assert 0<press_volume<20,press_volume
    # 도브테일의 들림/뒤로 당김은 맞물림에 막혀야 한다.
    assert nominal.intersect(cradle.translate((0,0,1))).Volume()>1
    assert nominal.intersect(cradle.translate((0,3,0))).Volume()>1
    # 분리 동작 중 리브 외에 본체가 충돌하지 않아야 한다.
    for shift in (20.,100.,230.):
        assert nominal.intersect(cradle.translate((shift,0,0))).Volume()<1e-6
    tablet=(cq.Workplane('XY').box(240,8,170,centered=(True,True,False)).edges('|Z').fillet(2)
            .rotate((0,0,0),(1,0,0),-LEAN).translate((105,250,5))).val()
    assert cradle.intersect(tablet).Volume()<1e-6
    OUT.mkdir(exist_ok=True)
    for name,shape in (('recognition-board-14x14',shell),('tablet-cradle',cradle)):
        cq.exporters.export(shape,str(OUT/(name+'.step')))
        cq.exporters.export(shape,str(OUT/(name+'.stl')),tolerance=.035,angularTolerance=.1)
        # 곡면 경계에서 OCC가 만든 면적0 삼각형만 제거한다.
        mesh=trimesh.load(OUT/(name+'.stl'))
        mesh.update_faces(mesh.nondegenerate_faces());mesh.update_faces(mesh.unique_faces());mesh.remove_unreferenced_vertices()
        assert mesh.is_watertight and mesh.is_winding_consistent
        mesh.export(OUT/(name+'.stl'))
    data['board']=part(shell);data['board'].update(size=[240,240,20],cols=14,rows=14,pitch=15)
    data['grid']=encode(grid);data['cradle']=part(cradle);data['tablet']=part(tablet)
    data['block']['centre']=[105,105,17.]
    h=h[:match.start(1)]+json.dumps(data,separators=(',',':'))+h[match.end(1):];f.write_text(h,encoding='utf8')
    print(f'14x14 cells; board 240x240x20; horizontal dovetail210mm, neck8mm/head12mm; nominal collision {bulk_collision:.6f}; friction ribs intentional overlap {press_volume:.3f} mm3; tablet collision0')
if __name__=='__main__':main()
