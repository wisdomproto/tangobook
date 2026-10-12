"""Resumable reference-guided Qwen candidates; no uploads or automatic visual approval."""
import argparse, hashlib, json, os, shutil, time, urllib.request
from pathlib import Path

WORK=Path(__file__).resolve().parents[1]
INPUT=Path('C:/ComfyUI_windows_portable/ComfyUI/input')
COMFY_OUTPUT=Path('C:/ComfyUI_windows_portable/ComfyUI/output')
TEMPLATE=Path('D:/ComfyUI-output/qwen21-mermaid-test/game-rescue-simple-api.json')
API='http://127.0.0.1:8190'
def save(p,v):
    p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix(p.suffix+'.tmp')
    tmp.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8');tmp.replace(p)
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def api(route,body=None):
    data=None if body is None else json.dumps(body).encode()
    with urllib.request.urlopen(urllib.request.Request(API+route,data=data,headers={'Content-Type':'application/json'}),timeout=120) as r:return json.load(r)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,required=True);parser.add_argument('--prefix',default='kr-');parser.add_argument('--book');parser.add_argument('--job');parser.add_argument('--jobs',nargs='+');parser.add_argument('--version',default='v2');parser.add_argument('--limit',type=int);parser.add_argument('--skip-cast',action='store_true');parser.add_argument('--cast-only',action='store_true');parser.add_argument('--cast-version');parser.add_argument('--only-unselected',action='store_true');a=parser.parse_args()
    root=a.root.resolve();page_jobs=[j for j in read(root/'plan.json')['jobs'] if j['bookId'].startswith(a.prefix)]
    if a.job:page_jobs=[j for j in page_jobs if j['id']==a.job]
    if a.jobs:page_jobs=[j for j in page_jobs if j['id'] in a.jobs]
    if a.book:page_jobs=[j for j in page_jobs if j['bookId']==a.book]
    if a.only_unselected and (root/'selected.json').exists():
        selected={j['id'] for j in read(root/'selected.json')['images']};page_jobs=[j for j in page_jobs if j['id'] not in selected]
    jobs=[]
    for j in page_jobs:
        if not a.skip_cast and j['bookId'].startswith('en-') and not any(x['bookId']==j['bookId'] for x in jobs):
            jobs.append({**j,'id':j['bookId']+'-cast','kind':'cast'})
        jobs.append(j)
    if a.cast_only:jobs=[j for j in jobs if j.get('kind')=='cast']
    if a.limit:jobs=jobs[:a.limit]
    run=root/('qwen-'+a.version+('-english' if a.prefix.startswith('en') else ''));run.mkdir(exist_ok=True)
    overrides=read(root/'prompt-overrides.json') if (root/'prompt-overrides.json').exists() else {}
    with (run/'worker.lock').open('x') as f:f.write(str(os.getpid()))
    state={'pid':os.getpid(),'status':'running','expected':len(jobs),'completed':[]};save(run/'status.json',state)
    try:
        for index,j in enumerate(jobs):
            receipt=run/(j['id']+'.json');dest=root/('candidates-'+a.version)/(j['id']+'.png')
            if receipt.exists() and read(receipt).get('status')=='generated':
                assert dest.exists() and sha(dest)==read(receipt)['sha256'];state['completed'].append(j['id']);continue
            request=read(receipt) if receipt.exists() else None
            if request and request.get('status')=='submitting':raise RuntimeError('Ambiguous submission; reconcile Comfy history before retry')
            if not request:
                refs=j['references'][:2]
                native_en=j['bookId'].startswith('en-')
                is_cast=j.get('kind')=='cast'
                if native_en and j['id'] not in overrides:
                    if is_cast:
                        # English books have no existing identity images. Using the
                        # Korean action scene here copied an unrelated baby tiger.
                        refs=[]
                    else:
                        sheet=root/('candidates-'+(a.cast_version or a.version))/(j['bookId']+'-cast.png')
                        assert sheet.exists(),'Character reference must be generated first'
                        review=read(root/'visual-review.json') if (root/'visual-review.json').exists() else {}
                        assert review.get(j['bookId']+'-cast',{}).get('sha256')==sha(sheet) and review[j['bookId']+'-cast']['status']=='pass','Cast must pass visual review before page generation'
                        refs=[{'path':str(sheet),'sha256':sha(sheet),'role':'Same book character identities and rendering'}]
                assert refs or (native_en and is_cast) or j['id'] in overrides, 'A real character/style reference is required before generating '+j['id']
                # Actual same-book illustrations outrank stale seeded cast metadata.
                prompt=("Create ONE new landscape 16:9 preschool story illustration. The reference images define the exact same individual characters, felt materials, colours and world. "
                    "Preserve their face, markings, clothing and relative sizes; do not copy the reference pose. "
                    "Use soft photographed handmade needle-felt textures, expressive friendly eyes, readable faces, warm daylight and a clear story composition. "
                    "Illustrate THIS new page faithfully: "+j['text']+"\nAuthoritative page scene: "+j['scene']+
                    "\nThe output is a single full-bleed illustration. No page layout, panels, speech bubbles, subtitles, dialogue, labels, watermark or border. "
                    "Only the isolated teaching letter glyphs expressly required by the scene may appear, correctly formed; do not write the narration in the image.")
                if native_en:
                    cast='\n'.join(c['name']+': '+c.get('descriptionEn',c.get('description','')) for c in j['characters'])
                    if is_cast:
                        prompt=("Photographed handmade soft needle-felt wool animal toys with warm colours, visible wool fibres and preschool toy proportions, matching this book's felt picture-book art style. "
                            "Create these different named characters together, one full body view of each, spaced apart on a plain warm cream background. "
                            "Do not copy the reference tigers into characters of other species. Designs must follow these source descriptions exactly:\n"+cast+
                            "\nSoft rounded animal bodies, expressive friendly eyes, no human muscles, exactly two eyes per face. No lettering, names, captions or scenery. Landscape 16:9.")
                    else:
                        prompt=("Transform this character reference into a completely NEW landscape felt picture-book SCENE, not a character sheet. Replace the plain cream background with a lush green wool woodland and grass. Change all poses to illustrate this page literally: "+j['text']+
                            " Show the page's exact objects and action clearly. Keep the exact faces, coats, markings and accessories only for named characters actually appearing in this page; omit unneeded cast. The mouse is tiny, about knee height to the tiger. "
                            "One full landscape scene, expressive friendly faces, soft wool texture and warm daylight. No words, captions, dialogue, speech bubbles, labels, symbols, watermark or borders. Do not copy the reference poses or plain background.")
                if j['id'] in overrides:
                    override=overrides[j['id']]
                    prompt=override['prompt']
                    refs=[{'path':str(root/'references/cast'/name),'sha256':sha(root/'references/cast'/name)} for name in override['references']]
                if (root/'rendering-style.json').exists():
                    style=read(root/'rendering-style.json');assert style['id']==j['artStyle']
                    prompt=style['prompt']+'. '+prompt
                graph=read(TEMPLATE);graph.pop('4',None)
                for k in list(graph['5']['inputs']):
                    if k.startswith('images.'):del graph['5']['inputs'][k]
                for n,ref in enumerate(refs,1):
                    src=Path(ref['path']);src=src if src.is_absolute() else WORK/src
                    assert sha(src)==ref['sha256']
                    filename=f"phonics-fill-{j['id']}-ref{n}.webp";shutil.copyfile(src,INPUT/filename)
                    load=str(20+n);scale=str(40+n)
                    graph[load]={'class_type':'LoadImage','inputs':{'image':filename}}
                    graph[scale]={'class_type':'ImageScale','inputs':{'image':[load,0],'upscale_method':'lanczos','width':1024,'height':576,'crop':'disabled'}}
                    graph['5']['inputs'][f'images.image_{n}']=[scale,0]
                graph['5']['inputs'].update(prompt=prompt,negative_prompt='speech bubbles, captions, subtitles, page numbers, watermark, extra eyes, human muscles, inconsistent characters',resolution=0)
                graph['7']['inputs'].update(seed=2026101200+index,steps=25)
                if not refs:
                    graph['10']={'class_type':'EmptySD3LatentImage','inputs':{'width':1024,'height':576,'batch_size':1}}
                    graph['7']['inputs']['latent_image']=['10',0]
                graph['9']['inputs']['filename_prefix']='phonics-missing-20261012/'+a.version+'/'+j['id']
                request={'id':j['id'],'sourceSha256':j['sourceSha256'],'references':refs,'prompt':prompt,'graph':graph,'status':'ready','model':'local Qwen-Image-2.1'};save(receipt,request)
            if request['status']=='ready':
                while any(api('/queue').get(k) for k in ('queue_running','queue_pending')):time.sleep(5)
                request['status']='submitting';save(receipt,request)
                response=api('/prompt',{'prompt':request['graph'],'client_id':'phonics-missing-assets'})
                assert not response.get('node_errors'),response
                request.update(promptId=response['prompt_id'],status='submitted');save(receipt,request)
            pid=request['promptId']
            while True:
                h=api('/history/'+pid)
                if pid not in h:time.sleep(5);continue
                h=h[pid];assert h['status']['status_str']=='success',h['status']
                assert h['prompt'][2]==request['graph'];save(run/(j['id']+'-history.json'),h)
                out=h['outputs']['9']['images'][0];src=COMFY_OUTPUT/out.get('subfolder','')/out['filename']
                dest.parent.mkdir(exist_ok=True);shutil.copyfile(src,dest)
                request.update(status='generated',file=str(dest),sha256=sha(dest));save(receipt,request)
                state['completed'].append(j['id']);save(run/'status.json',state)
                print('GENERATED '+j['id']+' awaiting visual review',flush=True);break
            if (run/'stop-after-current.request').exists():
                state['status']='stopped-after-current';save(run/'status.json',state);return
        state['status']='awaiting-visual-review';save(run/'status.json',state)
    except BaseException as e:
        state.update(status='failed',error=str(e));save(run/'status.json',state);raise
    finally:(run/'worker.lock').unlink(missing_ok=True)

if __name__=='__main__':main()
