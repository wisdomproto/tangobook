"""Verify the real video, audio cue timing, Rive repeatability and image alpha."""
from pathlib import Path
import hashlib
import json
import re
import subprocess

import numpy as np
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'output/rive-remotion-learning-20261012'
ASSETS = ROOT / 'packages/remotion/public/hangul-sample-20261012'
RATE = 48000


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pcm(path):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path),
                                   '-vn', '-ar', str(RATE), '-ac', '1', '-f', 'f32le', '-'])
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def run():
    video = OUTPUT / 'hangul-ga-learning.mp4'
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(video)]))
    v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    a = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
    assert (v['width'], v['height'], v['r_frame_rate'], v['nb_read_frames']) == (1920, 1080, '30/1', '720')
    assert abs(float(v['duration']) - 24) < .001
    assert abs(float(a['duration']) - float(v['duration'])) < .1
    subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(video), '-f', 'null', '-'], check=True)

    rendered = pcm(video)
    peak = float(np.max(np.abs(rendered)))
    assert peak < .99, peak
    source = (ROOT / 'packages/remotion/src/samples/HangulLearningSample.tsx').read_text(encoding='utf-8')
    cue_block = re.search(r'export const VOICE_CUES = \[(.*?)\] as const', source, re.S).group(1)
    cues = re.findall(r"from:\s*(\d+),\s*file:\s*'([^']+)'", cue_block)
    assert len(cues) == 10
    alignment = []
    margin = round(.08 * RATE)
    previous_end = 0
    for frame_text, file in cues:
        sample = pcm(ASSETS / file)
        expected = round(int(frame_text) / 30 * RATE)
        assert expected >= previous_end, ('Overlapping spoken cues', file)
        previous_end = expected + len(sample)
        begin = max(0, expected - margin)
        window = rendered[begin:expected + len(sample) + margin]
        fft_size = 1 << (len(window) + len(sample) - 1).bit_length()
        dots = np.fft.irfft(np.fft.rfft(window, fft_size) * np.conj(np.fft.rfft(sample, fft_size)), fft_size)
        count = len(window) - len(sample) + 1
        energy = np.concatenate(([0], np.cumsum(window * window)))
        norms = np.sqrt((energy[len(sample):] - energy[:-len(sample)]) * np.sum(sample * sample))
        correlation = dots[:count] / np.maximum(norms, 1e-12)
        best = int(np.argmax(correlation))
        shift = (begin + best - expected) / RATE
        assert float(correlation[best]) > .9, (file, float(correlation[best]))
        assert abs(shift) < .04, (file, shift)
        alignment.append({'frame': int(frame_text), 'file': file,
                          'waveform_correlation': float(correlation[best]),
                          'timing_difference_seconds': shift})

    first = Image.open(OUTPUT / 'probe-ready.png').convert('RGB')
    repeat = Image.open(OUTPUT / 'probe-repeat.png').convert('RGB')
    delta = ImageStat.Stat(ImageChops.difference(first, repeat)).mean
    assert max(delta) < .2, delta
    assert sum(ImageStat.Stat(first).stddev) > 25
    bag = Image.open(ASSETS / 'bag.png')
    assert bag.mode == 'RGBA' and bag.getchannel('A').getextrema() == (0, 255)
    assert sha(ASSETS / 'meeting.riv') == sha(ROOT / 'output/rive-hangul-meet-20261012/sample.riv')
    result = {
        'video': {'width': v['width'], 'height': v['height'], 'fps': '30/1',
                  'frames': int(v['nb_read_frames']), 'duration': float(v['duration'])},
        'audio': {'codec': a['codec_name'], 'duration': float(a['duration']),
                  'sample_rate': a['sample_rate'], 'peak_linear': peak,
                  'peak_dbfs': float(20 * np.log10(peak)), 'cue_alignment': alignment},
        'full_decode': 'passed',
        'rive_integration': 'Direct @remotion/rive 4.0.440; approved Rive 1.5.1 native file, no prerendered character video.',
        'repeated_rive_probe_mean_rgb_difference': delta,
        'bag': {'size': bag.size, 'alpha_range': [0, 255], 'sha256': sha(ASSETS / 'bag.png')},
        'files': {p.name: {'sha256': sha(p), 'bytes': p.stat().st_size}
                  for p in [video, OUTPUT / 'contact-sheet.png', ASSETS / 'meeting.riv']},
        'limits': 'Visual review is sampled. Audio checks confirm source waveforms and timing, not a new human listening review.',
    }
    (OUTPUT / 'verification.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    run()
