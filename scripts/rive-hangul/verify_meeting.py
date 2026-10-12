"""Check the authored joints, loop seam, and actual rendered preview."""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import xml.etree.ElementTree as ET

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / 'output/rive-hangul-meet-20261012'
REVIEW = ROOT / 'output/rive-hangul-meet-20261012-review'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run():
    scene = ET.parse(PROJECT / 'scene.rml').getroot()
    tracks = {}
    for obj in scene.findall('.//KeyedObject'):
        ident = int(obj.attrib['objectId'].split(':')[1])
        tracks[ident] = {}
        for prop in obj.findall('KeyedProperty'):
            pairs = {int(k.attrib['frame']): float(k.attrib['value'])
                     for k in prop.findall('KeyFrameDouble')}
            assert abs(pairs[min(pairs)] - pairs[max(pairs)]) < 1e-6, (ident, prop.attrib)
            tracks[ident][int(prop.attrib['propertyKey'])] = pairs
    assert max(tracks[50][15].values()) - min(tracks[50][15].values()) > .4

    def palm(root_id, upper_id, lower_id, shoulder, frame):
        def value(ident, key):
            return tracks[ident][key][frame]
        theta, phi = value(upper_id, 15), value(lower_id, 15)
        x = shoulder[0] - 48 * math.sin(theta) - 55 * math.sin(theta + phi)
        y = shoulder[1] + 48 * math.cos(theta) + 55 * math.cos(theta + phi)
        sx, sy, rot = value(root_id, 16), value(root_id, 17), value(root_id, 15)
        return (value(root_id, 13) + math.cos(rot) * sx * x - math.sin(rot) * sy * y,
                value(root_id, 14) + math.sin(rot) * sx * x + math.cos(rot) * sy * y)

    separation = []
    for f in range(180, 521, 10):
        g = palm(20, 42, 43, (167, -88), f)
        a = palm(120, 140, 141, (-38, -70), f)
        separation.append(math.dist(g, a))
    assert max(separation) < .001, max(separation)

    frames = sorted((REVIEW / 'frames').glob('*.png'))
    assert len(frames) == 180
    assert all(Image.open(p).size == (960, 720) for p in frames)
    seam = ImageStat.Stat(ImageChops.difference(Image.open(frames[0]).convert('RGB'),
                                               Image.open(REVIEW / 'loop-end.png').convert('RGB'))).mean
    assert max(seam) < .05, seam
    video = REVIEW / 'giyok-meets-a.mp4'
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
        'stream=width,height,r_frame_rate,nb_frames:format=duration', '-of', 'json', str(video)]))
    assert probe['streams'][0]['nb_frames'] == '180'
    assert probe['streams'][0]['r_frame_rate'] == '20/1'
    assert abs(float(probe['format']['duration']) - 9) < .01
    subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(video), '-f', 'null', '-'], check=True)
    assets = {}
    for name in ['giyok-body.png', 'a-body.png']:
        p = PROJECT / name
        image = Image.open(p)
        assert image.mode == 'RGBA' and image.getchannel('A').getextrema() == (0, 255)
        assets[name] = {'sha256': digest(p), 'size': image.size, 'alpha_extrema': [0, 255]}
    assert digest(PROJECT / 'giyok-body.png') == digest(ROOT / 'output/rive-hangul-20261012/giyok-body.png')
    report = {
        'native_rive_frames_rendered': len(frames),
        'distinct_frame_sha256_count': len({digest(p) for p in frames}),
        'video': probe,
        'full_video_decode': 'passed',
        'loop_keyed_properties': sum(map(len, tracks.values())),
        'max_keyframe_palm_separation_pixels': max(separation),
        'loop_seam_rgb_mean_absolute_difference_0_255': seam,
        'assets': assets,
        'files': {p.name: {'sha256': digest(p), 'bytes': p.stat().st_size}
                  for p in [PROJECT / 'scene.rml', PROJECT / 'build/rive-hangul-meet-20261012.riv',
                            video, REVIEW / 'giyok-meets-a.gif']},
        'limits': 'Silent local prototype. Joint metric checks keyed poses; visual review covers sampled rendered frames.',
    }
    (REVIEW / 'verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    run()
