# -*- coding: utf-8 -*-
"""빨간모자 블록 3D 뷰어 — 한 장짜리 HTML (out/viewer.html). 마우스로 돌리고 확대해 본다.

실행:  python viewer.py      (blocks.py 형상을 GLB 로 구워 data URI 로 박는다 — 파일 하나면 된다)
보기 = three.js(jsdelivr 모듈) — 형상은 페이지에 배열로 박혀 있어 **아무것도 fetch 하지 않는다**.
       (model-viewer 는 GLB 를 fetch 해서 앱 미리보기 패널에서 DataCloneError 로 죽었다.)
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


def pack(parts):
    """형상 → {색, 꼭짓점 Float32, 면 Uint32} base64. 🔴 GLB 를 fetch 로 읽히면 앱 미리보기 패널이
    요청을 가로채다 `DataCloneError: Request object could not be cloned` 로 죽는다(2026-09-14 실측).
    그래서 페이지가 아무것도 요청하지 않게 배열을 그대로 박는다."""
    rot = trimesh.transformations.rotation_matrix(-np.pi / 2, (1, 0, 0))   # CAD +Z 위 → three.js +Y 위
    out = []
    for shape, rgb in parts:
        m = mesh(shape, rgb)
        m.apply_transform(rot)
        out.append({'c': [round(float(c), 3) for c in rgb],
                    'v': base64.b64encode(m.vertices.astype('<f4').tobytes()).decode(),
                    'f': base64.b64encode(m.faces.astype('<u4').tobytes()).decode()})
    return out


def paper_sheet(nx, ny, top_inset, h, out=0.0):
    pl, pw = B.paper_size(nx, ny, top_inset)
    tw = B.footprint(nx, ny)[0] - 2 * top_inset
    return (cq.Workplane('XY').box(pl, pw, 0.25, centered=(False, True, False))
            .translate((tw / 2 - B.PAPER_INSET - pl - out, 0, h - B.LIP_T - B.SLOT_H + 0.25)))


def main():
    C = B.COLORS
    import sticker_block as S
    sw, sd, sr = S.sticker_size()
    views = [
        ('스티커 블록 4×6', f'{B.footprint(S.NX, S.NY)[0]:.1f}×{B.footprint(S.NX, S.NY)[1]:.1f}×{S.H}mm · 사방 턱 {S.RIM_W}×{S.RIM_H} · 모서리 R{S.CORNER_R:.0f} · 스티커 {sw:.1f}×{sd:.1f} R{sr:.2f}',
         [(S.sticker_block(), (0.93, 0.62, 0.36))]),
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
        items.append({'t': title, 's': sub, 'p': pack(parts)})
        print(' ', title, f'{sum(len(x["v"]) + len(x["f"]) for x in items[-1]["p"]) // 1024}KB')
    import json
    data = json.dumps(items, ensure_ascii=False)
    html = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>빨간모자 블록 3D</title>
<style>
  :root {{ --bg:#f6f4f0; --ink:#2b2b2b; --mute:#777; --acc:#e8693a; }}
  * {{ box-sizing:border-box }} html,body {{ height:100% }}
  body {{ margin:0; background:var(--bg); color:var(--ink); font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif; display:flex; flex-direction:column }}
  header {{ padding:10px 16px 6px; display:flex; flex-wrap:wrap; gap:6px; align-items:center }}
  header h1 {{ font-size:15px; margin:0 12px 0 0 }}
  button {{ border:1px solid #cfc9bf; background:#fff; color:var(--ink); padding:6px 11px; border-radius:999px; cursor:pointer; font-size:13px }}
  button.on {{ background:var(--acc); border-color:var(--acc); color:#fff }}
  .sub {{ padding:0 16px 6px; font-size:12px; color:var(--mute) }}
  #stage {{ flex:1; min-height:320px; position:relative; background:radial-gradient(ellipse at 50% 40%, #fff 0%, #ece8e0 100%) }}
  #stage canvas {{ display:block; width:100%; height:100% }}
  .tip {{ position:fixed; right:12px; bottom:10px; font-size:11px; color:var(--mute) }}
  #err {{ position:absolute; left:16px; top:16px; color:#b00; font-size:13px; white-space:pre-wrap }}
</style>
<script type="importmap">{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}}}</script>
</head><body>
<header><h1>빨간모자 블록</h1><div id="tabs"></div></header>
<div class="sub" id="sub"></div>
<div id="stage"><div id="err"></div></div>
<div class="tip">드래그 = 돌리기 · 휠 = 확대 · 우클릭 드래그 = 이동 · 밑면은 아래로 돌려 보면 소켓이 보입니다</div>
<script id="data" type="application/json">{data}</script>
<script type="module">
import * as THREE from 'three';
import {{ OrbitControls }} from 'three/addons/controls/OrbitControls.js';
import {{ toCreasedNormals }} from 'three/addons/utils/BufferGeometryUtils.js';
const V = JSON.parse(document.getElementById('data').textContent);
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({{ antialias: true, alpha: true }});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 5000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.2;
controls.addEventListener('start', () => controls.autoRotate = false);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b0a2, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(1, 2, 1.4); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.6); fill.position.set(-1.2, 0.6, -1); scene.add(fill);
const group = new THREE.Group(); scene.add(group);
function b64(s, T) {{ const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new T(u.buffer); }}
const cache = [];
function build(i) {{
  if (cache[i]) return cache[i];
  const g = new THREE.Group();
  for (const p of V[i].p) {{
    let geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(b64(p.v, Float32Array), 3));
    geo.setIndex(new THREE.BufferAttribute(b64(p.f, Uint32Array), 1));
    geo = toCreasedNormals(geo, Math.PI / 6);
    const mat = new THREE.MeshStandardMaterial({{ color: new THREE.Color(p.c[0], p.c[1], p.c[2]), roughness: 0.62, metalness: 0.0 }});
    g.add(new THREE.Mesh(geo, mat));
  }}
  return cache[i] = g;
}}
function fit(obj) {{
  const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const r = size.length() / 2, d = r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.95;
  const dir = new THREE.Vector3(0.62, 0.62, 0.9).normalize();
  camera.position.copy(c).addScaledVector(dir, d); camera.near = d / 100; camera.far = d * 10; camera.updateProjectionMatrix();
  controls.target.copy(c); controls.update();
}}
const tabs = document.getElementById('tabs'), sub = document.getElementById('sub');
V.forEach((v, i) => {{ const b = document.createElement('button'); b.textContent = v.t; b.onclick = () => show(i); tabs.appendChild(b); }});
function show(i) {{
  [...tabs.children].forEach((b, k) => b.classList.toggle('on', k === i)); sub.textContent = V[i].s;
  group.clear(); const g = build(i); group.add(g); fit(g); controls.autoRotate = true;
}}
function resize() {{ const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }}
new ResizeObserver(resize).observe(stage); resize();
renderer.setAnimationLoop(() => {{ controls.update(); renderer.render(scene, camera); }});
try {{ show(0); }} catch (e) {{ document.getElementById('err').textContent = String(e); }}
</script></body></html>'''
    p = os.path.join(OUT, 'viewer.html')
    open(p, 'w', encoding='utf-8').write(html)
    print('뷰어 →', p, f'{os.path.getsize(p) // 1024}KB')


if __name__ == '__main__':
    main()
