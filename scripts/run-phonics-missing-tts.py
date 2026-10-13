"""Wait for the explicit image workers, release Comfy models, then run native EN TTS.

Keeps generation, two independent CPU audits, and source-preserving registration
logs under the audio root. Does not approve low-score narration or image assets.
"""
import argparse, json, subprocess, sys, time, urllib.request
from pathlib import Path

WORK=Path(__file__).resolve().parents[1]

def save(path,value):
 temp=path.with_suffix('.tmp');temp.write_text(json.dumps(value,indent=2),encoding='utf8');temp.replace(path)

def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--wait-for',type=Path,action='append',default=[]);p.add_argument('--reuse-followers',action='store_true');a=p.parse_args()
 a.root.mkdir(exist_ok=True,parents=True);statepath=a.root/'pipeline-state.json'
 previous=json.loads(statepath.read_text(encoding='utf8')) if statepath.exists() else {}
 state={'status':'waiting-for-image-workers','waitFor':[str(x) for x in a.wait_for]};save(statepath,state)
 while any(json.loads(x.read_text(encoding='utf8'))['status']=='running' for x in a.wait_for):time.sleep(5)
 for x in a.wait_for:
  s=json.loads(x.read_text(encoding='utf8'));assert s['status'] in ('awaiting-visual-review','stopped-after-current'),s
 with urllib.request.urlopen('http://127.0.0.1:8190/queue',timeout=30) as r:q=json.load(r)
 assert not q['queue_running'] and not q['queue_pending'],'Comfy queue is not idle; do not unload another job'
 req=urllib.request.Request('http://127.0.0.1:8190/free',data=json.dumps({'unload_models':True,'free_memory':True}).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=90) as r:assert r.status==200
 time.sleep(3)
 logs=[];children={}
 def launch(name,command):
  log=(a.root/(name+'.log')).open('a',encoding='utf8');logs.append(log)
  child=subprocess.Popen(command,cwd=WORK,stdout=log,stderr=subprocess.STDOUT,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0));children[name]=child
  return child
 generator=launch('generation',[sys.executable,'-X','utf8','scripts/library-missing-tts.py','generate','--root',str(a.root),'--follow'])
 while not (a.root/'generate-job.json').exists():
  assert generator.poll() is None,'Generator exited before its state was written';time.sleep(1)
 launch('primary-audit',[sys.executable,'-X','utf8','scripts/changjak-voicebox-audit.py','--root',str(a.root),'--follow'])
 if not a.reuse_followers:
  launch('secondary-audit',[sys.executable,'-X','utf8','scripts/library-missing-tts-secondary-audit.py','--root',str(a.root),'--follow'])
  launch('registration',['node','scripts/library-missing-tts-register.mjs','apply','--root='+str(a.root),'--native-english','--follow'])
 pids={k:v for k,v in previous.get('pids',{}).items() if a.reuse_followers and k in ('secondary-audit','registration')}
 pids.update({k:c.pid for k,c in children.items()})
 state.update(status='running',startedAt=time.time(),pids=pids,reusedFollowers=a.reuse_followers);save(statepath,state);print(json.dumps(state),flush=True)
 while any(c.poll() is None for c in children.values()):
  exits={k:c.poll() for k,c in children.items() if c.poll() is not None}
  state.update(exits=exits,updatedAt=time.time());save(statepath,state)
  if any(code!=0 for code in exits.values()):
   state.update(status='needs-attention');save(statepath,state)
   print(json.dumps(state),flush=True);return
  time.sleep(15)
 state.update(status='complete' if (a.root/'registration/complete.json').exists() else 'needs-attention',exits={k:c.returncode for k,c in children.items()},finishedAt=time.time());save(statepath,state)
 print(json.dumps(state),flush=True)

if __name__=='__main__':main()
