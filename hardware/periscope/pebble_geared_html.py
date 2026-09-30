"""Interactive kinematic explanation for the two-gear reflector concept."""
from pathlib import Path
import base64
import json
import os
import sys

import cadquery as cq

import pebble as b
import pebble_adjustable as a
import pebble_geared as g
import pebble_cover as fixed


def mesh_data(shape):
    temporary = g.OUT / "_geared_display.stl"
    cq.exporters.export(shape, str(temporary), tolerance=0.22, angularTolerance=0.28)
    encoded = base64.b64encode(temporary.read_bytes()).decode("ascii")
    temporary.unlink()
    return encoded


def main():
    g.OUT.mkdir(parents=True, exist_ok=True)
    factories = {
        "shell_left": a.shell_left, "shell_right": g.shell_right,
        "mirror_tray": g.mirror_tray, "height_slider": g.height_slider,
        "angle_pinion": lambda: g.pinion(*g.ANGLE_AXIS),
        "height_pinion": lambda: g.pinion(*g.HEIGHT_AXIS),
        "angle_lever": lambda: g.lever(*g.ANGLE_AXIS),
        "height_lever": lambda: g.lever(*g.HEIGHT_AXIS),
        "gear_cover": g.gear_cover,
        "rear_cover": fixed.cover, "paddle": a.adjustable_paddle,
        "mirror": b.mirror, "foam": b.foam, "phone": b.phone,
    }
    data = {name: mesh_data(factory()) for name, factory in factories.items()}
    config = {
        "pivotY": a.PIVOT_Y, "pivotZ": a.PIVOT_Z,
        "angleY": g.ANGLE_AXIS[0], "angleZ": g.ANGLE_AXIS[1],
        "heightY": g.HEIGHT_AXIS[0], "heightZ": g.HEIGHT_AXIS[1],
        "paddleY": b.old.PIVOT_Y, "paddleZ": b.PIVOT_Z,
        "ratio": g.SECTOR_PITCH_R / g.PINION_PITCH_R,
        "pinionR": g.PINION_PITCH_R,
    }
    html = r'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tango Pebble · 기어식 조절 구조</title>
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
<p class="intro">오른쪽 바깥에는 두 레버만 보입니다. 톱니는 넓어진 측면 커버 안에 넣었습니다. <b>내부 보기</b>를 누르면 커버를 숨기고 동력 전달을 볼 수 있습니다.</p>
<div class="layout"><div id="stage"><canvas aria-label="기어식 반사경 3D 모델"></canvas><div class="hint">드래그: 회전 · 휠: 확대</div></div>
<div class="panel">
<div class="card"><h2>① 위쪽 레버 · 거울 각도</h2><div class="flow"><span>바깥 레버</span> → <span>커버 안 작은 톱니</span> → <span>거울축 부채꼴 톱니</span> → <span>거울 회전</span></div>
<div class="track"><span>손잡이 회전</span><strong id="angleWheelValue">0°</strong></div><input id="angle" type="range" min="-5" max="5" step="0.5" value="0"><p class="small">거울 <b id="angleValue">33°</b> · 기준에서 ±5° · 손잡이는 반대 방향으로 최대 15.6° 회전</p></div>
<div class="card red"><h2>② 아래쪽 레버 · 카메라 높이</h2><div class="flow"><span>바깥 레버</span> → <span>커버 안 작은 톱니</span> → <span>세로 톱니줄</span> → <span>폰 윗변 받침 이동</span></div>
<div class="track"><span>손잡이 회전</span><strong id="heightWheelValue">0°</strong></div><input id="depth" type="range" min="0" max="10" step="0.5" value="0"><p class="small">폰 삽입 깊이 <b id="depthValue">0mm</b> · 총 10mm 이동 · 손잡이는 약 119° 회전</p></div>
<div class="card"><div class="btns"><button id="inside" type="button" aria-pressed="false">내부 보기</button><button id="explode" type="button" aria-pressed="false">분해 보기</button><button id="phone" type="button" aria-pressed="true">폰 숨기기</button></div>
<p class="small">조립 보기에서 커버 밖에는 보라색·빨간색 레버만 남습니다. 내부 보기에서는 커버를 숨겨 각각의 톱니가 드러납니다.</p>
<p class="small">조립 순서: 작은 기어 두 개를 본체 축받이에 넣고 → 측면 커버를 세 개의 위치핀에 맞춰 닫고 → 바깥에서 두 레버를 축의 D자 끝에 끼웁니다.</p>
<div class="legend"><span><i class="swatch" style="background:#279773"></i>거울</span><span><i class="swatch" style="background:#4a78cf"></i>폰 받침</span><span><i class="swatch" style="background:#8661b5"></i>각도 톱니</span><span><i class="swatch" style="background:#cb4e44"></i>높이 톱니</span></div></div>
<p class="small">기구 작동을 보여주는 CAD 시안입니다. 측면 커버의 체결 구조와 축 방향 고정, 인쇄 후 백래시·내구성은 아직 확정 전입니다.</p>
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
const colors={shell_left:'#dc995f',shell_right:'#dc995f',rear_cover:'#ca744d',gear_cover:'#d7975e',mirror_tray:'#279773',mirror:'#8ed4e8',height_slider:'#4a78cf',angle_pinion:'#8661b5',height_pinion:'#cb4e44',angle_lever:'#8661b5',height_lever:'#cb4e44',paddle:'#c05e3e',foam:'#3b4249',phone:'#52616f'};
const objects={};function make(name,parent=scene){const material=new THREE.MeshStandardMaterial({color:colors[name],roughness:.5,metalness:.04,transparent:name==='mirror'||name==='phone',opacity:name==='mirror'?.86:name==='phone'?.35:1,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geometry(data[name]),material);parent.add(mesh);objects[name]=mesh;return mesh}
make('shell_left');make('shell_right');make('rear_cover');make('gear_cover');make('foam');make('height_slider');make('phone');
const trayGroup=new THREE.Group();trayGroup.position.set(0,cfg.pivotY,cfg.pivotZ);scene.add(trayGroup);
for(const name of ['mirror_tray','mirror']){const part=make(name,trayGroup);part.position.set(0,-cfg.pivotY,-cfg.pivotZ)}
function wheelGroup(names,y,z){const group=new THREE.Group();group.position.set(0,y,z);scene.add(group);for(const name of names){const part=make(name,group);part.position.set(0,-y,-z)}return group}
const angleGroup=wheelGroup(['angle_pinion','angle_lever'],cfg.angleY,cfg.angleZ),heightGroup=wheelGroup(['height_pinion','height_lever'],cfg.heightY,cfg.heightZ);
const paddleGroup=new THREE.Group();paddleGroup.position.set(0,cfg.paddleY,cfg.paddleZ);paddleGroup.rotation.x=17.1256*Math.PI/180;scene.add(paddleGroup);const paddle=make('paddle',paddleGroup);paddle.position.set(0,-cfg.paddleY,-cfg.paddleZ);
let inside=false,exploded=false,phoneVisible=true;
function update(){const angle=Number(document.getElementById('angle').value),depth=Number(document.getElementById('depth').value),heightTurn=-depth/cfg.pinionR*180/Math.PI,angleTurn=-angle*cfg.ratio;
 document.getElementById('angleWheelValue').textContent=angleTurn.toFixed(1)+'°';document.getElementById('heightWheelValue').textContent=heightTurn.toFixed(1)+'°';
 document.getElementById('angleValue').textContent=(33+angle).toFixed(1).replace('.0','')+'°';document.getElementById('depthValue').textContent=depth.toFixed(1).replace('.0','')+'mm';
 trayGroup.rotation.x=angle*Math.PI/180;angleGroup.rotation.x=angleTurn*Math.PI/180;heightGroup.rotation.x=heightTurn*Math.PI/180;
 objects.height_slider.position.set(0,exploded?25:0,-depth-(exploded?12:0));objects.phone.position.set(0,0,-depth);objects.phone.visible=phoneVisible&&!exploded;
 objects.shell_left.position.x=exploded?-38:0;objects.shell_right.position.x=exploded?38:0;objects.shell_left.visible=!inside||exploded;objects.shell_right.visible=!inside||exploded;
 objects.rear_cover.position.y=exploded?32:0;objects.rear_cover.visible=!inside||exploded;objects.gear_cover.position.x=exploded?54:0;objects.gear_cover.visible=!inside||exploded;objects.foam.position.y=exploded?32:0;
 trayGroup.position.set(0,cfg.pivotY+(exploded?-18:0),cfg.pivotZ);angleGroup.position.set(exploded?22:0,cfg.angleY,cfg.angleZ);heightGroup.position.set(exploded?32:0,cfg.heightY,cfg.heightZ);
 paddleGroup.position.set(0,cfg.paddleY,cfg.paddleZ-(exploded?17:0));}
for(const id of ['angle','depth'])document.getElementById(id).addEventListener('input',update);
function toggle(id,handler){document.getElementById(id).addEventListener('click',e=>{handler();e.currentTarget.setAttribute('aria-pressed',String(id==='inside'?inside:id==='explode'?exploded:phoneVisible));update()})}
toggle('inside',()=>inside=!inside);toggle('explode',()=>exploded=!exploded);toggle('phone',()=>phoneVisible=!phoneVisible);
function frame(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();orbit.update();renderer.render(scene,camera);requestAnimationFrame(frame)}
update();frame();
</script></body></html>'''
    html = html.replace("__DATA__", json.dumps(data, separators=(",", ":")))
    html = html.replace("__CONFIG__", json.dumps(config, separators=(",", ":")))
    path = g.OUT / "tango_pebble_geared_covered_interactive.html"
    path.write_text(html, encoding="utf-8")
    (g.OUT / "tango_pebble_geared_interactive.html").write_text(html, encoding="utf-8")
    print(path)


if __name__ == "__main__":
    main()
    sys.stdout.flush()
    os._exit(0)
