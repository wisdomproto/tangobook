"""Capture genuine Rive frames and package them as a shareable preview."""
from pathlib import Path
import subprocess
import shutil

ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / 'output/rive-hangul-20261012'
REVIEW = ROOT / 'output/rive-hangul-20261012-review'
RIVE = Path.home() / '.codex/tools/rive-cli/rive.exe'


def run():
    frames = REVIEW / 'frames'
    frames.mkdir(parents=True, exist_ok=True)
    for i in range(180):
        target = frames / f'{i:04d}.png'
        subprocess.run([str(RIVE), str(PROJECT), f'--screenshot={target}',
                        f'--advance={i * 2 + 1}'], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if i % 30 == 0:
            print(f'Rendered {i + 1}/180 actual Rive frames', flush=True)
    subprocess.run([str(RIVE), str(PROJECT), f'--screenshot={REVIEW / "loop-end.png"}',
                    '--advance=361'], check=True, stdout=subprocess.DEVNULL)
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        raise RuntimeError('ffmpeg is required to package the Rive frames')
    subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-framerate', '30',
                    '-i', str(frames / '%04d.png'), '-c:v', 'libx264', '-crf', '18',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                    str(REVIEW / 'giyok-dance.mp4')], check=True)
    subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-i', str(REVIEW / 'giyok-dance.mp4'),
                    '-filter_complex', 'fps=15,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse',
                    '-loop', '0', str(REVIEW / 'giyok-dance.gif')], check=True)
    print(f'Preview saved: {REVIEW / "giyok-dance.mp4"}', flush=True)


if __name__ == '__main__':
    run()
