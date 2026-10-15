import json,pathlib,subprocess,hashlib
import numpy as np,soundfile as sf
p=pathlib.Path('D:/tangobook-video/classic-bgm-20261015/selection/quality.json');d=json.loads(p.read_text(encoding='utf-8'))
for t in d['items']:
 x,sr=sf.read(t['pcm']);n=sr//4;rms=np.sqrt(np.mean(x[:len(x)//n*n].reshape(-1,n)**2,axis=1));idx=np.where(rms>10**(-48/20))[0]
 if not len(idx):raise ValueError(t['id'])
 trim=min(len(x)/sr,(idx[-1]+1)/4+.35)
 if len(x)/sr-trim<1:continue
 before=t['duration'];subprocess.run(['ffmpeg','-v','error','-i',t['source'],'-t',str(trim),'-af',f'loudnorm=I=-22:TP=-3:LRA=7,afade=t=in:d=0.15,afade=t=out:st={trim-.2}:d=0.2','-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','160k','-y',t['file']],check=True)
 subprocess.run(['ffmpeg','-v','error','-i',t['file'],'-ac','1','-ar','16000','-y',t['pcm']],check=True)
 x,sr=sf.read(t['pcm']);frames=x[:len(x)//n*n].reshape(-1,n);db=20*np.log10(np.maximum(np.sqrt(np.mean(frames*frames,axis=1)),1e-7))
 t.update(duration=round(len(x)/sr,3),peakDb=round(float(20*np.log10(max(abs(x).max(),1e-7))),2),rmsRangeDb=round(float(np.percentile(db,95)-np.percentile(db,10)),2),silenceFraction=round(float((db<-50).mean()),4),sha256=hashlib.sha256(pathlib.Path(t['file']).read_bytes()).hexdigest(),bytes=pathlib.Path(t['file']).stat().st_size,trimmedTrailingSilenceSeconds=round(before-len(x)/sr,3))
 print(t['id'],before,'->',t['duration'],flush=True)
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf-8')
