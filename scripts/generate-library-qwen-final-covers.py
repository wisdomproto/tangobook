"""User-authorized four-cover Qwen follow-up. Candidate generation only, serial submits."""
import json, hashlib, shutil, time, urllib.request, os, subprocess
from pathlib import Path

ROOT=Path('D:/ComfyUI-output/library-clean-covers-20261006')
RUN=ROOT/'qwen-local'
WORK=Path(__file__).resolve().parents[1]
INPUT=Path('C:/ComfyUI_windows_portable/ComfyUI/input')
API='http://127.0.0.1:8190'
IDS=['1777266835789','1778555233699','1789350946295','1789350946329']

def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def save(p,v):
    tmp=Path(str(p)+'.tmp'); tmp.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8'); tmp.replace(p)
def api(path,body=None):
    data=None if body is None else json.dumps(body).encode()
    with urllib.request.urlopen(urllib.request.Request(API+path,data=data,headers={'Content-Type':'application/json'}),timeout=120) as r: return json.load(r)

def main():
    RUN.mkdir(exist_ok=True)
    lock=RUN/'worker.lock'
    with lock.open('x',encoding='utf-8') as f: f.write(str(os.getpid()))
    state={'pid':os.getpid(),'status':'running','completed':[],'ids':IDS}
    save(RUN/'status.json',state)
    try:
        plan=json.loads((ROOT/'generation-plan.json').read_text(encoding='utf-8'))
        for index,id in enumerate(IDS):
            if (RUN/f'{id}-request.json').exists(): raise RuntimeError('Existing request: reconcile history before any duplicate submission')
            if (ROOT/'generated'/f'{id}.json').exists(): raise RuntimeError('Existing generated result')
            entry=next(e for e in plan if e['id']==id)
            refs=entry['references'][-1:]
            for ref in refs:
                assert sha(ref['path'])==ref['sha256']
            filename=f'library-qwen-final-{id}.png'
            dest=INPUT/filename
            shutil.copyfile(refs[0]['path'],dest)
            prompt=('Create a fresh landscape 16:9 children\'s storybook cover illustration based on this reference. '
                'Preserve the exact character identities, clothing, faces, handmade materials, rendering style and warm color palette. '
                'Make a polished, inviting cover composition with the main characters clearly visible, gently simplify peripheral clutter and leave breathing room above them. '
                'Keep the same peaceful story scene and character count as the reference. '
                'The entire output is artwork only: absolutely no title, letters, words, numbers, typography, logos, labels, watermarks or decorative writing. '
                'Fill the complete horizontal canvas with the illustration; no borders or book mockup.')
            graph=json.loads(Path('D:/ComfyUI-output/qwen21-mermaid-test/game-rescue-simple-api.json').read_text(encoding='utf-8'))
            graph['4']['inputs']['image']=filename
            graph['10']={'class_type':'ImageScale','inputs':{'image':['4',0],'upscale_method':'lanczos','width':1024,'height':576,'crop':'disabled'}}
            graph['5']['inputs'].update(prompt=prompt,negative_prompt='text, lettering, watermark, logo, title, distorted hands, duplicate characters',resolution=0)
            graph['5']['inputs']['images.image_1']=['10',0]
            graph['7']['inputs']['seed']=2026100600+index
            graph['9']['inputs']['filename_prefix']=f'library-qwen-final/{id}'
            workflow=RUN/f'{id}-workflow.json'; save(workflow,graph)
            request={'id':id,'output':entry['output'],'kind':'alternate-representative-scene','tool':'local-qwen-image-2.1',
                'model':'qwen_image_2.1_int8_convrot.safetensors','prompt':prompt,'references':refs,
                'userAuthorization':'그럼 나머지는 qwen2.1 로 만들자.','comfyInput':filename,'comfyInputPath':str(dest),
                'workflowPath':str(workflow),'workflowSha256':sha(workflow),'status':'ready'}
            request_path=RUN/f'{id}-request.json'; save(request_path,request)
            while any(api('/queue').get(k) for k in ['queue_running','queue_pending']): time.sleep(5)
            request['status']='submitting'; save(request_path,request)
            result=api('/prompt',{'prompt':graph,'client_id':'library-qwen-final-four'})
            if result.get('node_errors'): raise RuntimeError(str(result))
            pid=result['prompt_id']; request.update(promptId=pid,status='submitted'); save(request_path,request)
            state['current']={'id':id,'promptId':pid}; save(RUN/'status.json',state)
            while True:
                history=api('/history/'+pid)
                if pid in history:
                    history_path=RUN/f'{id}-history.json'; save(history_path,history)
                    h=history[pid]
                    if h.get('status',{}).get('status_str')!='success': raise RuntimeError(str(h.get('status')))
                    assert h['prompt'][2]==graph
                    output=h['outputs']['9']['images'][0]
                    png=Path('C:/ComfyUI_windows_portable/ComfyUI/output')/output.get('subfolder','')/output['filename']
                    candidate=RUN/f'{id}.png'; shutil.copyfile(png,candidate)
                    request.update(status='generated',historyPath=str(history_path),outputSha256=sha(candidate),comfyOutput=output)
                    save(request_path,request)
                    subprocess.run(['node',str(WORK/'scripts/save-library-clean-cover.mjs'),id,str(candidate),str(request_path)],cwd=WORK,check=True)
                    state['completed'].append(id); save(RUN/'status.json',state)
                    break
                time.sleep(5)
        state['status']='all-candidates-awaiting-review'; save(RUN/'status.json',state)
    except BaseException as e:
        state.update(status='failed-needs-reconciliation',error=str(e)); save(RUN/'status.json',state); raise
    finally:
        lock.unlink(missing_ok=True)

if __name__=='__main__': main()
