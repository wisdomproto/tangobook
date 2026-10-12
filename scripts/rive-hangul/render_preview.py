"""Capture genuine Rive frames and package them as a shareable preview."""
from pathlib import Path
import subprocess
import shutil
import argparse

ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / 'output/rive-hangul-20261012'
REVIEW = ROOT / 'output/rive-hangul-20261012-review'
RIVE = Path.home() / '.codex/tools/rive-cli/rive.exe'


def run(project=PROJECT, review=REVIEW, seconds=6, fps=30, name='giyok-dance'):
    total = round(seconds * fps)
    step = 60 / fps
    frames = review / 'frames'
    frames.mkdir(parents=True, exist_ok=True)
    for i in range(total):
        target = frames / f'{i:04d}.png'
        subprocess.run([str(RIVE), str(project), f'--screenshot={target}',
                        f'--advance={round(i * step) + 1}'], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if i % 30 == 0:
            print(f'Rendered {i + 1}/{total} actual Rive frames', flush=True)
    subprocess.run([str(RIVE), str(project), f'--screenshot={review / "loop-end.png"}',
                    f'--advance={round(seconds * 60) + 1}'], check=True, stdout=subprocess.DEVNULL)
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        raise RuntimeError('ffmpeg is required to package the Rive frames')
    subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-framerate', str(fps),
                    '-i', str(frames / '%04d.png'), '-c:v', 'libx264', '-crf', '18',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                    str(review / f'{name}.mp4')], check=True)
    subprocess.run([ffmpeg, '-y', '-loglevel', 'error', '-i', str(review / f'{name}.mp4'),
                    '-filter_complex', 'fps=15,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse',
                    '-loop', '0', str(review / f'{name}.gif')], check=True)
    print(f'Preview saved: {review / f"{name}.mp4"}', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=PROJECT)
    parser.add_argument('--review', type=Path, default=REVIEW)
    parser.add_argument('--seconds', type=float, default=6)
    parser.add_argument('--fps', type=int, choices=[15, 20, 30, 60], default=30)
    parser.add_argument('--name', default='giyok-dance')
    args = parser.parse_args()
    if args.seconds <= 0:
        parser.error('--seconds must be positive')
    run(args.project.resolve(), args.review.resolve(), args.seconds, args.fps, args.name)
