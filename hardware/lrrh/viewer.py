# -*- coding: utf-8 -*-
"""블록 모아 보기 — 한 장짜리 HTML (out/viewer.html). 블록마다 3D 카드 + STL 다운로드 버튼.

실행:  python blocks.py && python sticker_block.py && python viewer.py
  · 형상은 **내보낸 STL 그대로** 읽어 페이지에 배열로 박는다 — 보이는 것과 받는 파일이 같은 삼각형이다.
  · 다운로드는 그 배열로 브라우저에서 이진 STL 을 만들어 준다. 🔴 페이지는 아무것도 fetch 하지 않는다
    (앱 미리보기 패널이 fetch 를 가로채다 `DataCloneError` 로 죽었다, 2026-09-14).
"""
import base64, json, os
import trimesh
import blocks as B
import sticker_block as S

STICKER = (0.93, 0.62, 0.36)


def items():
    C = B.COLORS
    out = [
        ('road_1x2', '길 조각 1×2', f'2단 · 양 긴 변 턱 {B.LIP_W}×{B.LIP_T} · 종이 {B.paper_size(12, 6, B.ROAD_TOP_INSET)[0]:.1f}×{B.paper_size(12, 6, B.ROAD_TOP_INSET)[1]:.1f}', C['road']),
        ('object_1x1', '고정물 1×1', f'나무·빨간모자·늑대 공용 · 종이 {B.paper_size(6, 6)[0]:.1f}×{B.paper_size(6, 6)[1]:.1f}', C['tree']),
        ('house_1x1', '집 1×1', '고정물 + 굴뚝(문 방향) · 굴뚝 밑으로 종이가 지나간다', C['house']),
    ]
    for name, nx, ny in S.SIZES:
        sw, sd, sr = S.sticker_size(nx, ny)
        out.append((f'sticker_{name}', f'스티커 블록 {name.replace("x", "×")}',
                    f'사방 턱 {S.RIM_W}×{S.RIM_H} · 모서리 R{S.CORNER_R:.0f} · 스티커 {sw:.1f}×{sd:.1f} R{sr:.2f}', STICKER))
    return out


def pack(name, title, sub, rgb):
    stl = os.path.join(B.OUT, name + '.stl')
    assert os.path.exists(stl), f'{stl} 없음 — blocks.py / sticker_block.py 를 먼저 돌린다'
    m = trimesh.load(stl)
    e = m.extents
    return {'n': name, 't': title, 's': f'{e[0]:.1f}×{e[1]:.1f}×{e[2]:.1f}mm · {sub}',
            'c': [round(float(c), 3) for c in rgb],
            'v': base64.b64encode(m.vertices.astype('<f4').tobytes()).decode(),
            'f': base64.b64encode(m.faces.astype('<u4').tobytes()).decode()}


def main():
    data = json.dumps([pack(*it) for it in items()], ensure_ascii=False)
    html = '''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>탱고 블록 모음</title>
<style>
  :root { --bg:#f6f4f0; --card:#fff; --ink:#2b2b2b; --mute:#777; --acc:#e8693a; --line:#e4dfd6; }
  * { box-sizing:border-box }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif }
  header { padding:16px 16px 4px } h1 { font-size:18px; margin:0 } header p { margin:4px 0 0; font-size:12px; color:var(--mute) }
  main { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; padding:12px 16px 24px }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; display:flex; flex-direction:column }
  .view { height:260px; background:radial-gradient(ellipse at 50% 40%, #fff 0%, #ece8e0 100%); touch-action:none }
  .view canvas { display:block; width:100%; height:100% }
  .meta { padding:10px 12px 12px; display:flex; flex-direction:column; gap:6px }
  .meta b { font-size:15px } .meta span { font-size:12px; color:var(--mute); line-height:1.4 }
  button { align-self:flex-start; border:0; background:var(--acc); color:#fff; padding:8px 14px; border-radius:999px; cursor:pointer; font-size:13px }
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
</head><body>
<header><h1>탱고 블록 모음</h1><p>드래그 = 돌리기 · 휠 = 확대 · 아래로 돌리면 밑면 소켓이 보입니다 · 버튼 = 그 블록 STL 받기</p></header>
<main id="grid"></main>
<script id="data" type="application/json">__DATA__</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
const V = JSON.parse(document.getElementById('data').textContent);
function b64(s, T) { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new T(u.buffer); }
function downloadStl(it, pos, idx) {
  const n = idx.length / 3, buf = new ArrayBuffer(84 + 50 * n), dv = new DataView(buf);
  dv.setUint32(80, n, true);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), nr = new THREE.Vector3();
  for (let t = 0; t < n; t++) {
    const o = 84 + 50 * t, v = k => new THREE.Vector3(pos[idx[k] * 3], pos[idx[k] * 3 + 1], pos[idx[k] * 3 + 2]);
    a.copy(v(t * 3)); b.copy(v(t * 3 + 1)); c.copy(v(t * 3 + 2));
    nr.subVectors(b, a).cross(c.clone().sub(a)).normalize();
    [nr, a, b, c].forEach((p, j) => { dv.setFloat32(o + 12 * j, p.x, true); dv.setFloat32(o + 12 * j + 4, p.y, true); dv.setFloat32(o + 12 * j + 8, p.z, true); });
  }
  const url = URL.createObjectURL(new Blob([buf], { type: 'model/stl' }));
  const el = Object.assign(document.createElement('a'), { href: url, download: it.n + '.stl' });
  el.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const views = [];
const grid = document.getElementById('grid');
for (const it of V) {
  const card = document.createElement('div'); card.className = 'card';
  card.innerHTML = '<div class="view"></div><div class="meta"><b></b><span></span><button>STL 다운로드</button></div>';
  card.querySelector('b').textContent = it.t; card.querySelector('span').textContent = it.s;
  grid.appendChild(card);
  const pos = b64(it.v, Float32Array), idx = b64(it.f, Uint32Array);
  card.querySelector('button').onclick = () => downloadStl(it, pos, idx);
  const stage = card.querySelector('.view');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, 0.1, 5000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b0a2, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(1, 2, 1.4); scene.add(key);
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo = toCreasedNormals(geo, Math.PI / 6);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: new THREE.Color(...it.c), roughness: 0.62 }));
  mesh.rotation.x = -Math.PI / 2;   // CAD +Z 위 → three.js +Y 위
  scene.add(mesh);
  const box = new THREE.Box3().setFromObject(mesh), ctr = box.getCenter(new THREE.Vector3());
  const d = box.getSize(new THREE.Vector3()).length() / 2 / Math.sin(THREE.MathUtils.degToRad(17.5)) * 0.9;
  camera.position.copy(ctr).addScaledVector(new THREE.Vector3(0.62, 0.62, 0.9).normalize(), d);
  camera.near = d / 100; camera.far = d * 10;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(ctr); controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.2;
  controls.addEventListener('start', () => controls.autoRotate = false);
  const resize = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(stage); resize();
  views.push({ renderer, scene, camera, controls });
}
(function loop() { for (const v of views) { v.controls.update(); v.renderer.render(v.scene, v.camera); } requestAnimationFrame(loop); })();
</script></body></html>'''.replace('__DATA__', data)
    p = os.path.join(B.OUT, 'viewer.html')
    open(p, 'w', encoding='utf-8').write(html)
    print('뷰어 →', p, f'{os.path.getsize(p) // 1024}KB · 블록 {len(json.loads(data))}개')


if __name__ == '__main__':
    main()
