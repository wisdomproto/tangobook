# -*- coding: utf-8 -*-
"""빨간모자 블록 3D 뷰어 — 한 장짜리 HTML (out/viewer.html). 마우스로 돌리고 확대해 본다.

실행:  python viewer.py      (blocks.py 형상을 GLB 로 구워 data URI 로 박는다 — 파일 하나면 된다)
보기 = <model-viewer>(jsdelivr) — 인터넷만 되면 아무 브라우저에서 열린다.
"""
import base64, io, os, tempfile
import numpy as np
import trimesh
import cadquery as cq
import blocks as B

OUT = B.OUT
PAPER = (0.98, 0.97, 0.93)


def mesh(shape, rgb, tol=0.05):
    f = os.path.join(tempfile.mkdtemp(), 'p.stl')
    cq.exporters.export(shape, f, tolerance=tol, angularTolerance=0.2)
    m = trimesh.load(f)
    m.visual.face_colors = [int(c * 255) for c in rgb] + [255]
    return m


def glb(parts):
    sc = trimesh.Scene()
    for i, (shape, rgb) in enumerate(parts):
        sc.add_geometry(mesh(shape, rgb), node_name=f'p{i}')
    # 위가 +Z 인 CAD 좌표 → glTF 는 +Y 가 위
    sc.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, (1, 0, 0)))
    return 'data:model/gltf-binary;base64,' + base64.b64encode(sc.export(file_type='glb')).decode()


def paper_sheet(nx, ny, top_inset, h, out=0.0):
    pl, pw = B.paper_size(nx, ny, top_inset)
    tw = B.footprint(nx, ny)[0] - 2 * top_inset
    return (cq.Workplane('XY').box(pl, pw, 0.25, centered=(False, True, False))
            .translate((tw / 2 - B.PAPER_INSET - pl - out, 0, h - B.LIP_T - B.SLOT_H + 0.25)))


def main():
    C = B.COLORS
    views = [
        ('길 조각 1×2', f'2단 · {B.footprint(12, 6)[0]:.1f}×{B.footprint(12, 6)[1]:.1f}×{B.ROAD_H:.0f}mm · 양 긴 변 턱 {B.LIP_W}×{B.LIP_T} · 종이 {B.paper_size(12, 6, B.ROAD_TOP_INSET)[0]:.1f}×{B.paper_size(12, 6, B.ROAD_TOP_INSET)[1]:.1f}',
         [(B.road(), C['road'])]),
        ('고정물 1×1', f'{B.footprint(6, 6)[0]:.1f}×{B.footprint(6, 6)[1]:.1f}×{B.OBJ_H:.0f}mm · 나무·빨간모자·늑대 공용 · 종이 {B.paper_size(6, 6)[0]:.1f}×{B.paper_size(6, 6)[1]:.1f}',
         [(B.obj(), C['tree'])]),
        ('집 (굴뚝 = 문 방향)', f'고정물 + 굴뚝 {B.CHIMNEY[0]:.0f}×{B.CHIMNEY[1]:.0f}×{B.CHIMNEY[2]:.0f} · 굴뚝은 턱 밑면 높이에서 서서 종이가 그 밑으로 지나간다',
         [(B.house(), C['house'])]),
        ('종이 끼우기', '열린 끝으로 밀어 넣으면 양옆 턱 밑에 잡힌다 — 반쯤 넣은 상태',
         [(B.obj(), C['tree']), (paper_sheet(6, 6, 0, B.OBJ_H, out=20), PAPER),
          (B.road().translate((0, -70, 0)), C['road']), (paper_sheet(12, 6, B.ROAD_TOP_INSET, B.ROAD_H, out=30).translate((0, -70, 0)), PAPER)]),
        ('밑면 소켓', f'Ø{B.STUD_HOLE_D}×{B.STUD_HOLE_H} · 피치 {B.PITCH:.0f} — 우리 판(돌기 4.0)에 꽂힌다. 뒤집어 놓은 것',
         [(B.obj().rotate((0, 0, 0), (1, 0, 0), 180).translate((-30, 0, B.OBJ_H)), C['wolf']),
          (B.road().rotate((0, 0, 0), (1, 0, 0), 180).translate((30, 60, B.ROAD_H)), C['road'])]),
        ('판 위 조립 (4×4)', '24×24 판, 한 칸 6돌기 = 48mm · 집 문은 아래 · 길 3장 · 나무 2 · 빨간모자 · 늑대',
         [(shape, C[key]) for _, shape, key in B.scene_parts()]),
    ]
    items = []
    for title, sub, parts in views:
        items.append({'t': title, 's': sub, 'u': glb(parts)})
        print(' ', title, f'{len(items[-1]["u"]) // 1024}KB')
    import json
    data = json.dumps(items, ensure_ascii=False)
    html = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>빨간모자 블록 3D</title>
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
<style>
  :root {{ --bg:#f6f4f0; --ink:#2b2b2b; --mute:#777; --acc:#e8693a; }}
  * {{ box-sizing:border-box }} body {{ margin:0; background:var(--bg); color:var(--ink); font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif; display:flex; flex-direction:column; height:100vh }}
  header {{ padding:10px 16px 6px; display:flex; flex-wrap:wrap; gap:6px; align-items:center }}
  header h1 {{ font-size:15px; margin:0 12px 0 0 }}
  button {{ border:1px solid #cfc9bf; background:#fff; color:var(--ink); padding:6px 11px; border-radius:999px; cursor:pointer; font-size:13px }}
  button.on {{ background:var(--acc); border-color:var(--acc); color:#fff }}
  .sub {{ padding:0 16px 6px; font-size:12px; color:var(--mute) }}
  model-viewer {{ flex:1; width:100%; min-height:0; background:radial-gradient(ellipse at 50% 40%, #fff 0%, #ece8e0 100%) }}
  .tip {{ position:fixed; right:12px; bottom:10px; font-size:11px; color:var(--mute) }}
</style></head><body>
<header><h1>빨간모자 블록</h1><div id="tabs"></div></header>
<div class="sub" id="sub"></div>
<model-viewer id="mv" camera-controls auto-rotate auto-rotate-delay="1500" rotation-per-second="20deg" shadow-intensity="0.8" exposure="1.05" environment-image="neutral" interaction-prompt="none" camera-orbit="35deg 62deg auto" min-camera-orbit="auto 0deg auto" max-camera-orbit="auto 180deg auto"></model-viewer>
<div class="tip">드래그 = 돌리기 · 휠 = 확대 · 우클릭 드래그 = 이동 · 밑면은 아래로 돌려 보면 소켓이 보입니다</div>
<script>
const V = {data};
const tabs = document.getElementById('tabs'), sub = document.getElementById('sub'), mv = document.getElementById('mv');
V.forEach((v, i) => {{ const b = document.createElement('button'); b.textContent = v.t; b.onclick = () => show(i); tabs.appendChild(b); }});
function show(i) {{ [...tabs.children].forEach((b, k) => b.classList.toggle('on', k === i)); sub.textContent = V[i].s; mv.src = V[i].u; mv.cameraOrbit = '35deg 62deg auto'; }}
show(0);
</script></body></html>'''
    p = os.path.join(OUT, 'viewer.html')
    open(p, 'w', encoding='utf-8').write(html)
    print('뷰어 →', p, f'{os.path.getsize(p) // 1024}KB')


if __name__ == '__main__':
    main()
