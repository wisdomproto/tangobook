"""Create an interactive viewer for the adjustable reflector CAD."""
from pathlib import Path
import base64
import json
import os
import sys

import cadquery as cq

import pebble as b
import pebble_adjustable as a


def mesh_data(shape):
    temporary=a.OUT/"_adjustable_display.stl"
    cq.exporters.export(shape,str(temporary),tolerance=0.24,angularTolerance=0.32)
    encoded=base64.b64encode(temporary.read_bytes()).decode("ascii")
    temporary.unlink()
    return encoded


def main():
    a.OUT.mkdir(parents=True,exist_ok=True)
    data={name:mesh_data(factory()) for name,factory in a.PARTS.items()}
    data["mirror"]=mesh_data(b.mirror())
    data["foam"]=mesh_data(b.foam())
    data["phone"]=mesh_data(b.phone())
    config={"pivotY":a.PIVOT_Y,"pivotZ":a.PIVOT_Z,
            "paddleY":b.old.PIVOT_Y,"paddleZ":b.PIVOT_Z}
    html=r'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tango Pebble 조절식 반사경 시안</title>
<style>
*{box-sizing:border-box}html,body{margin:0;background:#faf7f2;color:#302d29;font-family:system-ui,"Malgun Gothic",sans-serif}
main{max-width:1200px;margin:auto;padding:20px}h1{font-size:1.4rem;margin:0 0 8px}p{line-height:1.5}
.controls{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin:16px 0}
label{display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #ded6ca;padding:9px 12px;border-radius:12px}
input[type=range]{width:160px;accent-color:#b75b3c}button{border:1px solid #b75b3c;background:#fff;color:#8c3f26;border-radius:12px;padding:9px 14px;font:inherit;cursor:pointer}
button:hover{background:#f9ece5}#stage{height:min(70vh,670px);min-height:400px;border:1px solid #ded6ca;border-radius:18px;overflow:hidden;background:#eee8df}
canvas{display:block;width:100%;height:100%;touch-action:none}.note{font-size:.9rem;color:#675f58}
@media(max-width:650px){label{width:100%;justify-content:space-between}input[type=range]{width:46%}}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/"}}</script>
</head><body><main>
<h1>조절식 스마트폰 반사경 · CAD 시안</h1>
<p>거울 각도는 바깥 레버로 28–38°, 카메라와 거울의 상대 높이는 폰 삽입 깊이로 총 10mm 조절합니다. 파란 U자 슬라이더는 2.5mm 간격으로 고정합니다.</p>
<div class="controls">
<label>거울 각도 <input id="angle" type="range" min="-5" max="5" step="0.5" value="0"><strong id="angleValue">33°</strong></label>
<label>폰 삽입 깊이 <input id="depth" type="range" min="0" max="10" step="2.5" value="0"><strong id="depthValue">0mm</strong></label>
<button id="explode" type="button" aria-pressed="false">분해 보기</button>
<button id="phone" type="button" aria-pressed="true">휴대폰 숨기기</button>
</div>
<div id="stage"><canvas aria-label="조절식 반사경 3D CAD 모델. 마우스나 터치로 회전할 수 있습니다."></canvas></div>
<p class="note">시제품 치수입니다. 실제 인쇄 후 레버 마찰력, 슬라이더 딸깍 강도, 휴대폰별 카메라 시야를 확인해야 합니다. 거울판 오른쪽 원형 플랜지에는 0.5mm 펠트 와셔를 끼우는 설계입니다.</p>
</main><script type="module">
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
const data=__DATA__, cfg=__CONFIG__;
const stage=document.getElementById('stage'),canvas=stage.querySelector('canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setClearColor(0xeee8df);const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff,0x7f8791,2.5));
const key=new THREE.DirectionalLight(0xfff4e8,2.4);key.position.set(65,-70,90);scene.add(key);
const fill=new THREE.DirectionalLight(0xbde9ff,1.2);fill.position.set(-45,45,25);scene.add(fill);
const camera=new THREE.PerspectiveCamera(32,1,0.1,600);camera.up.set(0,0,1);camera.position.set(95,-120,70);
const orbit=new OrbitControls(camera,canvas);orbit.target.set(0,-5,-5);orbit.enableDamping=true;orbit.update();
const loader=new STLLoader();
function material(color,opacity=1){return new THREE.MeshStandardMaterial({color,roughness:.52,metalness:.03,transparent:opacity<1,opacity,side:THREE.DoubleSide})}
function geometry(encoded){const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const g=loader.parse(bytes.buffer);g.computeVertexNormals();return g}
const colors={shell_left:'#d99055',shell_right:'#d99055',mirror_tray:'#2f9875',height_slider:'#456fc9',paddle:'#b75b3c',rear_cover:'#c55236',mirror:'#91d5f0',foam:'#24282c',phone:'#465463'};
const objects={};
function make(name,parent=scene){const mesh=new THREE.Mesh(geometry(data[name]),material(colors[name],name==='mirror' ? 0.88 : 1));parent.add(mesh);objects[name]=mesh;return mesh}
make('shell_left');make('shell_right');make('rear_cover');make('foam');make('height_slider');make('phone');
const trayGroup=new THREE.Group();trayGroup.position.set(0,cfg.pivotY,cfg.pivotZ);scene.add(trayGroup);
for(const name of ['mirror_tray','mirror']){const mesh=make(name,trayGroup);mesh.position.set(0,-cfg.pivotY,-cfg.pivotZ)}
const paddleGroup=new THREE.Group();paddleGroup.position.set(0,cfg.paddleY,cfg.paddleZ);paddleGroup.rotation.x=17.1256*Math.PI/180;scene.add(paddleGroup);
const paddle=make('paddle',paddleGroup);paddle.position.set(0,-cfg.paddleY,-cfg.paddleZ);
let exploded=false,phoneVisible=true;
function update(){
 const angle=Number(document.getElementById('angle').value),depth=Number(document.getElementById('depth').value);
 document.getElementById('angleValue').textContent=(33+angle).toFixed(1).replace('.0','')+'°';
 document.getElementById('depthValue').textContent=depth+'mm';
 trayGroup.rotation.x=angle*Math.PI/180;
 objects.height_slider.position.set(0,exploded?28:0,-depth-(exploded?10:0));
 objects.phone.position.set(0,0,-depth);objects.phone.visible=phoneVisible&&!exploded;
 objects.shell_left.position.set(exploded?-32:0,0,0);objects.shell_right.position.set(exploded?32:0,0,0);
 objects.rear_cover.position.set(0,exploded?30:0,0);objects.foam.position.set(0,exploded?30:0,0);
 trayGroup.position.set(0,cfg.pivotY+(exploded?-20:0),cfg.pivotZ);
 paddleGroup.position.set(0,cfg.paddleY, cfg.paddleZ-(exploded?18:0));
}
document.getElementById('angle').addEventListener('input',update);document.getElementById('depth').addEventListener('input',update);
document.getElementById('explode').addEventListener('click',e=>{exploded=!exploded;e.currentTarget.textContent=exploded?'조립 보기':'분해 보기';e.currentTarget.setAttribute('aria-pressed',String(exploded));update()});
document.getElementById('phone').addEventListener('click',e=>{phoneVisible=!phoneVisible;e.currentTarget.textContent=phoneVisible?'휴대폰 숨기기':'휴대폰 보기';e.currentTarget.setAttribute('aria-pressed',String(phoneVisible));update()});
function frame(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();orbit.update();renderer.render(scene,camera);requestAnimationFrame(frame)}
update();frame();
</script></body></html>'''
    html=html.replace("__DATA__",json.dumps(data,separators=(",",":")))
    html=html.replace("__CONFIG__",json.dumps(config,separators=(",",":")))
    destination=a.OUT/"tango_pebble_adjustable_interactive.html"
    destination.write_text(html,encoding="utf-8")
    print(destination)


if __name__=="__main__":
    main()
    sys.stdout.flush()
    os._exit(0)
