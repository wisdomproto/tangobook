"""Build a self-contained interactive HTML fragment from the current CAD STLs.

Usage:
  python hardware/periscope/pebble_html.py OUTPUT.html

The embedded display meshes are decimated copies. STEP/STL deliverables remain exact.
"""
from pathlib import Path
import base64
import json
import sys
import tempfile

import trimesh
import cadquery as cq
import pebble as cad


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "out" / "pebble"


def encoded_stl(name, faces):
    mesh = trimesh.load(SOURCE / f"{name}.stl", force="mesh")
    if len(mesh.faces) > faces:
        try:
            mesh = mesh.simplify_quadric_decimation(face_count=faces)
        except ModuleNotFoundError:
            # Keep the generator dependency-light: OCC can tessellate the exact
            # CAD with a coarse display tolerance when fast_simplification is absent.
            factories={"shell_left":cad.left,"shell_right":cad.right,
                       "paddle":cad.paddle,"mirror":cad.mirror,"foam":cad.foam}
            with tempfile.TemporaryDirectory() as temp_dir:
                temporary=Path(temp_dir)/f"{name}.stl"
                cq.exporters.export(factories[name](),str(temporary),
                                    tolerance=0.28,angularTolerance=0.38)
                mesh=trimesh.load(temporary,force="mesh")
    raw = mesh.export(file_type="stl")
    return base64.b64encode(raw).decode("ascii")


def encoded_cad(factory):
    with tempfile.TemporaryDirectory() as temp_dir:
        temporary=Path(temp_dir)/"display.stl"
        cq.exporters.export(factory(),str(temporary),tolerance=0.25,angularTolerance=0.35)
        return base64.b64encode(temporary.read_bytes()).decode("ascii")


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Output HTML path required")
    destination = Path(sys.argv[1]).resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    meshes = {
        "shellLeft": encoded_stl("shell_left", 2300),
        "shellRight": encoded_stl("shell_right", 2300),
        "paddle": encoded_stl("paddle", 700),
        "mirror": encoded_stl("mirror", 12),
        "foam": encoded_stl("foam", 12),
        "cameraSpace": encoded_cad(cad.camera_clearance),
        "_config": {"pivotY": cad.old.PIVOT_Y, "pivotZ": cad.PIVOT_Z,
                    "phoneTop": cad.PHONE_TOP, "tongueBottom": cad.TONGUE_BOT,
                    "cameraZ": cad.CAMERA_Z, "cameraRadius": cad.CAMERA_R,
                    "mirrorTop": cad.MIRROR_TOP,
                    "phoneAboveMirror": cad.PHONE_TOP-cad.MIRROR_TOP},
    }
    fragment = r'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tango Pebble 스마트폰 반사경</title>
</head>
<body>
<div id="tango-pebble-viewer">
  <h2>스마트폰 반사경 조립</h2>
  <div class="nav nav-pills" role="tablist" aria-label="조립 상태">
    <button class="nav-link" type="button" data-state="closed" aria-selected="false">완성</button>
    <button class="nav-link" type="button" data-state="exploded" aria-selected="false">분해</button>
    <button class="nav-link" type="button" data-state="inserting" aria-selected="false">폰 끼우기</button>
    <button class="nav-link" type="button" data-state="installed" aria-selected="false">장착 단면</button>
    <button class="nav-link active" type="button" data-state="camera" aria-selected="true">카메라 공간</button>
  </div>
  <div class="viz-controls">
    <label class="form-label" for="tango-phone-thickness">휴대폰 두께 <span id="tango-thickness-value" class="tabular-nums">9 mm</span></label>
    <input class="form-range" id="tango-phone-thickness" type="range" min="7" max="11" step="0.5" value="9">
    <button class="btn btn-ghost" id="tango-reset-view" type="button">시점 초기화</button>
  </div>
  <div class="tango-stage" role="img" aria-label="조약돌형 스마트폰 반사경의 3D 조립 모델. 마우스나 터치로 돌려볼 수 있습니다.">
    <canvas></canvas>
    <div class="tango-direction" aria-hidden="true">↑ 아래에서 위로</div>
  </div>
  <p class="text-small text-muted" id="tango-pebble-status" aria-live="polite">완성 상태 · 누름판과 스펀지는 케이스 안에 있습니다.</p>
</div>
<style>
  * { box-sizing:border-box; }
  html { color-scheme:light; background:#fff; }
  body { margin:0; color:#292622; background:#fff; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }
  #tango-pebble-viewer { width:100%; max-width:1280px; margin:auto; padding:18px; }
  #tango-pebble-viewer h2 { margin:0 0 12px; font-size:1.35rem; }
  #tango-pebble-viewer .nav { margin-block:12px; }
  #tango-pebble-viewer .nav, #tango-pebble-viewer .viz-controls { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
  #tango-pebble-viewer button { padding:7px 12px; border:1px solid #bdb4a8; border-radius:999px; color:#37312b; background:#fff; cursor:pointer; font:inherit; }
  #tango-pebble-viewer button:hover { background:#f4efe6; }
  #tango-pebble-viewer button.active { border-color:#b75b3c; color:#fff; background:#b75b3c; }
  #tango-pebble-viewer .viz-controls { margin-block:10px; }
  #tango-pebble-viewer .form-range { max-width:260px; }
  #tango-pebble-viewer .tango-stage { position:relative; width:100%; height:560px; min-height:420px; overflow:hidden; background:#f4efe6; border:1px solid #d8cfc2; border-radius:18px; }
  #tango-pebble-viewer canvas { display:block; width:100%; height:100%; touch-action:none; }
  #tango-pebble-viewer .tango-direction { position:absolute; inset:auto 8% 12% auto; color:var(--orange,#d99055); font-weight:500; opacity:0; transition:opacity .2s ease; pointer-events:none; }
  #tango-pebble-viewer[data-state="inserting"] .tango-direction { opacity:1; }
  @media (max-width:520px) { #tango-pebble-viewer .tango-stage { height:440px; min-height:360px; } }
  @media (prefers-reduced-motion:reduce) { #tango-pebble-viewer .tango-direction { transition:none; } }
</style>
<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/"}}
</script>
<script type="module">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import { STLLoader } from 'three/addons/loaders/STLLoader.js';

  const root=document.getElementById('tango-pebble-viewer');
  const canvas=root.querySelector('canvas');
  const stage=root.querySelector('.tango-stage');
  const status=root.querySelector('#tango-pebble-status');
  const slider=root.querySelector('#tango-phone-thickness');
  const value=root.querySelector('#tango-thickness-value');
  const encoded=__MESH_DATA__;

  const colors={
    shell:'#d99055', paddle:'#b75b3c',
    foam:'#ffd54f', mirror:'#79c8ee',
    phone:'#465463', line:'#746b61'
  };
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor('#f4efe6',1);
  renderer.shadowMap.enabled=true;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,0.1,500);
  camera.up.set(0,0,1);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;
  controls.target.set(0,-7,-3);

  scene.add(new THREE.HemisphereLight('#fffaf2','#7d8791',2.4));
  const key=new THREE.DirectionalLight('#fff8e8',2.6); key.position.set(50,-70,90); key.castShadow=true; scene.add(key);
  const fill=new THREE.DirectionalLight('#b9e7ff',1.2); fill.position.set(-60,30,20); scene.add(fill);

  const loader=new STLLoader();
  function geometryFromBase64(text) {
    const raw=atob(text); const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
    const geometry=loader.parse(bytes.buffer); geometry.computeVertexNormals(); return geometry;
  }
  function material(color,opacity=1) {
    return new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.03,transparent:opacity<1,opacity,side:THREE.DoubleSide});
  }
  const objects={};
  function addMesh(name,color,opacity=1) {
    const mesh=new THREE.Mesh(geometryFromBase64(encoded[name]),material(color,opacity));
    mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh); objects[name]=mesh; return mesh;
  }
  addMesh('shellLeft',colors.shell); addMesh('shellRight',colors.shell);
  addMesh('paddle',colors.paddle); addMesh('mirror',colors.mirror,.82); addMesh('foam',colors.foam);
  addMesh('cameraSpace',colors.mirror,.24); objects.cameraSpace.material.depthWrite=false;

  const phoneMaterial=material(colors.phone);
  let phone=new THREE.Mesh(); scene.add(phone); objects.phone=phone;
  const cameraRing=new THREE.Mesh(
    new THREE.RingGeometry(encoded._config.cameraRadius*.58,encoded._config.cameraRadius,40),
    new THREE.MeshBasicMaterial({color:colors.mirror,side:THREE.DoubleSide})
  );
  cameraRing.rotation.x=Math.PI/2; scene.add(cameraRing); objects.phoneCamera=cameraRing;
  const PIVOT_Y=encoded._config.pivotY, PIVOT_Z=encoded._config.pivotZ;
  const PHONE_TOP=encoded._config.phoneTop, TONGUE_BOTTOM=encoded._config.tongueBottom;
  function rebuildPhone(thickness) {
    phone.geometry?.dispose();
    phone.geometry=new THREE.BoxGeometry(72,thickness,52);
    phone.material=phoneMaterial;
    phone.position.set(0,thickness/2,PHONE_TOP-26);
    phone.castShadow=true;
    cameraRing.position.set(0,-.08,encoded._config.cameraZ);
  }
  function paddleAngle(thickness) {
    const radius=2.1, dy=7.1-PIVOT_Y, dz=TONGUE_BOTTOM-PIVOT_Z;
    let lo=0,hi=THREE.MathUtils.degToRad(40);
    for(let i=0;i<40;i++) {
      const a=(lo+hi)/2;
      const front=PIVOT_Y+dy*Math.cos(a)-dz*Math.sin(a)-radius;
      if(front<thickness) lo=a; else hi=a;
    }
    return (lo+hi)/2;
  }
  function setPaddleRotation(angle) {
    const mesh=objects.paddle;
    mesh.geometry=geometryFromBase64(encoded.paddle);
    mesh.geometry.translate(0,-PIVOT_Y,-PIVOT_Z);
    mesh.position.set(0,PIVOT_Y,PIVOT_Z);
    mesh.rotation.set(angle,0,0);
  }

  const states={
    closed:{camera:[92,-112,72],text:'완성 상태 · 누름판과 스펀지는 케이스 안에 있습니다.'},
    exploded:{camera:[108,-130,86],text:'16×10×6 mm 폼과 누름판을 넣고 케이스를 닫은 뒤, 40×30 mm 거울의 스티커 면을 경사판에 붙입니다.'},
    inserting:{camera:[92,104,-50],text:`40 mm ㄷ자 입구로 휴대폰이 들어갑니다. 휴대폰 윗변은 거울보다 ${encoded._config.phoneAboveMirror.toFixed(1)} mm 위에 있습니다.`},
    installed:{camera:[118,66,18],text:'누름판이 휴대폰 뒷면 쪽으로 회전하며 전용 포켓의 6 mm 폼을 압축해 고정합니다.'}
    ,camera:{camera:[112,58,18],text:'40×30 mm 거울은 끼움 턱 없이 연속된 경사판에 직접 접착합니다. 거울과 휴대폰 사이의 ㄷ자 카메라 공간은 열려 있습니다.'}
  };
  let current='camera';
  function resetTransforms() {
    for(const object of Object.values(objects)) { object.visible=true; object.position.set(0,0,0); object.rotation.set(0,0,0); }
    setPaddleRotation(0);
    objects.cameraSpace.visible=false;
    objects.shellRight.material.opacity=1; objects.shellRight.material.transparent=false;
  }
  function applyState(name,resetCamera=true) {
    current=name; root.dataset.state=name; resetTransforms();
    const thickness=Number(slider.value); rebuildPhone(thickness);
    if(name==='closed') { objects.phone.visible=false; objects.phoneCamera.visible=false; }
    if(name==='exploded') {
      objects.shellLeft.position.x=-30; objects.shellRight.position.x=30;
      objects.foam.position.z=22; objects.phone.visible=false; objects.phoneCamera.visible=false;
    }
    if(name==='inserting') { objects.phone.position.z-=24; objects.phoneCamera.position.z-=24; }
    if(name==='installed') {
      objects.shellRight.material.transparent=true; objects.shellRight.material.opacity=.12;
      objects.shellRight.material.depthWrite=false;
      setPaddleRotation(paddleAngle(thickness));
    } else if(name==='camera') {
      objects.shellRight.material.transparent=true; objects.shellRight.material.opacity=.10;
      objects.shellRight.material.depthWrite=false;
      objects.cameraSpace.visible=true;
      setPaddleRotation(paddleAngle(thickness));
    } else { objects.shellRight.material.depthWrite=true; }
    status.textContent=states[name].text;
    root.querySelectorAll('[data-state]').forEach(button=>{
      const active=button.dataset.state===name; button.classList.toggle('active',active); button.setAttribute('aria-selected',String(active));
    });
    if(resetCamera) {
      camera.position.set(...states[name].camera); controls.target.set(0,-7,-4); controls.update();
    }
  }
  root.querySelectorAll('[data-state]').forEach(button=>button.addEventListener('click',()=>applyState(button.dataset.state)));
  slider.addEventListener('input',()=>{value.textContent=`${Number(slider.value).toFixed(1).replace('.0','')} mm`; applyState(current,false);});
  root.querySelector('#tango-reset-view').addEventListener('click',()=>applyState(current,true));

  function resize() {
    const width=stage.clientWidth,height=stage.clientHeight;
    renderer.setSize(width,height,false); camera.aspect=width/height; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage); resize(); applyState('camera');
  function frame() { controls.update(); renderer.render(scene,camera); requestAnimationFrame(frame); }
  frame();
</script>
</body>
</html>
'''.replace('__MESH_DATA__', json.dumps(meshes, separators=(",", ":")))
    destination.write_text(fragment, encoding="utf-8")
    print(destination)
    print(destination.stat().st_size)


if __name__ == "__main__":
    main()
