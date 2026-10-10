"""Replace two independent finale cuts with one inspected fixed-camera shot."""
import argparse,pathlib,json,hashlib,shutil,subprocess
ap=argparse.ArgumentParser();ap.add_argument('clip',type=pathlib.Path);ap.add_argument('--release',type=float,required=True);ap.add_argument('--turn',type=float,required=True);a=ap.parse_args()
repo=pathlib.Path(__file__).resolve().parents[2]
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006');out=root/'tango-turnaround';audio=root/'tango-sequence/audio'
def run(args):subprocess.run(['ffmpeg','-v','error','-y',*args],check=True)
def duration(path):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)],text=True))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
old=json.loads((root/'tango-minimax-sequence/manifest.json').read_text(encoding='utf-8'))
inputs=[];filters=[];base=root/'tango-v8/video/tango_minimax_sequence'
for i,shot in enumerate(old['shots'][:3]):
 inputs+=['-i',str(base/shot['file'])];filters.append(f'[{i}:v]setpts=(PTS-STARTPTS)/{shot["speed"]},fps=24,format=yuv420p[v{i}]')
inputs+=['-i',str(a.clip)];filters.append('[3:v]setpts=PTS-STARTPTS,fps=24,format=yuv420p[v3]')
filters.append('[v0][v1][v2][v3]concat=n=4:v=1:a=0[v]')
run([*inputs,'-filter_complex',';'.join(filters),'-map','[v]','-c:v','libx264','-crf','18','-movflags','+faststart',str(out/'silent-full.mp4')])
offset=sum(s['duration'] for s in old['shots'][:3]);length=duration(a.clip);total=duration(out/'silent-full.mp4')
shutil.copy2(a.clip,out/'fixed-camera-silent.mp4')
def add_audio(video,dest,ga,gu):
 correct=gu+duration(audio/'gu.wav');word=correct+.5;praise=word+duration(audio/'gagu.wav')
 events=[('gu.wav',gu),('correct.mp3',correct),('gagu.wav',word),('praise.mp3',praise)]
 if ga is not None:events.insert(0,('ga.wav',ga))
 inputs=[];filters=[]
 for i,(file,t) in enumerate(events):
  inputs+=['-i',str(audio/file)];filters.append(f'[{i}:a]adelay={round(t*1000)}:all=1[a{i}]')
 n=len(events);filters.append(''.join(f'[a{i}]' for i in range(n))+f'amix=inputs={n}:normalize=0,alimiter=limit=0.95,apad,atrim=duration={duration(video)}[mix]')
 wav=out/(dest.stem+'-audio.wav');run([*inputs,'-filter_complex',';'.join(filters),'-map','[mix]',str(wav)])
 run(['-i',str(video),'-i',str(wav),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(dest)])
 return [dict(file=file,time=t,duration=duration(audio/file)) for file,t in events]
events=add_audio(out/'silent-full.mp4',out/'tango-gagu-turnaround.mp4',old['placements'][1],offset+a.release)
add_audio(a.clip,out/'final-tile-smile.mp4',None,a.release)
shots=old['shots'][:3]+[dict(file=a.clip.name,start=offset,duration=a.turn,speed=1,sha256=sha(a.clip)),dict(file=a.clip.name,start=offset+a.turn,duration=length-a.turn,speed=1,sha256=sha(a.clip),continuous_with_previous=True)]
manifest=dict(shots=shots,placements=old['placements'][:3]+[offset+a.release],duration=total,audio=events,video_sha256=sha(out/'tango-gagu-turnaround.mp4'),finale_source_sha256=sha(a.clip),finale_start=offset,turn_time=offset+a.turn,kind='First three existing cuts; final tile and smile are ONE continuous fixed-camera MiniMax shot. Native phase mapping approximate.')
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
# Original native first six seconds and the new exact camera for the finale.
run(['-i',str(root/'tango-sequence/tango-gagu-3d.mp4'),'-i',str(out/'native/fixed-camera-native.mp4'),'-filter_complex','[0:v]trim=duration=6.333333,setpts=PTS-STARTPTS[v0];[1:v]setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0[v]','-map','[v]','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'native-comparison.mp4')])
for name in ('tango-minimax-sequence.html','tango-minimax-sequence-cuts.html'):shutil.copy2(repo/'scripts/virtual-parenting'/name,root/name)
workspace=repo/'output/virtual-parenting/tango-turnaround';workspace.mkdir(parents=True,exist_ok=True)
for file in ('tango-gagu-turnaround.mp4','final-tile-smile.mp4','fixed-camera-silent.mp4','manifest.json','workflow.json','prompt.txt','source-ledger.json','native-comparison.mp4'):shutil.copy2(out/file,workspace/file)
shutil.copytree(out/'keyframes',workspace/'keyframes',dirs_exist_ok=True)
(workspace/'native').mkdir(exist_ok=True)
for file in ('fixed-camera-turnaround.blend','fixed-camera-turnaround.glb','camera.json','fixed-camera-native.mp4'):shutil.copy2(out/'native'/file,workspace/'native'/file)
print(json.dumps(manifest,ensure_ascii=False))
