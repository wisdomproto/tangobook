"""Measure actual MP4 car position during all 20 sung train syllables."""
from pathlib import Path
import argparse
import json
import subprocess
import cv2
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[2]


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--out',type=Path,default=Path('D:/tangobook-video/gagya-song-20261015/revision-v4'))
    out=p.parse_args().out
    timing=json.loads((ROOT/'packages/remotion/public/gagya-song-20261015/timing.json').read_text(encoding='utf-8'))
    folder=out/'train-timing-frames';folder.mkdir(exist_ok=True)
    video=out/'gagya-song-1080x1920.mp4'
    report=[]
    sheet=Image.new('RGB',(1800,680),'#fff4d9');draw=ImageDraw.Draw(sheet)
    for row in [1,3]:
        for i in range(10):
            cue=next(c for c in timing['cues'] if c['row']==row and c['index']==i)
            duration=cue['end']-cue['start']
            frames=[round((cue['start']+duration*f)*30) for f in [.15,.60]]
            images=[]
            for k,n in enumerate(frames):
                path=folder/f'row{row+1}-{i+1}-{k}.png'
                subprocess.run(['ffmpeg','-y','-v','error','-ss',str(n/30),'-i',str(video),'-frames:v','1',str(path)],check=True)
                images.append(np.array(Image.open(path).convert('RGB')))
            # Match its rigid left window/body border, excluding the deliberately
            # rotating glyph. Glyph rotation is not horizontal train drift.
            template=images[0][1280:1440,400:450]
            match=cv2.matchTemplate(images[1][1260:1460],template,cv2.TM_CCOEFF_NORMED)
            _,score,_,position=cv2.minMaxLoc(match)
            dx=position[0]-400;dy=position[1]-20
            assert score>.90 and abs(dx)<=2 and abs(dy)<=15,(row,i,score,dx,dy)
            thumb=Image.fromarray(images[1]);thumb.thumbnail((180,320))
            x=i*180;y=(0 if row==1 else 1)*340
            sheet.paste(thumb,(x,y));draw.text((x+4,y+322),f'#{i+1} {frames[1]/30:.3f}s dx={dx}',fill='#29364a')
            report.append({'row':row+1,'index':i,'text':cue['text'],
                           'sample_frames':frames,'actual_car_shift_px':dx,'match_score':score})
    sheet.save(out/'train-timing-contact.jpg',quality=95)
    data={'syllables_checked':20,'all_cars_hold_center_during_sung_vowel':True,
          'largest_observed_horizontal_drift_px':max(abs(r['actual_car_shift_px']) for r in report),
          'samples':report,
          'limit':'Checks car synchronization to existing lyric cues; does not re-estimate the vocal phonetic anchors.'}
    (out/'train-timing-verification.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in data.items() if k!='samples'},indent=2))


if __name__=='__main__': main()
