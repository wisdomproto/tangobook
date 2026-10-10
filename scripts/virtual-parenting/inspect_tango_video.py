"""Decode a clip and create time-labelled contact sheets for motion review."""
from pathlib import Path
import argparse,json,subprocess
from PIL import Image,ImageDraw

ap=argparse.ArgumentParser();ap.add_argument('clip',type=Path);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args();a.out.mkdir(parents=True,exist_ok=True)
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(a.clip)]))
(a.out/'probe.json').write_text(json.dumps(info,indent=2),encoding='utf-8')
subprocess.run(['ffmpeg','-v','error','-i',str(a.clip),'-f','null','-'],check=True)
subprocess.run(['ffmpeg','-v','error','-i',str(a.clip),'-vf','fps=4','-y',str(a.out/'frame-%03d.png')],check=True)
frames=sorted(a.out.glob('frame-*.png'))
for page,start in enumerate(range(0,len(frames),12),1):
 sheet=Image.new('RGB',(4*256,3*350),'#eeeeee');d=ImageDraw.Draw(sheet)
 for j,f in enumerate(frames[start:start+12]):
  im=Image.open(f).convert('RGB');im.thumbnail((256,320));x=(j%4)*256;y=(j//4)*350;sheet.paste(im,(x,y+25));d.text((x+8,y+6),f'{(start+j)/4:.2f}s',fill='black')
 sheet.save(a.out/f'contact-{page}.jpg',quality=92)
print(json.dumps({'seconds':info['format']['duration'],'frames_inspected':len(frames),'sheets':page}))
