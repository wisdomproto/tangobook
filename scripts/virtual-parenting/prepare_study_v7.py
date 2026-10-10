"""Prepare the native-only comparison viewer and check its actual exported data."""
import pathlib,json,re,struct,subprocess,shutil
from three_panel_study import compose
from PIL import Image
base=pathlib.Path(__file__).parent;root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
html=(base/'carousel-v6.html').read_text(encoding='utf-8')
html=html.replace('두 가지 교구 · 여러 각도 피드','공부방 · 실제 3D 원본').replace('HOME 06 · TWO ACTIVITIES / THREE ANGLES','HOME 07 · NATIVE BLENDER STUDY')
html=html.replace('carousel-v6-shots.json','study-v7-shots.json').replace('family-home-carousel-v6','family-home-study-v7')
html=html.replace('family-home-study-v7.glb','family-home-study-v7-web.glb')
html=html.replace('이미지와 카메라 위치를 함께 비교하세요','AI 보정 없는 원본 · 같은 모델의 카메라')
html=html.replace('3D 렌더를 참조한 생성 이미지','AI 보정 없는 실제 Blender 렌더')
html=html.replace('촬영 위치와 시야','원본 카메라 위치와 시야').replace('AI PHOTO','CYCLES RENDER')
html=html.replace('새 집 구조 →','전체 집 구조 →')
html=html.replace("[-.85,21,.36]:[13,15,18]", "[3.9,10,2.5]:[8.2,5.6,7.7]").replace("controls.target.set(-.85,.4,.35)","controls.target.set(3.90,.40,2.65)")
html=html.replace(" · 높이 ${s.position[1].toFixed(2)} m`", " · 높이 ${s.position[1].toFixed(2)} m · 방 2.9 × 4.0 m`")
html=re.sub(r'<div class="left-tools">.*?</div></section>', '<div class="left-tools"><input id="blend" type="range" min="0" max="100" value="100" hidden><span>실제 Cycles 렌더 · 아이 모델 없음</span><a id="image-link" class="download" download>렌더 원본 ↓</a></div></section>',html,count=1)
html=html.replace('</style>', '.right .head{background:#f8f7f0ee;padding:8px 10px;border-radius:7px;top:12px;left:15px;right:15px}.camera-info,.view-hint{background:#f8f7f0e8;color:#414b38;padding:4px 7px;border-radius:5px;top:60px}.right .head span{color:#65714f}</style>')
html=html.replace('이미지 생성 중입니다.<br>원본 3D 렌더는 아래 슬라이더로 볼 수 있습니다.','원본 렌더를 불러오지 못했습니다.')
html=compose(html)
(base/'study-v7.html').write_text(html,encoding='utf-8');(root/'study-v7.html').write_text(html,encoding='utf-8')
shots=json.loads((root/'study-v7-shots.json').read_text(encoding='utf-8'));assert len(shots)==6
for s in shots:s['title']=s['title'].replace('아이 뒤 · 어깨 너머','책상 뒤 · 창가').replace('손·교구 근접','교구 디테일')
(root/'study-v7-shots.json').write_text(json.dumps(shots,ensure_ascii=False,indent=2),encoding='utf-8')
for name in ['study-v7-shots.json','study-v7-assets.json']:shutil.copy2(root/name,base/name)
for s in shots:
    assert s['validation_status']=='native-render' and s['image']==s['guide']
    with Image.open(root/s['image']) as im:assert im.size==(800,1000)
    assert len(s['up'])==3 and len(s['frustum_corners'])==4
photos=json.loads((root/'study-v7-photo-shots.json').read_text(encoding='utf-8'))
assert {s['id'] for s in photos}=={s['id'] for s in shots}
for photo in photos:
    native=next(s for s in shots if s['id']==photo['id'])
    assert photo['source_model']=='v7' and photo['reference']==native['guide']
    with Image.open(root/photo['image']) as im:assert abs(im.width/im.height-native['aspect'])<.003
blob=(root/'family-home-study-v7.glb').read_bytes();magic,version,length=struct.unpack_from('<4sII',blob);assert magic==b'glTF' and version==2 and length==len(blob)
size,kind=struct.unpack_from('<II',blob,12);gltf=json.loads(blob[20:20+size]);ids=[n.get('extras',{}).get('asset_id') for n in gltf['nodes']]
for key in ['study-opposite-cabinet-v7','study-bound-books-v7','study-artwork-v7','study-activity-resources-v7']:assert key in ids
assert len(gltf['images'])==7
temp=root/'study-v7-check.mjs';temp.write_text(re.search(r'<script type="module">(.*?)</script>',html,re.S).group(1),encoding='utf-8');subprocess.run(['node','--check',str(temp)],check=True)
feed=(base/'feed-v5.html').read_text(encoding='utf-8')
if 'study-v7.html' not in feed:feed=feed.replace('PBR 원본 →</a>', 'PBR 원본 →</a> · <a class="download" href="study-v7.html">공부방 3D 원본 →</a>')
(base/'feed-v5.html').write_text(feed,encoding='utf-8');(root/'feed-v5.html').write_text(feed,encoding='utf-8')
print('STUDY_VIEWER_VALIDATED',len(shots),'raw renders',len(gltf['nodes']),'nodes',len(gltf['images']),'packed maps')
