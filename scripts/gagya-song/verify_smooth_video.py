"""Check actual MP4 vocal-center crossings, ongoing travel and tire alignment."""
from pathlib import Path
import json
import subprocess
import cv2
import numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[2]
OUT=Path('D:/tangobook-video/gagya-song-20261015/revision-v5')
VIDEO=OUT/'gagya-song-1080x1920.mp4'


def capture(frame,folder):
    p=folder/f'{frame:04d}.png'
    if not p.exists():
        subprocess.run(['ffmpeg','-v','error','-ss',str(frame/30),'-i',str(VIDEO),'-frames:v','1',str(p)],check=True)
    return np.array(Image.open(p).convert('RGB'))


def car_center(image,color):
    rgb=np.array([int(color[i:i+2],16) for i in [1,3,5]])
    mask=(np.linalg.norm(image[1278:1465].astype(float)-rgb,axis=2)<30).astype('uint8')
    count,labels,stats,centroids=cv2.connectedComponentsWithStats(mask)
    candidates=[s for s in stats[1:] if s[cv2.CC_STAT_AREA]>2500 and s[cv2.CC_STAT_WIDTH]>210]
    assert candidates,('No intact colored car body',color,stats.tolist())
    body=max(candidates,key=lambda s:s[cv2.CC_STAT_AREA])
    return float(body[0]+body[2]/2)


def main():
    timing=json.loads((ROOT/'packages/remotion/public/gagya-song-20261015/timing.json').read_text(encoding='utf-8'))
    math=json.loads((OUT/'motion-verification.json').read_text())
    folder=OUT/'smooth-frames';folder.mkdir(exist_ok=True)
    contact=Image.new('RGB',(1800,680),'#fff4d9');draw=ImageDraw.Draw(contact)
    crossings=[]
    for k,row in enumerate(math['rows']):
        samples={s['frame']:s['progress'] for s in row['samples']}
        for i,anchor in enumerate(row['anchors']):
            n=round(anchor*30)
            before=capture(n-1,folder);im=capture(n,folder);after=capture(n+1,folder)
            centers=[car_center(v,timing['colors'][i]) for v in [before,im,after]]
            predicted=540-(samples[n]-i)*320
            assert abs(centers[1]-predicted)<3,(row['row'],i,centers,predicted)
            assert centers[2]<centers[1]<centers[0],(row['row'],i,centers)
            x=i*180;y=k*340
            thumb=Image.fromarray(im);thumb.thumbnail((180,320));contact.paste(thumb,(x,y))
            draw.text((x+4,y+322),f'#{i+1} {n/30:.3f}s',fill='#29364a')
            crossings.append({'row':row['row'],'index':i,'frame':n,
                               'actual_x':centers[1],'predicted_x':predicted,
                               'observed_travel_across_2_frames':centers[0]-centers[2]})
    contact.save(OUT/'smooth-contact.jpg',quality=95)
    # 4.3s shows both locomotive wheels and the first car's leading wheel.
    frame=129;image=capture(frame,folder)
    progress=next(s['progress'] for s in math['rows'][0]['samples'] if s['frame']==frame)
    base=540+progress*320;left=1080-(base+90)-610
    wheel_x=[left+(640-450)*610/640,left+(640-190)*610/640,1080-base-83]
    bottoms=[]
    for x in wheel_x:
        region=image[1480:1550,round(x)-30:round(x)+31]
        mask=np.linalg.norm(region.astype(float)-np.array([60,70,93]),axis=2)<30
        rows=np.where(np.any(mask,axis=1))[0]
        assert len(rows)
        bottoms.append(int(rows[-1]+1480))
    assert max(bottoms)-min(bottoms)<=3,bottoms
    Image.fromarray(image).save(OUT/'engine-height.png')
    a=np.array(Image.open(OUT/'sync-a.png'));b=np.array(Image.open(OUT/'sync-b.png'))
    assert np.array_equal(a,b)
    report={'crossings':crossings,'all_20_cars_moving_left_across_vocal_anchors':True,
            'max_render_position_error_px':max(abs(v['actual_x']-v['predicted_x']) for v in crossings),
            'tire_bottoms_px':bottoms,'tire_baseline_difference_px':max(bottoms)-min(bottoms),
            'same_frame_pixel_difference':0,
            'limit':'Crossings are aligned to the frozen vocal cues; this does not replace human phonetic listening.'}
    (OUT/'smooth-video-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='crossings'},indent=2))


if __name__=='__main__':main()
