"""Build the image-backed Hangul character as editable native Rive RML.

The body PNG is generated with the imagegen skill. Face and jointed limbs are
native Rive shapes; this script never paints or edits the generated image.
"""
from pathlib import Path
import math

ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / 'output/rive-hangul-20261012'
INK = 'FF25333D'
WHITE = 'FFFFFEF7'
CORAL = 'FFFF8156'
MINT = 'FF91CEC1'


def shape(name, x, y, width, height, color, kind='Ellipse', ident=None,
          radius=0, rotation=0, opacity=1):
    attrs = f' id="0:{ident}"' if ident else ''
    geometry = f'<{kind} width="{width}" height="{height}"'
    if kind == 'Rectangle':
        geometry += f' cornerRadiusTL="{radius}"'
    if kind == 'Star':
        geometry += ' points="4" innerRadius="0.32" cornerRadius="2"'
    geometry += '/>'
    return (f'<Shape name="{name}" x="{x}" y="{y}" rotation="{rotation}" '
            f'opacity="{opacity}"{attrs}>{geometry}'
            f'<Fill><SolidColor colorValue="{color}"/></Fill></Shape>')


def eye(name, x, ident):
    return (f'<Node name="{name}" x="{x}" y="-117" id="0:{ident}">'
            + shape('Glint', 6, -5, 10, 10, WHITE)
            + shape('Small glint', 14, 8, 4, 4, WHITE)
            + shape('Pupil', 7, 4, 25, 30, INK)
            + shape('Eye white', 0, 0, 44, 51, WHITE)
            + shape('Eye rim', 0, 2, 47, 53, 'FFE26546')
            + '</Node>')


def arm(name, x, y, upper_id, lower_id, initial):
    return (f'<Node name="{name} shoulder" x="{x}" y="{y}" '
            f'rotation="{initial}" id="0:{upper_id}">'
            f'<Node name="{name} elbow" y="48" rotation="-0.3" id="0:{lower_id}">'
            + shape('Thumb', -13, 49, 14, 17, WHITE, rotation=-0.4)
            + shape('Mitten', 0, 55, 27, 30, WHITE)
            + shape('Wrist cuff', 0, 39, 16, 8, CORAL, 'Rectangle', radius=4)
            + shape('Forearm', 0, 21, 12, 48, INK, 'Rectangle', radius=6)
            + '</Node>'
            + shape('Upper arm', 0, 24, 13, 56, INK, 'Rectangle', radius=6)
            + '</Node>')


def leg(name, x, upper_id, lower_id):
    return (f'<Node name="{name} hip" x="{x}" y="163" id="0:{upper_id}">'
            f'<Node name="{name} knee" y="39" id="0:{lower_id}">'
            + shape('Shoe shine', 5, 42, 18, 5, 'FF71858E', rotation=0.12)
            + shape('Shoe upper', 8, 48, 48, 25, INK)
            + shape('Mint sole', 8, 56, 49, 8, MINT, 'Rectangle', radius=4)
            + shape('Shin', 0, 20, 13, 44, INK, 'Rectangle', radius=6)
            + '</Node>'
            + shape('Thigh', 0, 20, 14, 46, INK, 'Rectangle', radius=7)
            + '</Node>')


def keyed(ident, properties):
    out = f'<KeyedObject objectId="0:{ident}">'
    for key, pairs in properties.items():
        out += f'<KeyedProperty propertyKey="{key}">'
        for frame, value in pairs:
            out += (f'<KeyFrameDouble frame="{frame}" value="{value:.6f}" '
                    'interpolationType="cubic">'
                    '<CubicEaseInterpolator x1="0.38" y1="0" x2="0.62" y2="1"/>'
                    '</KeyFrameDouble>')
        out += '</KeyedProperty>'
    return out + '</KeyedObject>'


def build():
    # First sibling is foremost in Rive's layer order.
    face = (eye('Left eye', 37, 30) + eye('Right eye', 95, 31)
            + shape('Left brow', 31, -153, 28, 7, INK, 'Rectangle', radius=4, rotation=-0.12)
            + shape('Right brow', 96, -153, 28, 7, INK, 'Rectangle', radius=4, rotation=0.14)
            + shape('Tongue', 68, -64, 23, 9, 'FFFF9C9B')
            + shape('Tooth', 68, -81, 24, 7, WHITE, 'Rectangle', radius=2)
            + shape('Smile', 68, -73, 47, 28, INK, ident=33)
            + shape('Left cheek', 1, -89, 21, 11, 'FFFFBDA2', opacity=0.8)
            + shape('Right cheek', 133, -89, 21, 11, 'FFFFBDA2', opacity=0.8))
    character = ('<Node name="Giyok character" x="430" y="330" id="0:20">'
                 '<Node name="Face" id="0:29">' + face + '</Node>'
                 '<Image name="Generated giyok body" assetId="0:60" scaleX="0.4" scaleY="0.4" id="0:21"/>'
                 + arm('Left arm', -151, -103, 40, 41, 0.7)
                 + arm('Right arm', 167, -88, 42, 43, -0.7)
                 + leg('Left leg', 104, 50, 51)
                 + leg('Right leg', 158, 52, 53)
                 + '</Node>')
    decoration = ''.join(shape(f'Sparkle {i}', x, y, sz, sz, color, 'Star', ident=80+i)
                         for i, (x, y, sz, color) in enumerate([
                             (215, 170, 23, 'FFF6CF75'), (710, 220, 25, MINT),
                             (250, 445, 15, MINT), (727, 456, 17, 'FFFFBEA4')]))
    stage = (shape('Contact shadow', 575, 586, 147, 18, 'FFD3DCD5', ident=71)
             + shape('Dance floor', 480, 589, 670, 97, 'FFE5F2EC')
             + shape('Backdrop halo', 479, 339, 660, 540, 'FFF5F1E6'))
    frames = list(range(0, 361, 15))
    x_values, y_values, r_values, sx_values, sy_values = [], [], [], [], []
    left_arm, right_arm, left_elbow, right_elbow = [], [], [], []
    left_leg, right_leg, left_knee, right_knee, shadow_scale = [], [], [], [], []
    for f in frames:
        t = f / 60
        beat = math.sin(2 * math.pi * t)
        sway = math.sin(math.pi * t)
        lift = 0
        if 3.75 <= t <= 4.75:
            lift = 85 * math.sin(math.pi * (t-3.75))
        x_values.append((f, 430 + 30 * sway))
        y_values.append((f, 330 - 7 * (1-math.cos(2*math.pi*t)) - lift))
        r_values.append((f, 0.065 * sway))
        sx_values.append((f, 1 + 0.018 * beat))
        sy_values.append((f, 1 - 0.018 * beat))
        left_arm.append((f, 0.8 + 0.55 * beat))
        right_arm.append((f, -0.9 - 0.75 * beat - (0.8 if 4 <= t <= 5 else 0)))
        left_elbow.append((f, -0.35 - 0.4 * sway))
        right_elbow.append((f, 0.3 + 0.5 * beat))
        left_leg.append((f, 0.34 * beat))
        right_leg.append((f, -0.34 * beat))
        left_knee.append((f, -0.36 * max(beat, 0)))
        right_knee.append((f, -0.36 * max(-beat, 0)))
        shadow_scale.append((f, 1 - lift / 220))
    motion = (keyed(20, {13:x_values, 14:y_values, 15:r_values, 16:sx_values, 17:sy_values})
              + keyed(40, {15:left_arm}) + keyed(42, {15:right_arm})
              + keyed(41, {15:left_elbow}) + keyed(43, {15:right_elbow})
              + keyed(50, {15:left_leg}) + keyed(52, {15:right_leg})
              + keyed(51, {15:left_knee}) + keyed(53, {15:right_knee})
              + keyed(71, {16:shadow_scale}))
    blink = [(0,1),(64,1),(69,0.07),(73,1),(172,1),(177,0.07),(181,1),(310,1),(315,0.07),(319,1),(360,1)]
    motion += keyed(30,{17:blink}) + keyed(31,{17:blink})
    for i in range(4):
        motion += keyed(80+i, {15:[(0,0),(180,0.35*(-1)**i),(360,0)],
                              16:[(0,1),(90,1.25),(180,1),(270,1.25),(360,1)],
                              17:[(0,1),(90,1.25),(180,1),(270,1.25),(360,1)]})
    markup = ('<Rive version="1" kind="fragment">'
           '<ImageAsset file="giyok-body.png" name="Giyok body imagegen" id="0:60"/>'
           '<Artboard width="960" height="720" name="Giyok dance" id="0:2" defaultStateMachineId="0:7" styleId="0:5">'
           '<LayoutComponentStyle name="Artboard Style" id="0:5"/>'
           '<Fill name="Cream background"><SolidColor colorValue="FFFFFCF4"/></Fill>'
           + character + decoration + stage
           + '<StateMachine name="Giyok dance controller" id="0:7">'
           '<StateMachineLayer name="Dance" id="0:8">'
           '<AnyState x="180" y="-140"/><ExitState x="500" y="-140"/>'
           '<EntryState x="0" y="0"><StateTransition stateToId="0:12"/></EntryState>'
           '<AnimationState x="240" y="0" animationId="0:6" id="0:12"/>'
           '</StateMachineLayer></StateMachine>'
           '<LinearAnimation name="Dance 6 seconds" duration="360" fps="60" loopValue="loop" id="0:6">'
           + motion + '</LinearAnimation></Artboard></Rive>')
    import xml.dom.minidom
    PROJECT.mkdir(parents=True, exist_ok=True)
    (PROJECT / 'scene.rml').write_text(xml.dom.minidom.parseString(markup).toprettyxml(indent='  '), encoding='utf-8')


if __name__ == '__main__':
    build()
