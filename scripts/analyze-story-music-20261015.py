import json,pathlib,subprocess,hashlib,math
import numpy as np
import soundfile as sf
root=pathlib.Path.cwd(); out=pathlib.Path('D:/tangobook-video/classic-bgm-20261015/selection'); d=json.loads((root/'docs/audio/classic-bgm-20261015/library-generation.json').read_text(encoding='utf-8')); inv=json.loads((out/'inventory.json').read_text(encoding='utf-8'))
items=[]
for s in d['sets']:
 for t in s['tracks']:
  if t.get('download'):
   items.append(dict(id=s['id']+'-'+t['role'],setId=s['id'],genre=s['genre'],title=t['title'],source=t['download']['path'],sourceUrl=t['download']['url'],kind='new',role=t['role']))
for t in inv['library']:
 if t.get('localFile'):items.append(dict(id=t['id'],title=t['title'],source=t['localFile'],sourceUrl=t['url'],kind='legacy',genre='classic'))
for n,t in enumerate(items):
 target=out/'normalized'/(t['id']+'.mp3');target.parent.mkdir(exist_ok=True)
 if not target.exists():subprocess.run(['ffmpeg','-v','error','-i',t['source'],'-af','loudnorm=I=-22:TP=-3:LRA=7,afade=t=in:d=0.15','-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','160k','-y',str(target)],check=True)
 pcm=out/'analysis'/ (t['id']+'.wav');pcm.parent.mkdir(exist_ok=True)
 subprocess.run(['ffmpeg','-v','error','-i',str(target),'-ac','1','-ar','16000','-y',str(pcm)],check=True)
 x,sr=sf.read(pcm);frames=x[:len(x)//(sr//4)*(sr//4)].reshape(-1,sr//4);rms=np.sqrt(np.mean(frames*frames,axis=1));db=20*np.log10(np.maximum(rms,1e-7));
 t.update(file=str(target),pcm=str(pcm),duration=round(len(x)/sr,3),peakDb=round(float(20*np.log10(max(abs(x).max(),1e-7))),2),rmsRangeDb=round(float(np.percentile(db,95)-np.percentile(db,10)),2),silenceFraction=round(float((db<-50).mean()),4),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),sourceSha256=hashlib.sha256(pathlib.Path(t['source']).read_bytes()).hexdigest(),bytes=target.stat().st_size)
 print(t['id'],t['duration'],t['peakDb'],t['silenceFraction'],flush=True)
(out/'quality.json').write_text(json.dumps(dict(items=items),ensure_ascii=False,indent=2),encoding='utf-8')
