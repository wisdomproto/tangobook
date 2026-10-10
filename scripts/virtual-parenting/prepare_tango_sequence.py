"""Mix existing game sounds and encode native frames; publish local review HTML."""
import json, pathlib, subprocess, hashlib, shutil
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out=root/'tango-sequence';audio=out/'audio'
def run(args):subprocess.run(args,check=True)
def duration(path):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)],text=True).strip())
for key in ['ga','gu']:
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(audio/f'{key}.mp3'),str(audio/f'{key}.wav')])
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(audio/'ga.wav'),'-i',str(audio/'gu.wav'),'-filter_complex','[0:a][1:a]concat=n=2:v=0:a=1[a]','-map','[a]',str(audio/'gagu.wav')])
record=json.loads((out/'sequence.json').read_text(encoding='utf-8'))
correct_time=7.2+duration(audio/'gu.wav');word_time=correct_time+.5
praise_time=word_time+duration(audio/'gagu.wav')
events=[('ga.wav',3.4),('gu.wav',7.2),('correct.mp3',correct_time),('gagu.wav',word_time),('praise.mp3',praise_time)]
record['audio']=[dict(file=f,time=t,duration=duration(audio/f)) for f,t in events]
record['game_sources']=['KoreanBlockPlayer.tsx: completed syllable','useGameAudio.ts: final syllable -> correct effect -> 500ms -> word -> Korean praise','phonics-library.service.ts: Korean syllables concatenate with zero gap']
inputs=[];filters=[]
for i,(file,t) in enumerate(events):
    inputs+=['-i',str(audio/file)]
    filters.append(f'[{i}:a]adelay={round(t*1000)}:all=1[a{i}]')
filters.append(''.join(f'[a{i}]' for i in range(len(events)))+'amix=inputs=5:normalize=0,alimiter=limit=0.95,apad,atrim=duration=14[mix]')
run(['ffmpeg','-hide_banner','-loglevel','error','-y',*inputs,'-filter_complex',';'.join(filters),'-map','[mix]',str(audio/'sequence.wav')])
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','24','-start_number','1','-i',str(out/'frames/frame-%04d.png'),'-i',str(audio/'sequence.wav'),'-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-t','14',str(out/'tango-gagu-3d.mp4')])
record['video_sha256']=hashlib.sha256((out/'tango-gagu-3d.mp4').read_bytes()).hexdigest()
(out/'sequence.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
src=pathlib.Path(__file__).with_name('tango-sequence.html')
shutil.copy2(src,root/src.name)
workspace=pathlib.Path(__file__).resolve().parents[2]/'output/virtual-parenting/tango-sequence'
workspace.mkdir(parents=True,exist_ok=True)
for file in ['tango-gagu-3d.mp4','sequence.json','frame-001.png','frame-265.png']:
    shutil.copy2(out/file,workspace/file)
print(json.dumps(record['audio'],ensure_ascii=False))
