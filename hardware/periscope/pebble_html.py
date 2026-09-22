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
                       "paddle":cad.paddle,"mirror":cad.old.mirror,"foam":cad.foam}
            with tempfile.TemporaryDirectory() as temp_dir:
                temporary=Path(temp_dir)/f"{name}.stl"
                cq.exporters.export(factories[name](),str(temporary),
                                    tolerance=0.28,angularTolerance=0.38)
                mesh=trimesh.load(temporary,force="mesh")
    raw = mesh.export(file_type="stl")
    return base64.b64encode(raw).decode("ascii")


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
    }
    fragment = r'''
<div id="tango-pebble-viewer">
  <h2>스마트폰 반사경 조립</h2>
  <div class="nav nav-pills" role="tablist" aria-label="조립 상태">
    <button class="nav-link active" type="button" data-state="closed" aria-selected="true">완성</button>
    <button class="nav-link" type="button" data-state="exploded" aria-selected="false">분해</button>
    <button class="nav-link" type="button" data-state="inserting" aria-selected="false">폰 끼우기</button>
    <button class="nav-link" type="button" data-state="installed" aria-selected="false">장착 단면</button>
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
  #tango-pebble-viewer { width:100%; }
  #tango-pebble-viewer .nav { margin-block:12px; }
  #tango-pebble-viewer .viz-controls { margin-block:10px; }
  #tango-pebble-viewer .form-range { max-width:260px; }
  #tango-pebble-viewer .tango-stage { position:relative; width:100%; height:560px; min-height:420px; overflow:hidden; }
  #tango-pebble-viewer canvas { display:block; width:100%; height:100%; touch-action:none; }
  #tango-pebble-viewer .tango-direction { position:absolute; inset:auto 8% 12% auto; color:var(--orange); font-weight:500; opacity:0; transition:opacity .2s ease; pointer-events:none; }
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

  function resolvedColor(token) {
    const probe=document.createElement('span');
    probe.style.color=`var(${token})`;
    root.appendChild(probe);
    const color=getComputedStyle(probe).color;
    probe.remove();
    return color;
  }
  const colors={
    shell:resolvedColor('--orange'), paddle:resolvedColor('--red'),
    foam:resolvedColor('--foreground'), mirror:resolvedColor('--blue'),
    phone:resolvedColor('--card-foreground'), line:resolvedColor('--border')
  };
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,0.1,500);
  camera.up.set(0,0,1);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;
  controls.target.set(0,-7,-3);

  scene.add(new THREE.HemisphereLight(resolvedColor('--background'),resolvedColor('--muted-foreground'),2.4));
  const key=new THREE.DirectionalLight(resolvedColor('--foreground'),2.6); key.position.set(50,-70,90); key.castShadow=true; scene.add(key);
  const fill=new THREE.DirectionalLight(resolvedColor('--blue'),1.2); fill.position.set(-60,30,20); scene.add(fill);

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

  const phoneMaterial=material(colors.phone);
  let phone=new THREE.Mesh(); scene.add(phone); objects.phone=phone;
  const PIVOT_Y=11.6, PIVOT_Z=3.5463903501502707;
  const PHONE_TOP=-1;
  function rebuildPhone(thickness) {
    phone.geometry?.dispose();
    phone.geometry=new THREE.BoxGeometry(72,thickness,52);
    phone.material=phoneMaterial;
    phone.position.set(0,thickness/2,PHONE_TOP-26);
    phone.castShadow=true;
  }
  function paddleAngle(thickness) {
    const radius=2.1, dy=7.1-PIVOT_Y, dz=-9.5-PIVOT_Z;
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
    exploded:{camera:[108,-130,86],text:'거울 → 스펀지 → 누름판을 넣고 좌우 케이스를 딸깍 닫습니다.'},
    inserting:{camera:[92,104,-50],text:'화면과 전면 카메라를 거울 쪽에 두고, 휴대폰 윗변을 아래에서 위로 밀어 넣습니다.'},
    installed:{camera:[118,66,18],text:'누름판이 휴대폰 뒷면 쪽으로 회전하며 스펀지를 압축해 고정합니다.'}
  };
  let current='closed';
  function resetTransforms() {
    for(const object of Object.values(objects)) { object.visible=true; object.position.set(0,0,0); object.rotation.set(0,0,0); }
    setPaddleRotation(0);
    objects.shellRight.material.opacity=1; objects.shellRight.material.transparent=false;
  }
  function applyState(name,resetCamera=true) {
    current=name; root.dataset.state=name; resetTransforms();
    const thickness=Number(slider.value); rebuildPhone(thickness);
    if(name==='closed') { objects.phone.visible=false; }
    if(name==='exploded') {
      objects.shellLeft.position.x=-30; objects.shellRight.position.x=30;
      objects.foam.position.z=22; objects.phone.visible=false;
    }
    if(name==='inserting') { objects.phone.position.z-=24; }
    if(name==='installed') {
      objects.shellRight.material.transparent=true; objects.shellRight.material.opacity=.12;
      objects.shellRight.material.depthWrite=false;
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
  new ResizeObserver(resize).observe(stage); resize(); applyState('closed');
  function frame() { controls.update(); renderer.render(scene,camera); requestAnimationFrame(frame); }
  frame();
</script>
'''.replace('__MESH_DATA__', json.dumps(meshes, separators=(",", ":")))
    destination.write_text(fragment, encoding="utf-8")
    print(destination)
    print(destination.stat().st_size)


if __name__ == "__main__":
    main()
