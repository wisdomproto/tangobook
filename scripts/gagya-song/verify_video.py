"""Verify delivered frames, source audio sync, duration, assets, and sample motion."""
from pathlib import Path
import argparse
import subprocess
import json
import hashlib
import tempfile
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw
from scipy.signal import correlate, correlation_lags

ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'packages/remotion/public/gagya-song-20261015'


def run(*args):
    return subprocess.run(args,check=True,capture_output=True)


def main():
    p=argparse.ArgumentParser()
    p.add_argument('video',type=Path)
    p.add_argument('--out',type=Path,required=True)
    args=p.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    info=json.loads(run('ffprobe','-v','quiet','-show_format','-show_streams','-of','json',str(args.video)).stdout)
    v=next(s for s in info['streams'] if s['codec_type']=='video')
    a=next(s for s in info['streams'] if s['codec_type']=='audio')
    assert int(v['nb_frames'])==664, v
    assert abs(float(v['duration'])-664/30)<.002
    assert abs(float(a['duration'])-22.12)<.07
    assert v['width']*16==v['height']*9
    run('ffmpeg','-v','error','-i',str(args.video),'-f','null','-')
    with tempfile.TemporaryDirectory(prefix='gagya-qc-',dir=args.out) as tmp:
        for name,src in [('source',ASSETS/'song.mp3'),('render',args.video)]:
            run('ffmpeg','-v','error','-i',str(src),'-vn','-ac','1','-ar','16000',str(Path(tmp)/f'{name}.wav'))
        source,sr=sf.read(Path(tmp)/'source.wav'); actual,_=sf.read(Path(tmp)/'render.wav')
        n=min(len(source),len(actual)); source=source[:n];actual=actual[:n]
        c=correlate(actual,source,method='fft'); lag=int(correlation_lags(len(actual),len(source))[int(np.argmax(c))])
        r=float(np.max(c)/np.sqrt(np.dot(actual,actual)*np.dot(source,source)))
        assert abs(lag)/sr<.025,(lag,r)
        assert r>.98,r
        peak=float(np.max(np.abs(actual)))
    times=[.8,1.83,2.30,2.78,3.57,4.55,5.03,5.70,6.71,7.54,8.87,9.58,10.62,11.8,13.62,14.1,14.8,15.86,16.6,17.4,19.0,21.7]
    contact=Image.new('RGB',(6*216,4*410),'#f4f1e9')
    draw=ImageDraw.Draw(contact)
    for i,t in enumerate(times):
        target=args.out/f'frame-{t:.2f}.png'
        run('ffmpeg','-v','error','-ss',str(t),'-i',str(args.video),'-frames:v','1',str(target))
        im=Image.open(target).convert('RGB'); im.thumbnail((216,384))
        x=(i%6)*216;y=(i//6)*410
        contact.paste(im,(x,y));draw.text((x+5,y+387),f'{t:.2f}s',fill='#25333d')
    contact.save(args.out/'contact-sheet.jpg',quality=94)
    # Compare neighboring frames inside the mouth and train machinery regions.
    motion={}
    for name,start,end,box in [('train',5.14,5.23,(0,650,720,1100))]:
        images=[]
        for k,t in enumerate([start,end]):
            target=args.out/f'{name}-motion-{k}.png'
            run('ffmpeg','-v','error','-ss',str(t),'-i',str(args.video),'-frames:v','1',str(target))
            images.append(np.array(Image.open(target).convert('RGB').resize((720,1280)).crop(box)).astype(float))
        difference=float(np.mean(np.abs(images[0]-images[1])))
        assert difference>1,(name,difference)
        motion[name]={'mean_pixel_change':difference,'times':[start,end]}
    timing=json.loads((ASSETS/'timing.json').read_text(encoding='utf-8'))
    assert len(timing['cues'])==40
    assert ''.join(c['text'] for c in timing['cues'])=='가갸거겨고교구규그기'*4
    report={'video':str(args.video),'sha256':hashlib.sha256(args.video.read_bytes()).hexdigest(),
            'width':v['width'],'height':v['height'],'frames':664,'fps':30,
            'video_duration':float(v['duration']),'audio_duration':float(a['duration']),
            'full_decode':True,'audio_source_correlation':r,'audio_lag_ms':lag/sr*1000,
            'audio_peak':peak,'motion':motion,'sample_frames':times,
            'lyric_text':'가갸거겨고교구규그기 ×4',
            'limit':'Image and waveform QC do not replace human phoneme listening or final creative approval.'}
    (args.out/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__': main()
