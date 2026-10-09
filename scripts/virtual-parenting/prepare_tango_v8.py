"""Prepare a legible Korean learning screen and static native-render gallery."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

root=Path('D:/ComfyUI-output/virtual-parenting-20261006')
out=root/'tango-v8';out.mkdir(exist_ok=True)
font='C:/Windows/Fonts/malgun.ttf'
im=Image.new('RGB',(720,1000),'#f7f5ef');d=ImageDraw.Draw(im)
def text(y,t,size,color):
    d.text((360,y),t,font=ImageFont.truetype(font,size),fill=color,anchor='mt')
text(120,'가구',120,'#244d3a')
# Existing kr-h1-u02 product image, not an invented furniture illustration.
asset=Image.open(out/'phonics-gagu.webp').convert('RGB')
asset.thumbnail((570,570),Image.Resampling.LANCZOS)
im.paste(asset,((720-asset.width)//2,315))
im.save(out/'tablet-screen.png')
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>탱고 · Blender 원본</title><style>body{margin:0;background:#eeeae3;color:#25382f;font-family:system-ui}header{padding:24px}h1{font-size:24px;margin:0 0 8px}p{margin:8px 0}main{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:0 24px 24px}figure{margin:0;background:white;border-radius:14px;overflow:hidden}img{width:100%;display:block}figcaption{padding:15px}a{color:#236448}@media(max-width:700px){main{grid-template-columns:1fr}}</style><header><h1>탱고 한글 놀이 · 가구</h1><p>같은 공부방 · 실측 인식판/자모 메시 · 기존 반사경 CAD · 원본 Cycles 렌더</p><p>아이는 포즈 검토용 3D 모델입니다. 실사 사진 및 실제 인식 검증 결과가 아닙니다.</p><a href="family-home-tango-v8.blend">Blender 원본 다운로드</a> · <a href="tango-v8/manifest.json">자산·카메라 정보</a></header><main><figure><a href="tango-v8/over-shoulder.png"><img src="tango-v8/over-shoulder.png"></a><figcaption>아이 뒤에서 · 화면과 인식판</figcaption></figure><figure><a href="tango-v8/detail.png"><img src="tango-v8/detail.png"></a><figcaption>손·블록·카메라 반사판 근접</figcaption></figure></main></html>'''
html=html.replace('grid-template-columns:1fr 1fr','grid-template-columns:1fr 1fr 1fr')
html=html.replace('</style>','figure{min-width:0}#view{aspect-ratio:4/5;width:100%;position:relative}canvas{display:block;width:100%;height:100%}button{padding:8px;margin:3px;border:1px solid #b9c5b9;border-radius:7px;background:white}#status{position:absolute;top:8px;left:8px;background:#fff;padding:6px;font-size:13px}</style><script type="importmap">{"imports":{"three":"./vendor/three.module.js","three/addons/":"./vendor/addons/"}}</script>')
html=html.replace('</main>','<figure><div id="view"><span id="status">같은 3D 원본 불러오는 중…</span></div><figcaption>같은 모델 · 카메라 위치 / 촬영 시점<br><button id="orbit">둘러보기</button><button id="back">뒤에서</button><button id="near">근접</button></figcaption></figure></main>')
html=html.replace('<main><figure>','<nav style="padding:0 24px 18px"><button id="shotBack">아이 뒤에서</button><button id="shotNear">손·교구 근접</button></nav><main><figure id="native">')
html=html.replace('<figure><a href="tango-v8/detail.png"><img src="tango-v8/detail.png"></a><figcaption>손·블록·카메라 반사판 근접</figcaption>', '<figure id="photo"><a href="tango-v8/over-shoulder-photo-v3.png"><img src="tango-v8/over-shoulder-photo-v3.png"></a><figcaption>imagegen 사진 · 같은 원본 참조<br>빛·인물·세부 기하는 AI 재해석</figcaption>')
html=html.replace('아이는 포즈 검토용 3D 모델입니다. 실사 사진 및 실제 인식 검증 결과가 아닙니다.','왼쪽 Blender 원본 · 가운데 imagegen 사진 · 오른쪽 같은 3D와 카메라. 실제 파닉스 ‘가구’ 이미지 사용. AI 사진의 돌기·치수까지 동일하다는 검증은 아닙니다.')
html=html.replace('실측 인식판/자모 메시','최신 14×14 인식판 · 노란 스티커 블록')
html+='''<script type="module">
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const el=document.getElementById('view'),scene=new T.Scene();scene.background=new T.Color('#ece7dd');
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(renderer.domElement);
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
scene.add(new T.HemisphereLight(0xffffff,0x807565,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(3,5,4);scene.add(light);
const cam=new T.PerspectiveCamera(45,.8,.01,100);const controls=new OrbitControls(cam,renderer.domElement);controls.enableDamping=true;
const specs=[[[4.42,1.26,.99],[3.86,.61,2.28],34],[[3.48,1.05,1.94],[3.89,.60,2.37],48]];
const markers=new T.Group();scene.add(markers);
let nativeCams=[];
for(const [pos,target,lens] of specs){const c=new T.PerspectiveCamera(2*Math.atan(18/lens)*180/Math.PI,.8,.04,.38);c.position.set(...pos);c.lookAt(new T.Vector3(...target));c.updateMatrixWorld();markers.add(new T.CameraHelper(c));}
function pov(i){const [p,t,l]=specs[i];cam.position.set(...p);controls.target.set(...t);cam.fov=2*Math.atan(18/l)*180/Math.PI;if(nativeCams[i]){cam.position.copy(nativeCams[i].getWorldPosition(new T.Vector3()));cam.quaternion.copy(nativeCams[i].getWorldQuaternion(new T.Quaternion()));cam.fov=nativeCams[i].fov;}else cam.lookAt(controls.target);cam.updateProjectionMatrix();controls.enabled=false;markers.visible=false;}
function orbit(){cam.position.set(5.25,2.35,.25);controls.target.set(3.85,.60,2.15);cam.fov=45;cam.updateProjectionMatrix();controls.enabled=true;markers.visible=true;controls.update();}
function shot(i){const key=i?'detail':'over-shoulder';for(const [id,file] of [['native',key+'.png'],['photo',i?'detail-photo-v4.png':'over-shoulder-photo-v3.png']]){const figure=document.getElementById(id);figure.querySelector('img').src='tango-v8/'+file;figure.querySelector('a').href='tango-v8/'+file;}document.querySelector('#native figcaption').textContent='Blender Cycles 원본 · '+(i?'손·교구 근접':'아이 뒤에서');pov(i);}
document.getElementById('orbit').onclick=orbit;document.getElementById('back').onclick=()=>shot(0);document.getElementById('near').onclick=()=>shot(1);document.getElementById('shotBack').onclick=()=>shot(0);document.getElementById('shotNear').onclick=()=>shot(1);
new GLTFLoader().load('family-home-tango-v8-web.glb',g=>{scene.add(g.scene);scene.updateMatrixWorld(true);nativeCams=[g.cameras.find(c=>c.name.includes('Tango')&&c.name.includes('shoulder')),g.cameras.find(c=>c.name.includes('Tango')&&c.name.includes('detail'))];markers.clear();for(const c of nativeCams){if(!c)continue;const copy=c.clone();copy.position.copy(c.getWorldPosition(new T.Vector3()));copy.quaternion.copy(c.getWorldQuaternion(new T.Quaternion()));copy.near=.04;copy.far=.38;copy.updateProjectionMatrix();copy.updateMatrixWorld();markers.add(new T.CameraHelper(copy));}document.getElementById('status').textContent='동일 Blender 형상 · 웹 조명';orbit();},undefined,e=>{document.getElementById('status').textContent='3D 로딩 실패';console.error(e)});
new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}).observe(el);
renderer.setAnimationLoop(()=>{if(controls.enabled)controls.update();renderer.render(scene,cam)});
</script>'''
(root/'tango-v8.html').write_text(html,encoding='utf-8')
Path(__file__).with_name('tango-v8.html').write_text(html,encoding='utf-8')
