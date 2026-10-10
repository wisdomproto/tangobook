"""Decode, sample and preserve the right-arm trial; never auto-approve anatomy."""
import argparse,pathlib,json,subprocess,hashlib,shutil
from PIL import Image,ImageDraw
ap=argparse.ArgumentParser();ap.add_argument('clip',type=pathlib.Path);a=ap.parse_args()
repo=pathlib.Path(__file__).resolve().parents[2];root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006');out=root/'tango-right-arm'
shutil.copy2(a.clip,out/'ai.mp4')
subprocess.run(['ffmpeg','-v','error','-i',str(out/'ai.mp4'),'-f','null','-'],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out/'ai.mp4')]))
review=out/'review-ai';review.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(out/'ai.mp4'),'-vf','fps=8','-frames:v','42',str(review/'frame-%03d.png')],check=True)
files=list(sorted(review.glob('frame-*.png')))
for part in range(4):
    group=files[part*12:(part+1)*12];sheet=Image.new('RGB',(4*240,3*330),'#eeeae3');draw=ImageDraw.Draw(sheet)
    for j,p in enumerate(group):
        im=Image.open(p).convert('RGB');im.thumbnail((240,300));x=(j%4)*240;y=(j//4)*330;sheet.paste(im,(x,y));draw.text((x+8,y+304),f'{(part*12+j)/8:.2f}s',fill='black')
    sheet.save(review/f'contact-{part+1}.jpg')
(review/'probe.json').write_text(json.dumps(probe,indent=2),encoding='utf-8')
(out/'verdict.json').write_text(json.dumps(dict(summary='오른팔 방향 수정 후보 · 영상 검수 중',passed=False,sha256=hashlib.sha256(a.clip.read_bytes()).hexdigest(),duration=float(probe['format']['duration']),raw_source=str(a.clip),validation_scope='Full decode + sampled visual review; not hard anatomy/CAD lock'),ensure_ascii=False,indent=2),encoding='utf-8')
local=repo/'output/virtual-parenting/tango-right-arm';shutil.copytree(out,local,dirs_exist_ok=True)
shutil.copy2(repo/'scripts/virtual-parenting/tango-right-arm.html',root/'tango-right-arm.html')
print(json.dumps(dict(review=str(review),duration=probe['format']['duration'],sha256=hashlib.sha256(a.clip.read_bytes()).hexdigest())))

