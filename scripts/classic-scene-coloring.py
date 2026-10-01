"""Read-only inventory and resumable local Qwen scene coloring production."""
import concurrent.futures, json, pathlib, urllib.request, urllib.parse, time, hashlib, argparse, shutil, re, subprocess, importlib.util, os
quality_spec=importlib.util.spec_from_file_location('classic_quality',pathlib.Path(__file__).with_name('classic-coloring-quality.py'))
quality=importlib.util.module_from_spec(quality_spec);quality_spec.loader.exec_module(quality)

ROOT = pathlib.Path(os.environ.get('SCENE_COLORING_ROOT','D:/ComfyUI-output/classic-scene-coloring'))
CATEGORY = os.environ.get('SCENE_COLORING_CATEGORY','세계 명작')
API = 'https://www.tangobook.co.kr'
COMFY = os.environ.get('CLASSIC_COLORING_COMFY_URL','http://127.0.0.1:8189').rstrip('/')
SELECTION = {
 '개구리 왕자':[3,8], '개미와 베짱이':[3,14], '거인의 정원':[4,10],
 '걸리버 여행기':[3,11], '구둣방 할아버지와 꼬마 요정':[10,14],
 '금발 머리 소녀와 곰 세 마리':[4,14], '눈의 여왕':[11,13],
 '늑대와 일곱 마리 아기 염소':[4,12], '라푼젤':[8,14], '미운 아기 오리':[2,13],
 '백설공주':[7,9], '백조 왕자':[4,14], '백조의 호수':[3,6], '보물섬':[2,10],
 '북풍과 태양':[7,12], '브레멘 음악대':[8,11], '빨간 구두':[3,13],
 '빨간머리 앤':[4,8], '빨간모자':[4,11], '생강빵 아이':[2,11],
 '성냥갑 병정':[6,14], '성냥팔이 소녀':[5,9], '소공녀':[1,9],
 '신데렐라':[6,9], '신밧드의 모험':[6,14], '아기 돼지 삼형제':[4,12],
 '알라딘과 요술 램프':[5,9], '어린 왕자':[4,12], '엄지 아가씨':[2,13],
 '오즈의 마법사':[8,10], '우당탕탕 염소 삼 형제':[3,15],
 '이상한 나라의 앨리스':[1,8], '인어 공주':[1,4], '잠자는 숲속의 공주':[2,13],
 '잭과 콩나무':[5,8], '정글북':[4,15], '커다란 순무':[10,14],
 '키다리 아저씨':[8,14], '토끼와 거북이':[9,15], '파랑새':[4,13],
 '플란다스의 개':[4,14], '피노키오':[9,13], '피리 부는 사나이':[6,11],
 '피터와 늑대':[3,12], '하이디':[4,11], '행복한 왕자':[2,5],
 '헨젤과 그레텔':[6,9], '호두까기 인형':[2,10],
}
if os.environ.get('SCENE_COLORING_SELECTION'):
    SELECTION=json.loads(pathlib.Path(os.environ['SCENE_COLORING_SELECTION']).read_text(encoding='utf-8'))
PROMPT_VERSION = 'v5-white-interiors'
PROMPT = '''PURE BLACK AND WHITE coloring line art only. Every face, hand, skin area, hair, beard, garment and animal body must be PURE WHITE inside BLACK outlines. No original colors may remain.
Convert the reference scene into a SIMPLE coloring page. Keep the EXACT original main characters, face designs, expressions, proportions, poses and positions. Preserve the same story action. Do not redesign their faces into generic cartoons.
Keep only the main characters and essential large objects. Remove all tiny details and secondary background objects. Mostly empty WHITE background. Hair and clothes are large WHITE enclosed shapes. Hair has only three broad locks. No black filled hair, patterns, jewelry, fine folds or texture.
Use smooth bold BLACK outlines and continuous CLOSED boundaries. About 15 to 25 large coloring areas. No color, gray or shading. Keep the reference composition. The result must show the original story action clearly.'''
COLOR_PROMPT = '''Convert this exact drawing into PURE BLACK AND WHITE coloring line art. REMOVE ALL COLORS completely. Every face, hand, skin area, hair area, beard, garment, shoe, animal body and background must be PURE WHITE inside BLACK outlines. Replace black filled hair and beard with white enclosed silhouettes. Keep eye pupils black. Preserve the same characters, faces, hands, poses, proportions, positions and every important existing boundary. Do not move or enlarge anything. No extra detail. Do not use gray fills or shading. WHITE INTERIORS AND BLACK CONTOURS ONLY.'''

def request(url, body=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
                                headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=120) as response:
        return json.load(response)

def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
    temporary.replace(path)
    if path.name=='manifest.json':
        template=pathlib.Path(__file__).with_name('classic-scene-coloring-gallery.html')
        if template.exists():
            html=template.read_text(encoding='utf-8').replace('__MANIFEST__',json.dumps(value,ensure_ascii=False).replace('<','\\u003c'))
            gallery=ROOT/'index.html';tmp=ROOT/'index.html.tmp';tmp.write_text(html,encoding='utf-8');tmp.replace(gallery)

def inventory():
    ROOT.mkdir(parents=True, exist_ok=True)
    books = [b for b in request(API+'/api/storybooks')['data'] if b.get('category') == CATEGORY]
    def get_book(b):
        path = ROOT/'books'/(str(b['id'])+'.json')
        if path.exists(): return json.loads(path.read_text(encoding='utf-8'))
        book = request(API+'/api/storybooks/'+str(b['id']))['data']
        save(path, book)
        return book
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        full = list(pool.map(get_book, books))
    save(ROOT/'inventory.json', full)
    lines=[]
    for b in sorted(full,key=lambda b:b['title']):
        lines.append('\n'+b['title']+' | '+str(b['id']))
        for p in b.get('pages',[]):
            if p.get('illustrationUrl'):
                lines.append(str(p['pageNumber'])+': '+p.get('text','').replace('\n',' ')[:260])
    (ROOT/'page-texts.txt').write_text('\n'.join(lines), encoding='utf-8')
    print(json.dumps({'books':len(full),'illustratedPages':sum(bool(p.get('illustrationUrl')) for b in full for p in b.get('pages',[]))},ensure_ascii=False))

def prepare():
    books = json.loads((ROOT/'inventory.json').read_text(encoding='utf-8'))
    jobs=[]
    for b in sorted(books,key=lambda b:b['title']):
        title = re.sub(r'_그림체[123]$', '', b['title'])
        if title not in SELECTION and os.environ.get('SCENE_COLORING_PARTIAL_SELECTION') == '1':
            continue
        for number in SELECTION[title]:
            # p6-p8 are absent in this book; p5 retains the dwarf-home context.
            if b['title']=='백설공주_그림체2' and number==7:number=5
            p = next(p for p in b['pages'] if p['pageNumber']==number)
            if not p.get('illustrationUrl'): raise ValueError(f'Missing original: {b["title"]} p{number}')
            key=f'{b["id"]}-p{number:02}'
            jobs.append({'key':key,'bookId':str(b['id']),'title':b['title'],'artStyle':b.get('artStyle'),'collection':os.environ.get('SCENE_COLORING_COLLECTION') or ('traditional' if CATEGORY=='전래 동화' else 'classic'),
              'pageNumber':number,'originalUrl':p['illustrationUrl'],'text':p.get('text',''),
              'ttsUrl':p.get('ttsUrl'),'translations':p.get('translations',{}),
              'backgroundMusicUrl':b.get('backgroundMusicUrl') or f'{API}/sounds/bgm/default-1.mp3',
              'sourceFile':f'sources/{key}.png','lineartFile':f'lineart/{key}.png',
              'selectionReason':'이야기의 주요 행동·소품 또는 변화가 드러나는 서로 다른 두 장면',
              'status':'pending'})
    old={j['key']:j for j in json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))} if (ROOT/'manifest.json').exists() else {}
    for j in jobs:
        if j['key'] in old: j.update(old[j['key']])
    save(ROOT/'manifest.json',jobs)
    from PIL import Image
    def download(j):
        dest=ROOT/j['sourceFile'];dest.parent.mkdir(parents=True,exist_ok=True)
        if not dest.exists():
            url=urllib.parse.quote(j['originalUrl'],safe=':/%?=&')
            for attempt in range(4):
                try:
                    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':API+'/'})
                    with urllib.request.urlopen(req,timeout=120) as r:
                        import io
                        im=Image.open(io.BytesIO(r.read())).convert('RGB');im.save(dest)
                    break
                except Exception as error:
                    if attempt==3:raise RuntimeError(f'{j["key"]}: {url}: {error}') from error
                    time.sleep(2+attempt)
        j['sourceSha256']=hashlib.sha256(dest.read_bytes()).hexdigest()
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(download,jobs))
    current={j['key']:j for j in json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))}
    for j in jobs:
        source_hash=j['sourceSha256'];j.update(current.get(j['key'],{}));j['sourceSha256']=source_hash
    save(ROOT/'manifest.json',jobs)
    print(f'Prepared {len(jobs)} original scenes',flush=True)

def remove_color(j,jobs):
    dest=ROOT/j['lineartFile']
    for attempt in range(j.get('colorRepairAttempts',0),3):
        if j['status']=='color-repairing':
            pid=j['promptId']
        else:
            archive=ROOT/'revisions'/'color-removal'/j['key']/str(attempt)
            archive.mkdir(parents=True,exist_ok=True)
            for folder,extension in [('lineart','.png'),('workflows','.json'),('history','.json')]:
                old=ROOT/folder/(j['key']+extension)
                if old.exists():shutil.copyfile(old,archive/(folder+extension))
            save(archive/'job.json',j)
            g=json.loads((ROOT/'workflows'/(j['key']+'.json')).read_text(encoding='utf-8'))
            name=f'classic-monochrome-{j["key"]}-{attempt}.png'
            shutil.copyfile(dest,pathlib.Path('C:/ComfyUI_windows_portable/ComfyUI/input')/name)
            g['4']['inputs']['image']=name;g['5']['inputs']['prompt']=COLOR_PROMPT
            g['7']['inputs']['seed']+=10000+attempt
            g['9']['inputs']['filename_prefix']='classic-scene-coloring-monochrome/'+j['key']
            save(ROOT/'workflows'/(j['key']+'.json'),g)
            pid=request(COMFY+'/prompt',{'prompt':g,'client_id':'classic-color-removal'})['prompt_id']
            j['promptId']=pid;j['promptEndpoint']=COMFY;j['status']='color-repairing';save(ROOT/'manifest.json',jobs)
        print('REMOVE COLOR',j['title'],j['pageNumber'],attempt+1,pid,flush=True)
        start=time.monotonic()
        while True:
            time.sleep(3);history=request(COMFY+'/history/'+pid)
            if pid not in history:
                if time.monotonic()-start>1800:raise TimeoutError(pid)
                continue
            h=history[pid]
            if h['status']['status_str']!='success':raise RuntimeError(h['status'])
            save(ROOT/'history'/(j['key']+'.json'),h)
            save(ROOT/'workflows'/(j['key']+'.json'),h['prompt'][2])
            with urllib.request.urlopen(COMFY+'/view?'+urllib.parse.urlencode(h['outputs']['9']['images'][0]),timeout=120) as r:dest.write_bytes(r.read())
            j['lineartSha256']=hashlib.sha256(dest.read_bytes()).hexdigest()
            j['colorRepairAttempts']=attempt+1
            j['colorCheck']=quality.color_report(dest)
            j['status']='generated' if j['colorCheck']['monochromePassed'] else 'color-repair-needed'
            save(ROOT/'manifest.json',jobs)
            if j['status']=='generated':return
            break
    j['status']='needs-monochrome-review';save(ROOT/'manifest.json',jobs)
    raise RuntimeError('Color remained after three Qwen corrections: '+j['key'])

def generate(limit=None):
    jobs=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
    template=json.loads(pathlib.Path('D:/ComfyUI-output/qwen21-mermaid-test/game-rescue-simple-api.json').read_text(encoding='utf-8'))
    books={str(b['id']):b for b in json.loads((ROOT/'inventory.json').read_text(encoding='utf-8'))}
    finished=0
    for j in jobs:
        j['sourceSha256']=hashlib.sha256((ROOT/j['sourceFile']).read_bytes()).hexdigest()
        if j['status']=='generated' and (ROOT/j['lineartFile']).exists():
            j['colorCheck']=quality.color_report(ROOT/j['lineartFile'])
            if not j['colorCheck']['monochromePassed']:j['status']='color-repair-needed'
    save(ROOT/'manifest.json',jobs)
    ordered=sorted(jobs,key=lambda j:(0 if j['status'] in ['color-repair-needed','color-repairing'] else 1,0 if j.get('colorPriority') else 1))
    for j in ordered:
        dest=ROOT/j['lineartFile']
        if j['status']=='generated' and dest.exists():continue
        if j['status']=='waiting-original-server':continue
        if j['status']=='needs-monochrome-review':raise RuntimeError('Manual review required: '+j['key'])
        if j['status'] in ['color-repair-needed','color-repairing']:
            remove_color(j,jobs)
            subprocess.run(['node','--import','./packages/server/node_modules/tsx/dist/loader.mjs','scripts/audit-classic-coloring.mts',j['key']],cwd=pathlib.Path(__file__).resolve().parent.parent,check=True)
            continue
        if limit is not None and finished>=limit:break
        # Submit only one job at a time; never interrupt or free other sessions' models.
        while True:
            queue=request(COMFY+'/queue')
            if not queue['queue_running'] and not queue['queue_pending']:break
            time.sleep(5)
        source=ROOT/j['sourceFile']; name='classic-coloring-'+j['key']+'.png'
        shutil.copyfile(source,pathlib.Path('C:/ComfyUI_windows_portable/ComfyUI/input')/name)
        g=json.loads(json.dumps(template))
        g['4']['inputs']['image']=name
        page=next(p for p in books[j['bookId']]['pages'] if p['pageNumber']==j['pageNumber'])
        identity=page.get('scene_structure',{}).get('characters_en') or page.get('scene_description_en','')[:350]
        action=page.get('scene_description_en','')[:500]
        scene_prompt='EXACT SCENE TO PRESERVE: '+identity+'. '+action+' All main characters described here must appear. Animals and insects must stay the original species.\n'+PROMPT
        if os.environ.get('SCENE_COLORING_IMAGE_ONLY') == '1':
            scene_prompt='Trace only what is visible in the reference image. Keep its EXACT character count, species, faces, poses, essential objects, image positions and proportions. Do not invent other characters from the story title or text.\n'+PROMPT
        if j['title'].startswith('개구리 왕자_') and j['pageNumber']==8:
            scene_prompt += '\nAt this dining scene, keep the princess and frog, two PLAIN chair backs, ONE plain table edge and ONE large plain oval plate containing ONE simple food shape. Remove every other plate, goblet, bowl, fruit, decoration and background object.'
        g['5']['inputs']['prompt']=scene_prompt
        g['7']['inputs']['seed']=int(hashlib.sha256(j['key'].encode()).hexdigest()[:8],16)
        g['9']['inputs']['filename_prefix']='classic-scene-coloring/'+j['key']
        save(ROOT/'workflows'/(j['key']+'.json'),g)
        start=time.monotonic()
        # Recover submitted work after interruption instead of queueing duplicate images.
        pid=j.get('promptId') if j['status']=='generating' else None
        if not pid:
            pid=request(COMFY+'/prompt',{'prompt':g,'client_id':'classic-scene-coloring'})['prompt_id']
        j['promptId']=pid;j['promptEndpoint']=COMFY;j['status']='generating';j['promptVersion']=PROMPT_VERSION;save(ROOT/'manifest.json',jobs)
        print('START',j['title'],j['pageNumber'],pid,flush=True)
        while True:
            time.sleep(3)
            history=request(COMFY+'/history/'+pid)
            if pid in history:
                h=history[pid];save(ROOT/'history'/(j['key']+'.json'),h)
                save(ROOT/'workflows'/(j['key']+'.json'),h['prompt'][2])
                if h['status']['status_str']!='success':
                    j['status']='failed';save(ROOT/'manifest.json',jobs);raise RuntimeError(h['status'])
                output=h['outputs']['9']['images'][0]
                url=COMFY+'/view?'+urllib.parse.urlencode(output)
                dest.parent.mkdir(parents=True,exist_ok=True)
                with urllib.request.urlopen(url,timeout=120) as r:dest.write_bytes(r.read())
                j['status']='generated';j['seconds']=round(time.monotonic()-start,2)
                j['lineartSha256']=hashlib.sha256(dest.read_bytes()).hexdigest()
                j['colorCheck']=quality.color_report(dest)
                if not j['colorCheck']['monochromePassed']:j['status']='color-repair-needed'
                save(ROOT/'manifest.json',jobs)
                if j['status']=='color-repair-needed':remove_color(j,jobs)
                finished+=1
                subprocess.run(['node','--import','./packages/server/node_modules/tsx/dist/loader.mjs','scripts/audit-classic-coloring.mts',j['key']],cwd=pathlib.Path(__file__).resolve().parent.parent,check=True)
                if os.environ.get('SCENE_COLORING_SYNC_PREVIEW')=='1':
                    subprocess.run(['node','scripts/sync-scene-coloring-preview.mjs'],cwd=pathlib.Path(__file__).resolve().parent.parent,check=True)
                print('DONE',sum(x['status']=='generated' for x in jobs),'/',len(jobs),j['key'],j['seconds'],flush=True)
                break
            if time.monotonic()-start>1800:raise TimeoutError(pid)

def revise_first():
    jobs=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
    for j in jobs[:6]:
        p=ROOT/j['lineartFile']
        if p.exists():
            backup=ROOT/'revisions'/(j['key']+'-v1.png');backup.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,backup)
        j['status']='pending';j['revision']=2
    save(ROOT/'manifest.json',jobs)
    generate(6)

if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('command',choices=['inventory','prepare','generate','revise-first']);p.add_argument('--limit',type=int);args=p.parse_args()
    {'inventory':inventory,'prepare':prepare,'generate':lambda:generate(args.limit),'revise-first':revise_first}[args.command]()
