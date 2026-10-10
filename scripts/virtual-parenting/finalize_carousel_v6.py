"""Persist selected photographs, reviewed metadata and local viewer assets."""
import pathlib, json, shutil, struct, ast, re, subprocess
from PIL import Image
base=pathlib.Path(__file__).parent
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
shots=json.loads((root/'carousel-v6-shots.json').read_text(encoding='utf-8'))
records=json.loads((base/'carousel-v6-prompts.json').read_text(encoding='utf-8'))
output=base.parents[1]/'output/virtual-parenting/carousel-v6';output.mkdir(parents=True,exist_ok=True)
for s,r in zip(shots,records['shots'],strict=True):
    assert s['id']==r['id']
    src=pathlib.Path(r['generated_path']);assert src.is_file()
    dst=root/s['image'];shutil.copy2(src,dst);shutil.copy2(src,output/dst.name)
    s['review']={'front':'검수 미통과: 작품 보드·소품 위치 변형.','back':'검수 실패: 원본에 없는 문틀·캐비넷 형상 변화. 큐브는 연결 부품·색 순서도 다름.','detail':'생활감 개선 시험. 원본 시야/조각 배치와 정확히 일치하지 않음.'}[s['angle']]
    s['validation_status']='not-approved'
    s['variants']=[dict(title='AI 시험본 · 검수 미통과',image=s['image'],review=s['review']),dict(title='실제 3D 원본',kind='render',image=s['guide'],review='고정 Blender 형상·카메라 기준. 원본에는 아이 없음.')]
    for field in ['image','guide']:assert (root/s[field]).is_file()
    with Image.open(dst) as im:assert abs(im.width/im.height-.8)<.001;print(s['id'],im.size)
encoded=json.dumps(shots,ensure_ascii=False,indent=2)
(base/'carousel-v6-shots.json').write_text(encoded,encoding='utf-8')
(root/'carousel-v6-shots.json').write_text(encoded,encoding='utf-8')
html=(base/'carousel-v6.html').read_text(encoding='utf-8')
html=html.replace("camera.fov=current.fov_vertical;camera.position", "camera.up.fromArray(current.up||[0,1,0]);camera.fov=current.fov_vertical;camera.position")
(base/'carousel-v6.html').write_text(html,encoding='utf-8');(root/'carousel-v6.html').write_text(html,encoding='utf-8')
feed=(base/'feed-v5.html').read_text(encoding='utf-8')
if 'carousel-v6.html' not in feed:feed=feed.replace('PBR 원본 →</a></p>','PBR 원본 →</a> · <a class="download" href="carousel-v6.html">여러 각도 피드 →</a></p>')
(base/'feed-v5.html').write_text(feed,encoding='utf-8');(root/'feed-v5.html').write_text(feed,encoding='utf-8')
blob=(root/'family-home-carousel-v6.glb').read_bytes();magic,version,length=struct.unpack_from('<4sII',blob);assert magic==b'glTF' and version==2 and length==len(blob)
n,kind=struct.unpack_from('<II',blob,12);data=json.loads(blob[20:20+n]);groups=[x.get('extras',{}).get('activity_id') for x in data['nodes'] if 'activity_id' in x.get('extras',{})]
assert sorted(groups)==['cubes','tiles'];assert any(x.get('extras',{}).get('asset_id')=='study-lived-in-v6' for x in data['nodes']);assert len(data['images'])==7
print('GLB',len(data['nodes']),'nodes;',len(data['images']),'embedded maps;',groups)
ast.parse((base/'render_carousel_v6.py').read_text(encoding='utf-8'))
temp=root/'carousel-v6-check.mjs';temp.write_text(re.search(r'<script type="module">(.*?)</script>',html,re.S).group(1),encoding='utf-8')
subprocess.run(['node','--check',str(temp)],check=True)
print('CAROUSEL_VALIDATED')
