"""Two generated Hangul bodies, with native Rive faces and jointed limbs.

The original approved dance remains intact. No image pixels are modified.
"""
from pathlib import Path
import math
import xml.etree.ElementTree as ET
import xml.dom.minidom

from PIL import Image
from build_scene import shape, eye, arm, leg, keyed, INK, WHITE, MINT

ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / 'output/rive-hangul-meet-20261012'
SCALE = 0.85


def lerp(a, b, t):
    t = max(0, min(1, t))
    t = t * t * (3 - 2 * t)
    return a + (b - a) * t


def inverse_arm(dx, dy, bend):
    """Target the centre of the native mitten with a two-joint arm."""
    upper, lower = 48, 55
    length = min(upper + lower - .1, max(abs(upper - lower) + .1, math.hypot(dx, dy)))
    elbow = bend * math.acos((length * length - upper * upper - lower * lower) / (2 * upper * lower))
    shoulder = math.atan2(dy, dx) - math.pi / 2 - math.atan2(lower * math.sin(elbow), upper + lower * math.cos(elbow))
    # Equivalent turns nearest the resting pose avoid an unnecessary full spin.
    shoulder = (shoulder + math.pi) % (2 * math.pi) - math.pi
    return shoulder, elbow


def mini_letter(name, x, letter, color):
    strokes = {
        'g': [(0, -19, 43, 10), (17, 0, 10, 46)],
        'a': [(-8, 0, 10, 51), (5, 0, 31, 10)],
        'ga': [(-18, -19, 33, 10), (-6, 0, 10, 46), (16, 0, 10, 51), (26, 0, 26, 10)],
        '+': [(0, 0, 23, 5), (0, 0, 5, 23)],
        '=': [(0, -6, 23, 5), (0, 6, 23, 5)],
    }
    return f'<Node name="{name}" x="{x}">' + ''.join(
        shape(f'{name} stroke {i}', sx, sy, w, h, color, 'Rectangle', radius=3)
        for i, (sx, sy, w, h) in enumerate(strokes[letter])) + '</Node>'


def build():
    original = ET.parse(ROOT / 'output/rive-hangul-20261012/scene.rml').getroot()
    giyok = original.find('.//Node[@id="0:20"]')
    for node in giyok.iter():
        if node.text and not node.text.strip():
            node.text = None
        if node.tail and not node.tail.strip():
            node.tail = None
    for key, value in {'x': '225', 'y': '340', 'scaleX': str(SCALE), 'scaleY': str(SCALE)}.items():
        giyok.set(key, value)
    giyok_markup = ET.tostring(giyok, encoding='unicode')

    # Use the opaque silhouette to anchor the generated asset; keep all alpha pixels.
    image = Image.open(PROJECT / 'a-body.png')
    alpha = image.getchannel('A')
    box = alpha.point(lambda v: 255 if v > 160 else 0).getbbox()
    pixel_scale = 346 / (box[3] - box[1])
    row = alpha.crop((0, box[1] + (box[3] - box[1]) // 5, image.width,
                      box[1] + (box[3] - box[1]) // 5 + 1))
    stem = row.point(lambda v: 255 if v > 160 else 0).getbbox()
    offset_x = -(sum((stem[0], stem[2])) / 2 - image.width / 2) * pixel_scale
    offset_y = -(sum((box[1], box[3])) / 2 - image.height / 2) * pixel_scale
    face = (eye('A left eye', -26, 130) + eye('A right eye', 26, 131)).replace('FFE26546', 'FF30B6A5')
    face = face.replace('x="7"', 'x="-7"').replace('x="6"', 'x="-6"').replace('x="14"', 'x="-14"')
    face += (shape('A left brow', -26, -153, 28, 7, INK, 'Rectangle', radius=4, rotation=-.12)
             + shape('A right brow', 26, -153, 28, 7, INK, 'Rectangle', radius=4, rotation=.12)
             + shape('A tongue', 0, -63, 22, 10, 'FFFF9C9B')
             + shape('A tooth', 0, -81, 23, 7, WHITE, 'Rectangle', radius=2)
             + shape('A smile', 0, -73, 46, 28, INK)
             + shape('A left cheek', -49, -89, 16, 11, 'FFA4F3DC')
             + shape('A right cheek', 49, -89, 16, 11, 'FFA4F3DC'))
    a_markup = ('<Node name="A character" x="740" y="340" scaleX="0.85" scaleY="0.85" id="0:120">'
                '<Node name="A face" scaleX="0.72" scaleY="0.72" id="0:129">' + face + '</Node>'
                f'<Image name="Generated a body" assetId="0:160" x="{offset_x}" y="{offset_y}" '
                f'scaleX="{pixel_scale}" scaleY="{pixel_scale}"/>'
                + arm('A left arm', -38, -70, 140, 141, .5)
                + arm('A right arm', 38, -70, 142, 143, -.5)
                + leg('A left leg', -24, 150, 151) + leg('A right leg', 24, 152, 153) + '</Node>')

    badge = ('<Node name="Learning equation" x="480" y="638">'
             '<Node name="Ga answer" id="0:310" opacity="0">'
             + mini_letter('Together ga', 143, 'ga', INK) + '</Node>'
             + mini_letter('Giyok symbol', -143, 'g', 'FFEC7953')
             + mini_letter('Plus', -73, '+', 'FF82908B')
             + mini_letter('A symbol', 0, 'a', 'FF36AC9D')
             + mini_letter('Equals', 73, '=', 'FF82908B')
             + shape('Equation badge', 0, 0, 382, 85, WHITE, 'Rectangle', radius=30) + '</Node>')
    sparkles = ''.join(shape(f'Friendship sparkle {i}', x, y, size, size, color, 'Star', ident=280+i)
                       for i, (x, y, size, color) in enumerate([
                           (150, 155, 19, 'FFF2CB70'), (800, 190, 23, MINT),
                           (170, 490, 15, MINT), (804, 477, 17, 'FFFFBEA4')]))
    shadows = (shape('Giyok contact shadow', 337, 558, 125, 16, 'FFD5DDD4', ident=71)
               + shape('A contact shadow', 740, 558, 110, 16, 'FFD5DDD4', ident=171))
    stage = (shape('Meeting floor', 480, 560, 830, 89, 'FFE5F2EC')
             + shape('Warm halo', 480, 337, 820, 490, 'FFF5F1E6'))

    tracks = {}

    def put(ident, prop, frame, value):
        tracks.setdefault(ident, {}).setdefault(prop, []).append((frame, value))

    # Six samples per walking cycle avoid sampling every leg swing at zero.
    for f in range(0, 541, 10):
        t = f / 60
        reset = f >= 525
        approach = (t - 1) / 2
        combine = (t - 3.9) / 1.5
        gx = lerp(225, 405, approach) + lerp(0, -30, combine)
        ax = lerp(740, 670, approach) + lerp(0, -55, combine)
        walk = 1 <= t < 3 or 3.9 <= t < 5.4
        step = math.sin(4 * math.pi * (t - 1)) if walk else 0
        happy = 5.5 <= t <= 7.5
        jump = 23 * max(0, math.sin(2 * math.pi * (t - 5.5))) if happy else 0
        gy = 340 - (5 * abs(step) if walk else 0) - jump
        ay = 340 - (5 * abs(step) if walk else 0) - jump
        if reset:
            gx, ax, gy, ay = 225, 740, 340, 340
            step, jump, happy = 0, 0, False
        rotation = .018 * step
        sx, sy = SCALE * (1 + .014 * abs(step)), SCALE * (1 - .014 * abs(step))
        for ident, x, y in [(20, gx, gy), (120, ax, ay)]:
            put(ident, 13, f, x)
            put(ident, 14, f, y)
            put(ident, 15, f, rotation)
            put(ident, 16, f, sx)
            put(ident, 17, f, sy)
        # Two inner mittens meet at one point, with both shoulders staying attached.
        cosine, sine = math.cos(rotation), math.sin(rotation)

        def shoulder_position(x, y, local_x, local_y):
            return (x + cosine * sx * local_x - sine * sy * local_y,
                    y + sine * sx * local_x + cosine * sy * local_y)

        def arm_target(shoulder):
            dx, dy = target[0] - shoulder[0], target[1] - shoulder[1]
            return ((cosine * dx + sine * dy) / sx,
                    (-sine * dx + cosine * dy) / sy)

        g_shoulder = shoulder_position(gx, gy, 167, -88)
        a_shoulder = shoulder_position(ax, ay, -38, -70)
        hand_height = lerp(-50, 60, (t - 3.8) / 1.2)
        target = ((g_shoulder[0] + a_shoulder[0]) / 2,
                  (g_shoulder[1] + a_shoulder[1]) / 2 + hand_height)
        g_ik = inverse_arm(*arm_target(g_shoulder), 1)
        a_ik = inverse_arm(*arm_target(a_shoulder), -1)
        touch = max(0, min(1, (t - 2.5) / .5)) if not reset else 0
        wave = math.sin(5 * math.pi * (t - .5)) if .5 <= t < 2 else 0
        g_inner = -1.15 - .35 * wave if .5 <= t < 2 else -.3
        a_outer = -2.2 - .25 * wave if .5 <= t < 2 else -.45
        if happy:
            g_inner, a_outer = -.65, -1.7 - .12 * math.sin(2 * math.pi * t)
        for ident, prop, value in [
                (40, 15, .3 + .13 * step), (41, 15, -.25),
                (42, 15, lerp(g_inner, g_ik[0], touch)), (43, 15, lerp(.25, g_ik[1], touch)),
                (140, 15, lerp(.35, a_ik[0], touch)), (141, 15, lerp(-.25, a_ik[1], touch)),
                (142, 15, a_outer), (143, 15, .25),
                (50, 15, .25 * step), (52, 15, -.25 * step),
                (150, 15, -.25 * step), (152, 15, .25 * step),
                (51, 15, -.25 * max(step, 0)), (53, 15, -.25 * max(-step, 0)),
                (151, 15, -.25 * max(-step, 0)), (153, 15, -.25 * max(step, 0)),
                (71, 13, gx + 136 * SCALE), (171, 13, ax),
                (71, 16, 1 - jump / 100), (171, 16, 1 - jump / 100)]:
            put(ident, prop, f, value)

    motion = ''.join(keyed(ident, props) for ident, props in tracks.items())
    motion += keyed(300, {18: [(0, 0), (20, 1), (500, 1), (520, 0), (540, 0)]})
    motion += keyed(310, {18: [(0, 0), (305, 0), (335, 1), (520, 1), (525, 0), (540, 0)],
                          16: [(0, 1), (305, .75), (335, 1.1), (355, 1), (540, 1)],
                          17: [(0, 1), (305, .75), (335, 1.1), (355, 1), (540, 1)]})
    blink = [(0, 1), (40, 1), (45, .07), (50, 1), (215, 1), (220, .07),
             (225, 1), (405, 1), (410, .07), (415, 1), (540, 1)]
    for ident in [30, 31, 130, 131]:
        motion += keyed(ident, {17: blink})
    for ident in range(280, 284):
        motion += keyed(ident, {16: [(0, 1), (305, .6), (335, 1.5), (370, 1), (540, 1)],
                                17: [(0, 1), (305, .6), (335, 1.5), (370, 1), (540, 1)]})

    markup = ('<Rive version="1" kind="fragment">'
              '<ImageAsset file="giyok-body.png" name="Giyok imagegen" id="0:60"/>'
              '<ImageAsset file="a-body.png" name="A imagegen" id="0:160"/>'
              '<Artboard width="960" height="720" name="Giyok meets A" id="0:2" '
              'defaultStateMachineId="0:7" styleId="0:5">'
              '<LayoutComponentStyle name="Artboard Style" id="0:5"/>'
              '<Fill name="Cream background"><SolidColor colorValue="FFFFFCF4"/></Fill>'
              '<Node name="Meeting scene" id="0:300">' + badge + giyok_markup + a_markup + sparkles + shadows + '</Node>'
              + stage + '<StateMachine name="Meeting controller" id="0:7">'
              '<StateMachineLayer name="Meet and combine" id="0:8">'
              '<AnyState x="180" y="-140"/><ExitState x="500" y="-140"/>'
              '<EntryState x="0" y="0"><StateTransition stateToId="0:12"/></EntryState>'
              '<AnimationState x="240" y="0" animationId="0:6" id="0:12"/>'
              '</StateMachineLayer></StateMachine>'
              '<LinearAnimation name="Meet then ga 9 seconds" duration="540" fps="60" loopValue="loop" id="0:6">'
              + motion + '</LinearAnimation></Artboard></Rive>')
    (PROJECT / 'scene.rml').write_text(xml.dom.minidom.parseString(markup).toprettyxml(indent='  '), encoding='utf-8')


if __name__ == '__main__':
    build()
