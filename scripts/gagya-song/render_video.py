"""Render the independent Remotion entry, remux original audio, then verify."""
from pathlib import Path
import argparse
import subprocess
import shutil
import sys

ROOT=Path(__file__).resolve().parents[2]


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--out',type=Path,default=Path('D:/tangobook-video/gagya-song-20261015'))
    args=p.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    native=args.out/'render-native.mp4'
    final=args.out/'gagya-song-1080x1920.mp4'
    if native.exists() or final.exists():
        raise SystemExit('Output already exists. Choose a new --out directory to preserve prior renders.')
    pnpm=shutil.which('pnpm.cmd') or shutil.which('pnpm')
    subprocess.run([pnpm,'--filter','@tangobook/remotion','exec','remotion','render',
                    'src/samples/GagyaSong.tsx','GagyaSong',str(native),
                    '--codec=h264','--crf=18','--concurrency=2','--log=error'],cwd=ROOT,check=True)
    subprocess.run(['ffmpeg','-v','error','-i',str(native),
                    '-i',str(ROOT/'packages/remotion/public/gagya-song-20261015/song.mp3'),
                    '-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k',
                    '-t','22.1333333333','-movflags','+faststart',str(final)],check=True)
    subprocess.run([sys.executable,str(ROOT/'scripts/gagya-song/verify_video.py'),
                    str(final),'--out',str(args.out/'final-qc')],check=True)
    print(f'Video: {final.resolve()}')


if __name__=='__main__': main()
