"""Join inspected MiniMax shots, then add existing game sounds at observed releases."""
import argparse,json,pathlib,subprocess,shutil,hashlib
ap=argparse.ArgumentParser();ap.add_argument('--speed',type=float,default=1.5);ap.add_argument('--release',type=float,nargs=4,required=True,help='Observed placement times in each original 5.1667s shot');a=ap.parse_args()
repo=pathlib.Path(__file__).resolve().parents[2]
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out=root/'tango-minimax-sequence';clips=root/'tango-v8/video/tango_minimax_sequence';audio=root/'tango-sequence/audio'
def run(args):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*args],check=True)
def duration(p):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(p)],text=True))
inputs=[];filters=[];shots=[];offset=0
for i in range(1,6):
 prefix='grip'
 path=sorted(clips.glob(f'{prefix}-segment-{i}_*.mp4'))[-1]
 speed=a.speed if i<5 else 1
 inputs+=['-i',str(path)];filters.append(f'[{i-1}:v]setpts=(PTS-STARTPTS)/{speed},fps=24,format=yuv420p[v{i-1}]')
 d=round(duration(path)*24/speed)/24;shots.append(dict(file=path.name,start=offset,duration=d,speed=speed,sha256=hashlib.sha256(path.read_bytes()).hexdigest()));offset+=d
filters.append(''.join(f'[v{i}]' for i in range(5))+'concat=n=5:v=1:a=0[v]')
run([*inputs,'-filter_complex',';'.join(filters),'-map','[v]','-c:v','libx264','-crf','18','-movflags','+faststart',str(out/'silent.mp4')])
placements=[shots[i]['start']+a.release[i]/a.speed for i in range(4)]
ga,gu=placements[1],placements[3];correct=gu+duration(audio/'gu.wav');word=correct+.5;praise=word+duration(audio/'gagu.wav')
events=[('ga.wav',ga),('gu.wav',gu),('correct.mp3',correct),('gagu.wav',word),('praise.mp3',praise)]
inputs=[];filters=[]
for i,(file,t) in enumerate(events):
 inputs+=['-i',str(audio/file)];filters.append(f'[{i}:a]adelay={round(t*1000)}:all=1[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(5))+f'amix=inputs=5:normalize=0,alimiter=limit=0.95,apad,atrim=duration={offset}[mix]')
run([*inputs,'-filter_complex',';'.join(filters),'-map','[mix]',str(out/'game-audio.wav')])
run(['-i',str(out/'silent.mp4'),'-i',str(out/'game-audio.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out/'tango-gagu-minimax-sequence.mp4')])
manifest=dict(shots=shots,placements=placements,audio=[dict(file=f,time=t,duration=duration(audio/f)) for f,t in events],duration=duration(out/'tango-gagu-minimax-sequence.mp4'),video_sha256=hashlib.sha256((out/'tango-gagu-minimax-sequence.mp4').read_bytes()).hexdigest(),kind='MiniMax FL2VA photoreal shots using native-based imagegen endpoints; native comparison is approximate time mapping')
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copy2(repo/'scripts/virtual-parenting/tango-minimax-sequence-cuts.html',root/'tango-minimax-sequence-cuts.html')
workspace=repo/'output/virtual-parenting/tango-minimax-sequence';workspace.mkdir(parents=True,exist_ok=True)
for file in ['tango-gagu-minimax-sequence.mp4','manifest.json','source-ledger.json','native-comparison.mp4']:shutil.copy2(out/file,workspace/file)
for sub in ['keyframes','graphs']:shutil.copytree(out/sub,workspace/sub,dirs_exist_ok=True)
print(json.dumps(manifest,ensure_ascii=False))

(workspace/'native').mkdir(exist_ok=True)
for file in ['reaction-close.blend','camera.json']:shutil.copy2(out/'native'/file,workspace/'native'/file)
