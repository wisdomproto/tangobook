"""Interactive kinematic explanation for the two-gear reflector concept."""
from pathlib import Path
import base64
import json
import os
import sys

import cadquery as cq

import pebble_geared as g
import pebble_geared_unibody as u
from pebble_geared_profile import b, a, fixed, MIN_CAMERA_TOP_MARGIN, MAX_CAMERA_TOP_MARGIN


def mesh_data(shape):
    temporary = g.OUT / "_geared_display.stl"
    cq.exporters.export(shape, str(temporary), tolerance=0.22, angularTolerance=0.28)
    encoded = base64.b64encode(temporary.read_bytes()).decode("ascii")
    temporary.unlink()
    return encoded


def main(height_only=False):
    import pebble_height_only as h
    design=h if height_only else u
    g.OUT.mkdir(parents=True, exist_ok=True)
    factories = {
        "shell_left": design.shell_left, "shell_right": design.shell_right,
        "mirror_tray": g.mirror_tray, "height_slider": design.height_slider,
        "angle_pinion": lambda: g.pinion(*g.ANGLE_AXIS),
        "height_pinion": lambda: g.pinion(*g.HEIGHT_AXIS),
        "angle_lever": lambda: g.lever(*g.ANGLE_AXIS),
        "height_lever": lambda: g.lever(*g.HEIGHT_AXIS),
        "gear_cover": design.service_lid,
        "rear_cover": fixed.cover, "paddle": a.adjustable_paddle,
        "mirror": b.mirror, "foam": b.foam, "phone": b.phone,
        "camera_lens": lambda: cq.Workplane(obj=cq.Solid.makeCylinder(
            b.CAMERA_R,0.5,cq.Vector(0,-0.5,b.PHONE_TOP-MIN_CAMERA_TOP_MARGIN-b.CAMERA_R),
            cq.Vector(0,1,0))),
    }
    if height_only:
        for name in ("mirror_tray", "angle_pinion", "angle_lever"):
            del factories[name]
    if height_only:
        factories["height_index_pin"] = lambda: b.shaft(24.6,1.9,15.5,-5.7,0.72)
    data = {name: mesh_data(factory()) for name, factory in factories.items()}
    config = {
        "heightOnly": height_only,
        "pivotY": a.PIVOT_Y, "pivotZ": a.PIVOT_Z,
        "angleY": g.ANGLE_AXIS[0], "angleZ": g.ANGLE_AXIS[1],
        "heightY": g.HEIGHT_AXIS[0], "heightZ": g.HEIGHT_AXIS[1],
        "paddleY": b.old.PIVOT_Y, "paddleZ": b.PIVOT_Z,
        "ratio": g.SECTOR_PITCH_R / g.PINION_PITCH_R,
        "pinionR": g.PINION_PITCH_R,
        "maxMargin": MAX_CAMERA_TOP_MARGIN,
        "minMargin": MIN_CAMERA_TOP_MARGIN,
    }
    html = r'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tango Pebble · 일체형 외피 조절 구조</title>
<style>
*{box-sizing:border-box}html,body{margin:0;background:#f8f5ef;color:#282d34;font-family:system-ui,"Malgun Gothic",sans-serif}
main{max-width:1350px;margin:auto;padding:20px}h1{font-size:1.55rem;margin:0 0 7px}p{line-height:1.55}.intro{margin:0 0 18px;color:#48505a}
.layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,.8fr);gap:16px}
#stage{height:min(73vh,690px);min-height:460px;border:1px solid #ded8ce;border-radius:18px;overflow:hidden;background:#eee7dc;position:relative}
canvas{width:100%;height:100%;display:block;touch-action:none}.hint{position:absolute;left:14px;bottom:12px;background:#fffc;padding:7px 10px;border-radius:9px;font-size:.82rem}
.panel{display:flex;flex-direction:column;gap:12px}.card{background:#fff;border:1px solid #e3ddd3;border-radius:16px;padding:15px}.card h2{font-size:1.06rem;margin:0 0 10px}
.track{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0 3px}.track strong{white-space:nowrap}input[type=range]{width:100%;accent-color:#226dac;cursor:pointer}
.red input{accent-color:#b74e2e}.small{font-size:.85rem;color:#606975;line-height:1.45;margin:8px 0 0}
.arrow{font-weight:700;color:#166290}.red .arrow{color:#a34127}.btns{display:flex;flex-wrap:wrap;gap:8px}button{border:1px solid #b8b1a8;border-radius:9px;background:#fff;padding:8px 11px;font:inherit;cursor:pointer}button[aria-pressed=true]{background:#243c54;color:#fff;border-color:#243c54}
.flow{display:flex;align-items:center;gap:5px;flex-wrap:wrap;font-weight:600;font-size:.9rem}.flow span{background:#edf4f8;padding:6px 8px;border-radius:7px}.red .flow span{background:#f9ece6}
.legend{display:flex;flex-wrap:wrap;gap:9px;font-size:.84rem}.swatch{width:11px;height:11px;border-radius:3px;display:inline-block;margin-right:4px}
@media(max-width:850px){.layout{grid-template-columns:1fr}#stage{height:55vh;min-height:380px}}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/"}}</script>
</head><body><main><h1>기어로 움직이는 스마트폰 반사경</h1>
<p class="intro">좌우 기어 공간을 본체 외피 안으로 넣고, 오른쪽 면에는 작은 정비 뚜껑과 두 레버만 남겼습니다. <b>반대편 보기</b>로 한 덩어리형 외형을, <b>내부 보기</b>로 기어 작동을 확인해 보세요.</p>
<div class="layout"><div id="stage"><canvas aria-label="기어식 반사경 3D 모델"></canvas><div class="hint">드래그: 회전 · 휠: 확대</div></div>
<div class="panel">
<div class="card"><h2>① 위쪽 레버 · 거울 각도</h2><div class="flow"><span>바깥 레버</span> → <span>커버 안 작은 톱니</span> → <span>거울축 부채꼴 톱니</span> → <span>거울 회전</span></div>
<div class="track"><span>손잡이 회전</span><strong id="angleWheelValue">0°</strong></div><input id="angle" type="range" min="-5" max="5" step="0.5" value="0"><p class="small">거울 <b id="angleValue">33°</b> · 기준에서 ±5° · 손잡이는 반대 방향으로 최대 약 12° 회전</p></div>
<div class="card red"><h2>② 아래쪽 레버 · 카메라 높이</h2><div class="flow"><span>바깥 레버</span> → <span>커버 안 작은 톱니</span> → <span>세로 톱니줄</span> → <span>폰 윗변 받침 이동</span></div>
<div class="track"><span>손잡이 회전</span><strong id="heightWheelValue">0°</strong></div><input id="depth" type="range" min="0" max="10" step="2.5" value="10"><p class="small">받침 하강 <b id="depthValue">10mm</b> · 휴대폰 윗변은 거울 윗변보다 <b id="marginValue">4mm</b> 위 · 고정 위치 4 / 6.5 / 9 / 11.5 / 14mm</p>
<label class="small">기기의 카메라 상단 여백 <input id="deviceMargin" type="number" min="4" max="14" step="0.5" value="4" style="width:65px"> mm</label><p class="small">파란 점이 전면 카메라입니다. 기준 거울 각도 33°에서 카메라 상단과 거울 상단의 차이: <b id="alignmentValue">0mm</b>. 사용자 실측 4mm 기기에 맞춘 위치로 시작합니다.</p></div>
<div class="card"><div class="btns"><button id="opposite" type="button" aria-pressed="false">반대편 보기</button><button id="inside" type="button" aria-pressed="false">내부 보기</button><button id="explode" type="button" aria-pressed="false">분해 보기</button><button id="phone" type="button" aria-pressed="true">폰 숨기기</button></div>
<p class="small">바깥에서는 진한 갈색 레버 두 개만 돌출됩니다. 내부 보기에서는 본체와 오른쪽 정비 뚜껑을 숨겨 기어를 보여 줍니다.</p>
<p class="small">조립 순서: 거울판·폰 받침을 좌우 본체 사이에 놓고 닫기 → 오른쪽 면에서 작은 기어 두 개를 넣기 → 정비 뚜껑을 세 스냅핀으로 끼우기 → 바깥에서 두 레버를 D자 축에 끼우기 → 뒤 커버와 스폰지 장착.</p>
<div class="legend"><span><i class="swatch" style="background:#279773"></i>거울</span><span><i class="swatch" style="background:#4a78cf"></i>폰 받침</span><span><i class="swatch" style="background:#8661b5"></i>각도 톱니</span><span><i class="swatch" style="background:#cb4e44"></i>높이 톱니</span></div></div>
<p class="small">CAD에서 부품 삽입 경로·거울 ±5°·폰 깊이 0~10mm·카메라 시야의 형상 간섭을 확인했습니다. 높이 받침의 다섯 고정 위치는 본체 안쪽 딸깍 탭으로 잡습니다. 실제 딸깍 힘·레버 이탈 방지·인쇄 후 톱니 백래시는 출력 시험 전입니다.</p>
</div></div></main><script type="module">
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
const data=__DATA__,cfg=__CONFIG__;
const stage=document.getElementById('stage'),canvas=stage.querySelector('canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xeee7dc);
const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x808797,2.5));
const key=new THREE.DirectionalLight(0xfff3e4,2.4);key.position.set(70,-70,100);scene.add(key);
const fill=new THREE.DirectionalLight(0xd2e8ff,1.2);fill.position.set(-60,50,30);scene.add(fill);
const camera=new THREE.PerspectiveCamera(33,1,.1,600);camera.up.set(0,0,1);camera.position.set(100,-115,64);
const orbit=new OrbitControls(camera,canvas);orbit.target.set(0,-5,-5);orbit.enableDamping=true;orbit.update();
const loader=new STLLoader();
function geometry(encoded){const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const shape=loader.parse(bytes.buffer);shape.computeVertexNormals();return shape}
const colors={shell_left:'#dc995f',shell_right:'#dc995f',rear_cover:'#dc995f',gear_cover:'#dc995f',mirror_tray:'#279773',mirror:'#8ed4e8',height_slider:'#4a78cf',angle_pinion:'#8661b5',height_pinion:'#cb4e44',angle_lever:'#503a32',height_lever:'#503a32',paddle:'#c05e3e',foam:'#3b4249',phone:'#52616f'};
const objects={};function make(name,parent=scene){const material=new THREE.MeshStandardMaterial({color:colors[name],roughness:.5,metalness:.04,transparent:name==='mirror'||name==='phone',opacity:name==='mirror'?.86:name==='phone'?.35:1,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geometry(data[name]),material);parent.add(mesh);objects[name]=mesh;return mesh}
make('shell_left');make('shell_right');make('rear_cover');make('gear_cover');make('foam');make('height_slider');make('phone');
colors.camera_lens='#087fff';make('camera_lens');objects.camera_lens.material.roughness=.2;
const trayGroup=new THREE.Group();trayGroup.position.set(0,cfg.pivotY,cfg.pivotZ);scene.add(trayGroup);
for(const name of (cfg.heightOnly?['mirror']:['mirror_tray','mirror'])){const part=make(name,trayGroup);part.position.set(0,-cfg.pivotY,-cfg.pivotZ)}
function wheelGroup(names,y,z){const group=new THREE.Group();group.position.set(0,y,z);scene.add(group);for(const name of names){const part=make(name,group);part.position.set(0,-y,-z)}return group}
const angleGroup=wheelGroup(cfg.heightOnly?[]:['angle_pinion','angle_lever'],cfg.angleY,cfg.angleZ),heightGroup=wheelGroup(['height_pinion','height_lever'],cfg.heightY,cfg.heightZ);
const paddleGroup=new THREE.Group();paddleGroup.position.set(0,cfg.paddleY,cfg.paddleZ);paddleGroup.rotation.x=17.1256*Math.PI/180;scene.add(paddleGroup);const paddle=make('paddle',paddleGroup);paddle.position.set(0,-cfg.paddleY,-cfg.paddleZ);
let inside=false,exploded=false,phoneVisible=true;
function update(){const angle=Number(document.getElementById('angle')?.value||0),depth=Number(document.getElementById('depth').value),heightTurn=-depth/cfg.pinionR*180/Math.PI,angleTurn=-angle*cfg.ratio;
 if(!cfg.heightOnly)document.getElementById('angleWheelValue').textContent=angleTurn.toFixed(1)+'°';document.getElementById('heightWheelValue').textContent=heightTurn.toFixed(1)+'°';
 if(!cfg.heightOnly)document.getElementById('angleValue').textContent=(33+angle).toFixed(1).replace('.0','')+'°';document.getElementById('depthValue').textContent=depth.toFixed(1).replace('.0','')+'mm';
 const deviceMargin=Math.max(cfg.minMargin,Math.min(cfg.maxMargin,Number(document.getElementById('deviceMargin').value)||cfg.minMargin));
 document.getElementById('marginValue').textContent=(cfg.maxMargin-depth).toFixed(1).replace('.0','')+'mm';document.getElementById('alignmentValue').textContent=(cfg.maxMargin-depth-deviceMargin).toFixed(1).replace('.0','')+'mm';
 objects.camera_lens.position.set(0,0,-depth-deviceMargin+cfg.minMargin);objects.camera_lens.visible=phoneVisible&&!exploded;
 trayGroup.rotation.x=angle*Math.PI/180;angleGroup.rotation.x=angleTurn*Math.PI/180;heightGroup.rotation.x=heightTurn*Math.PI/180;
 objects.height_slider.position.set(0,exploded?25:0,-depth-(exploded?12:0));objects.phone.position.set(0,0,-depth);objects.phone.visible=phoneVisible&&!exploded;
 objects.shell_left.position.x=exploded?-38:0;objects.shell_right.position.x=exploded?38:0;objects.shell_left.visible=!inside||exploded;objects.shell_right.visible=!inside||exploded;
 objects.rear_cover.position.y=exploded?32:0;objects.rear_cover.visible=!inside||exploded;objects.gear_cover.position.x=exploded?54:0;objects.gear_cover.visible=!inside||exploded;objects.foam.position.y=exploded?32:0;
 if(objects.mirror_tray)objects.mirror_tray.material.color.set(inside||exploded?'#279773':'#dc995f');objects.height_slider.material.color.set(inside||exploded?'#4a78cf':'#dc995f');
 trayGroup.position.set(0,cfg.pivotY+(exploded?-18:0),cfg.pivotZ);angleGroup.position.set(exploded?22:0,cfg.angleY,cfg.angleZ);heightGroup.position.set(exploded?32:0,cfg.heightY,cfg.heightZ);
 paddleGroup.position.set(0,cfg.paddleY,cfg.paddleZ-(exploded?17:0));}
for(const id of ['angle','depth','deviceMargin'])document.getElementById(id)?.addEventListener('input',update);
function toggle(id,handler){document.getElementById(id).addEventListener('click',e=>{handler();e.currentTarget.setAttribute('aria-pressed',String(id==='inside'?inside:id==='explode'?exploded:phoneVisible));update()})}
toggle('inside',()=>inside=!inside);toggle('explode',()=>exploded=!exploded);toggle('phone',()=>phoneVisible=!phoneVisible);
let opposite=false;document.getElementById('opposite').addEventListener('click',e=>{opposite=!opposite;camera.position.set(opposite?-100:100,-115,64);orbit.update();e.currentTarget.setAttribute('aria-pressed',String(opposite))});
function frame(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();orbit.update();renderer.render(scene,camera);requestAnimationFrame(frame)}
update();frame();
</script></body></html>'''
    if height_only:
        start=html.index('<div class="card"><h2>①')
        end=html.index('<div class="card red">',start)
        html=html[:start]+html[end:]
        html=html.replace('② 아래쪽 레버 · 카메라 높이','높이 조절 레버 · 카메라 높이')
        html=html.replace('기어로 움직이는 스마트폰 반사경','높이만 조절하는 스마트폰 반사경')
        html=html.replace('두 레버만 남겼습니다.','높이 레버 하나만 남겼습니다. 거울은 본체의 접착판에 33°로 고정됩니다.')
        html=html.replace('레버 두 개만','높이 레버 하나만')
        html=html.replace('거울판·폰 받침을 좌우 본체 사이에 놓고 닫기 → 오른쪽 면에서 작은 기어 두 개를 넣기','혀·폰 받침을 좌우 본체 사이에 놓고 닫기 → 본체의 고정판에 40×30mm 거울 붙이기 → 오른쪽 면에서 높이 기어 하나를 넣기')
        html=html.replace('두 레버를 D자 축에','높이 레버를 D자 축에')
        html=html.replace('<span><i class="swatch" style="background:#8661b5"></i>각도 톱니</span>','')
        html=html.replace('부품 삽입 경로·거울 ±5°·폰 깊이','부품 삽입 경로·고정 거울 33°·폰 깊이')
        html=html.replace("let inside=false,exploded=false,phoneVisible=true;", "colors.height_index_pin='#e2b529';make('height_index_pin');let inside=false,exploded=false,phoneVisible=true;")
        html=html.replace('<p class="small">바깥에서는', '<p class="small"><b>오른쪽 구멍 5개 = 높이 고정:</b> 노란 돌기가 구멍에 걸려 높이를 유지합니다. 구멍 간격 2.5mm, 전체 이동 10mm입니다. 왼쪽 톱니는 이동용, 오른쪽 구멍은 고정용입니다.</p><p class="small">바깥에서는')
        html=html.replace('<div class="card"><div class="btns">','<div class="card"><h2>기어 넣는 순서</h2><button id="assembly" type="button" aria-pressed="false">기어 조립 보기</button><div id="assemblyPanel" hidden><div class="track"><strong id="assemblyValue">① 기어 넣기 전</strong></div><input id="assemblyStep" aria-label="기어 조립 단계" type="range" min="0" max="3" step="1" value="0"><p id="assemblyNote" class="small"></p><p class="small">반투명 본체는 위치를 보여 주기 위한 표시입니다. 본체를 닫고 옆 뚜껑을 뺀 상태에서 조립합니다.</p></div></div><div class="card"><div class="btns">')
        html=html.replace("let inside=false,exploded=false,phoneVisible=true;", """let inside=false,exploded=false,phoneVisible=true,assembling=false,savedDepth=10;
const insertionArrow=new THREE.ArrowHelper(new THREE.Vector3(-1,0,0),new THREE.Vector3(55,cfg.heightY,cfg.heightZ),29,0xcb4e44,4,2);scene.add(insertionArrow);insertionArrow.visible=false;
const assemblyTitles=['① 기어 넣기 전','② 기어를 끝까지 넣기','③ 옆 뚜껑 닫기','④ 바깥 레버 끼우기'];
const assemblyNotes=['옆 뚜껑과 레버를 먼저 빼세요. 기어의 긴 축 끝을 빨간 화살표 방향으로 본체 안쪽 축 구멍에 넣습니다.','받침을 가장 높은 위치에 놓고 톱니를 맞춥니다. 축이 구멍에 들어가며 기어 원판은 옆 공간 안에 남습니다.','기어축 바깥쪽 끝을 옆 뚜껑의 작은 구멍으로 통과시키며 뚜껑의 세 핀을 끼웁니다. 기어 원판은 이 구멍을 통과하지 않습니다.','뚜껑 밖으로 나온 D자 축에 레버의 D자 구멍을 맞춰 끼웁니다. 레버는 기어·뚜껑 조립 후 끼웁니다.'];
""")
        html=html.replace(' paddleGroup.position.set(0,cfg.paddleY,cfg.paddleZ-(exploded?17:0));}', """ paddleGroup.position.set(0,cfg.paddleY,cfg.paddleZ-(exploded?17:0));
 objects.height_pinion.position.x=0;objects.height_lever.position.x=exploded?20:0;
 objects.foam.visible=true;objects.height_index_pin.visible=inside||assembling||exploded;objects.height_index_pin.position.x=exploded?38:0;
 insertionArrow.visible=assembling&&Number(document.getElementById('assemblyStep').value)===0;
 objects.shell_right.material.transparent=assembling;objects.shell_right.material.opacity=assembling?.22:1;
 document.getElementById('depth').disabled=assembling;document.getElementById('inside').disabled=assembling;document.getElementById('explode').disabled=assembling;
 if(assembling){
  const step=Number(document.getElementById('assemblyStep').value);
  objects.shell_left.position.x=0;objects.shell_right.position.x=0;objects.shell_left.visible=true;objects.shell_right.visible=true;
  objects.height_slider.position.set(0,0,0);objects.height_slider.material.color.set('#4a78cf');heightGroup.rotation.x=0;heightGroup.position.set(0,cfg.heightY,cfg.heightZ);
  objects.height_pinion.position.x=step===0?18:0;objects.height_lever.position.x=step<3?54:0;
  objects.gear_cover.position.x=step<2?34:0;objects.gear_cover.visible=true;
  objects.phone.visible=false;objects.camera_lens.visible=false;objects.rear_cover.visible=false;objects.foam.visible=false;trayGroup.visible=false;
  paddleGroup.position.set(0,cfg.paddleY,cfg.paddleZ);
  document.getElementById('assemblyValue').textContent=assemblyTitles[step];document.getElementById('assemblyNote').textContent=assemblyNotes[step];
 }else{trayGroup.visible=true;}
}
const assemblyButton=document.getElementById('assembly');assemblyButton.addEventListener('click',()=>{assembling=!assembling;assemblyButton.setAttribute('aria-pressed',String(assembling));document.getElementById('assemblyPanel').hidden=!assembling;
 if(assembling){savedDepth=document.getElementById('depth').value;document.getElementById('depth').value='0';inside=false;exploded=false;document.getElementById('inside').setAttribute('aria-pressed','false');document.getElementById('explode').setAttribute('aria-pressed','false');camera.position.set(135,-70,40);orbit.target.set(25,cfg.heightY,2);orbit.update();}
 else{document.getElementById('depth').value=savedDepth;orbit.target.set(0,-5,-5);orbit.update();}update();});
document.getElementById('assemblyStep').addEventListener('input',update);
""")

    html = html.replace("__DATA__", json.dumps(data, separators=(",", ":")))
    html = html.replace("__CONFIG__", json.dumps(config, separators=(",", ":")))
    path = g.OUT / ("tango_pebble_height_only_interactive.html" if height_only else "tango_pebble_geared_unibody_interactive.html")
    path.write_text(html, encoding="utf-8")
    aliases=["tango_pebble_geared_unibody_interactive.html"] if height_only else [
        "tango_pebble_geared_pebble_cover_interactive.html",
        "tango_pebble_geared_covered_interactive.html","tango_pebble_geared_interactive.html"]
    for alias in aliases:
        (g.OUT / alias).write_text(html, encoding="utf-8")
    print(path)


if __name__ == "__main__":
    main("--height-only" in sys.argv)
    sys.stdout.flush()
    os._exit(0)
