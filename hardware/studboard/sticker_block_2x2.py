"""15mm 탱고 격자판용 2×2 스티커 블록. python hardware/studboard/sticker_block_2x2.py
CAD/STL과 기존 단독 HTML의 block 메시를 갱신한다. cadquery 필요.
"""
import base64
import json
import math
from pathlib import Path
import re
import struct
import cadquery as cq

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).parent / 'out'
PITCH, WIDTH, HEIGHT = 15.0, 29.6, 5.5
SOCKET_R, SOCKET_DEPTH = 2.85, 3.2
RIM_WIDTH, RIM_HEIGHT, CORNER_R = 1.0, 0.8, 3.0

def make_block():
    body = (cq.Workplane('XY').box(WIDTH, WIDTH, HEIGHT, centered=(True, True, False))
            .edges('|Z').fillet(CORNER_R).faces('>Z').edges().fillet(0.35)
            .faces('<Z').edges().fillet(.5))
    # 원래 2×2칸 교점 배치: 중앙1·변4·귀퉁이4 돌기 회피 홈.
    for x in (-PITCH, 0, PITCH):
        for y in (-PITCH, 0, PITCH):
            # Rounded cutter mouth, rather than a fragile fillet across the
            # intersecting partial sockets. Radius/depth above Z=.5 unchanged.
            socket = (cq.Workplane('XZ').moveTo(0,-.1).lineTo(SOCKET_R+.5,-.1)
                      .lineTo(SOCKET_R+.5,0)
                      .threePointArc((SOCKET_R+.5-.5/math.sqrt(2),.5-.5/math.sqrt(2)),(SOCKET_R,.5))
                      .lineTo(SOCKET_R,SOCKET_DEPTH).lineTo(0,SOCKET_DEPTH).close()
                      .revolve(360,(0,0),(0,1)).translate((x,y,0)))
            body = body.cut(socket)
    pocket = (cq.Workplane('XY').box(WIDTH-2*RIM_WIDTH, WIDTH-2*RIM_WIDTH, RIM_HEIGHT+1, centered=(True,True,False))
              .edges('|Z').fillet(CORNER_R-RIM_WIDTH).translate((0,0,HEIGHT-RIM_HEIGHT)))
    return body.cut(pocket).val()

def main():
    block = make_block()
    assert block.isValid() and len(block.Solids()) == 1
    bb = block.BoundingBox()
    assert abs(bb.xlen-WIDTH)<1e-6 and abs(bb.zlen-HEIGHT)<1e-6
    assert not block.isInside(cq.Vector(0,0,1),1e-6)
    assert block.isInside(cq.Vector(0,0,SOCKET_DEPTH+0.2),1e-6)
    assert not block.isInside(cq.Vector(0,0,HEIGHT-0.2),1e-6)
    assert block.isInside(cq.Vector(0,0,HEIGHT-RIM_HEIGHT-0.2),1e-6)
    assert block.isInside(cq.Vector(0,WIDTH/2-0.6,HEIGHT-0.2),1e-6)
    assert HEIGHT-RIM_HEIGHT-SOCKET_DEPTH >= 1.2
    interference=0
    for x in (-PITCH,0,PITCH):
        for y in (-PITCH,0,PITCH):
            stud=cq.Workplane('XY').sphere(2.5).translate((x-0.05,y,0)).val()
            interference += block.intersect(stud).Volume()
    assert interference<1e-6, f'stud collision {interference}'
    OUT.mkdir(exist_ok=True)
    cq.exporters.export(block,str(OUT/'sticker-block-2x2.step'))
    cq.exporters.export(block,str(OUT/'sticker-block-2x2.stl'),tolerance=0.025,angularTolerance=0.1)
    # Small edge blends need many OCC triangles; reduce only redundant mesh
    # detail within 0.01 mm, keeping the CAD STEP as the exact source.
    import numpy as np
    import trimesh
    import manifold3d as md
    m=trimesh.load(OUT/'sticker-block-2x2.stl',force='mesh')
    m.update_faces(m.nondegenerate_faces());m.remove_unreferenced_vertices()
    sm=md.Manifold(md.Mesh(m.vertices.astype(np.float32),m.faces.astype(np.uint32))).simplify(.01).to_mesh64()
    m=trimesh.Trimesh(vertices=sm.vert_properties[:,:3],faces=sm.tri_verts)
    assert m.is_volume and len(m.split())==1
    m.export(OUT/'sticker-block-2x2.stl')
    vertices,triangles=block.tessellate(0.025,0.1)
    coords=[tuple(vertices[i].toTuple()) for t in triangles for i in t]
    # 블록 바닥을 원본 높인 놀이면 높이 13.0mm에 놓는다.
    encoded=b''.join(struct.pack('<hhh',*(round((v[k]-(0,0,4)[k])*100) for k in range(3))) for v in coords)
    htmlfile=ROOT/'packages/client/public/tango-board-only.standalone.html'
    html=htmlfile.read_text(encoding='utf8')
    pattern=r'(<script id="meshData" type="application/json">)(.*?)(</script>)'
    match=re.search(pattern,html,re.S)
    data=json.loads(match[2])
    data['block']={'b64':base64.b64encode(encoded).decode(),'centre':[105,105,17.0],'scale':100,'size':[WIDTH,WIDTH,HEIGHT],
                   'grid':[2,2],'socketRadius':SOCKET_R,'socketDepth':SOCKET_DEPTH,'rimHeight':RIM_HEIGHT}
    html=html[:match.start(2)]+json.dumps(data,separators=(',',':'))+html[match.end(2):]
    htmlfile.write_text(html,encoding='utf8')
    print(f'VALID single solid {WIDTH}x{WIDTH}x{HEIGHT} mm; 9 stud reliefs radius {SOCKET_R}, depth {SOCKET_DEPTH}; interference {interference:.6f} mm3; CAD {len(triangles)} / print {len(m.faces)} triangles')

if __name__=='__main__':
    main()

