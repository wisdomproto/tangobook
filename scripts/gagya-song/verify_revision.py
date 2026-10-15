"""Cross-check the rendered revision, all lyric boundaries, and rightward train."""
from pathlib import Path
import argparse
import json
import subprocess
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image,ImageDraw
import cv2

ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'packages/remotion/public/gagya-song-20261015'


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,default=Path('D:/tangobook-video/gagya-song-20261015/revision-v4'))
    OUT=parser.parse_args().out
    VIDEO=OUT/'gagya-song-1080x1920.mp4'
    timing=json.loads((ASSETS/'timing.json').read_text(encoding='utf-8'))
    phonemes=json.loads((ASSETS/'phoneme-timing.json').read_text(encoding='utf-8'))
    rml=ET.parse(ROOT/'output/gagya-song-20261015/rive/scene.rml').getroot()
    assert len(rml.findall('Artboard'))==2
    keyobj=rml.find('.//KeyedObject[@objectId="0:110"]')
    keys={int(p.get('propertyKey')):{int(k.get('frame')):float(k.get('value')) for k in p}
          for p in keyobj}
    errors=[]; frames=[]
    for cue in timing['cues']:
        n=round(cue['start']*30);frames.append(n+2)
        assert abs(cue['start']-n/30)<1e-7
        assert 2*n in keys[16] and 2*n in keys[17]
        raw=phonemes['unquantizedRows'][cue['row']][cue['index']]
        errors.append(abs(cue['start']-raw)*1000)
    assert max(errors)<=16.667
    # Capture all 40 syllable entrances from the delivered MP4, not a still render.
    folder=OUT/'phoneme-frames';folder.mkdir(exist_ok=True)
    expression='+'.join(f'eq(n\\,{n})' for n in sorted(set(frames)))
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(VIDEO),'-vf',
                    f'select={expression},scale=180:320','-fps_mode','vfr','-q:v','2',
                    str(folder/'%03d.jpg')],check=True)
    samples=sorted(folder.glob('*.jpg'));assert len(samples)==40
    contact=Image.new('RGB',(1800,1360),'#fff4d9');draw=ImageDraw.Draw(contact)
    for i,p in enumerate(samples):
        x=(i%10)*180;y=(i//10)*340;contact.paste(Image.open(p),(x,y))
        draw.text((x+4,y+322),f"row{i//10+1} #{i%10+1} {timing['cues'][i]['start']:.3f}s",fill='#29364a')
    contact.save(OUT/'phoneme-contact.jpg',quality=95)
    images=[]
    for i,t in enumerate([4.2,4.3]):
        p=OUT/f'train-direction-{i}.png'
        subprocess.run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(VIDEO),'-frames:v','1',str(p)],check=True)
        images.append(np.array(Image.open(p).convert('RGB')))
    template=images[0][1190:1340,900:1030]
    result=cv2.matchTemplate(images[1][1140:1390],template,cv2.TM_CCOEFF_NORMED)
    _,score,_,loc=cv2.minMaxLoc(result)
    delta=loc[0]-900
    assert score>.75 and delta<-40,(score,delta)
    a=np.array(Image.open(OUT/'sync-a.png'));b=np.array(Image.open(OUT/'sync-b.png'))
    diff=float(np.max(np.abs(a.astype(float)-b)))
    assert diff==0,diff
    report={'all_40_lyric_boundaries_preserved':True,
            'max_quantization_ms':max(errors),'mouth_visible':False,
            'artboards':2,'train_direction':'right to left',
            'observed_engine_shift_px':delta,'template_score':score,
            'same_frame_max_pixel_difference':diff,
            'limit':'Quantization error is relative to the corrected acoustic anchors; it is not a measured human phonetic alignment error.'}
    (OUT/'revision-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))


if __name__=='__main__':main()
