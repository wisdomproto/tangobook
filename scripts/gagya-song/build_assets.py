"""Build native Rive mouth, locomotive machinery, and jointed Hangul dancer.

Generated PNGs are embedded unchanged; all moving parts are native Rive nodes.
Run from any directory. The original song and PNGs must already be staged.
"""
from pathlib import Path
import sys
import json
import math
import shutil
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/rive-hangul'))
from build_scene import shape, keyed

ASSETS = ROOT / 'packages/remotion/public/gagya-song-20261015'
PROJECT = ROOT / 'output/gagya-song-20261015/rive'
CLI = Path.home() / '.codex/tools/rive-cli/rive.exe'
FPS = 60
PHONEMES=json.loads((ASSETS/'phoneme-timing.json').read_text(encoding='utf-8'))
ROWS=PHONEMES['rows']
ENDS=PHONEMES['ends']
LETTERS = list('가갸거겨고교구규그기')
COLORS = ['#ef7658', '#ec8e34', '#6e8cdc', '#a47be2', '#34ae9a',
          '#439cc3', '#e3699c', '#9a7ac9', '#658e60', '#d59e2b']


def animation(name, motion, duration, ident, loop='oneShot'):
    return (f'<LinearAnimation name="{name}" duration="{duration}" fps="60" '
            f'loopValue="{loop}" id="0:{ident}">{motion}</LinearAnimation>')


def artboard(name, width, height, ident, contents):
    controller = (f'<StateMachine name="{name} controller" id="0:{ident+6}">'
                  f'<StateMachineLayer name="Playback" id="0:{ident+7}">'
                  '<AnyState x="0" y="-100"/><ExitState x="500" y="-100"/>'
                  f'<EntryState x="0" y="0"><StateTransition stateToId="0:{ident+8}"/></EntryState>'
                  f'<AnimationState x="250" y="0" animationId="0:{ident+5}" id="0:{ident+8}"/>'
                  '</StateMachineLayer></StateMachine>')
    return (f'<Artboard name="{name}" width="{width}" height="{height}" '
            f'x="{(ident//100-1)*800}" y="0" '
            f'id="0:{ident}" styleId="0:{ident+1}" defaultStateMachineId="0:{ident+6}">'
            f'<LayoutComponentStyle name="Style" id="0:{ident+1}"/>{controller}{contents}</Artboard>')


def mouth():
    # First sibling is foremost. Lip ring covers the oral-cavity boundary.
    contents = ('<Node name="Articulating lips" x="320" y="250" id="0:110">'
                '<Image name="Imagegen lip ring" assetId="0:90" scaleX="0.37" scaleY="0.37"/>'
                + shape('Upper teeth', 0, -72, 240, 33, 'FFFFFCF0', 'Rectangle', radius=15)
                + shape('Tongue highlight', 0, 83, 102, 25, 'FFFFA4A7')
                + shape('Tongue', 0, 86, 173, 82, 'FFEA6783')
                + shape('Dark oral cavity', 0, 0, 470, 285, 'FF6F243B')
                + '</Node>')
    # Width / aperture poses distinguish open, rounded, and spread vowels.
    poses = [(1, .94), (1, 1.02), (.98, .78), (.98, .87), (.66, .87),
             (.66, .94), (.61, .76), (.61, .84), (1.1, .32), (1.15, .42)]
    values={16:[],17:[],15:[]}
    for frame in range(665):
        t=frame/30
        active=next(((r,i) for r,row in enumerate(ROWS) for i,start in enumerate(row)
                     if start<=t<(row[i+1] if i<9 else ENDS[r])),None)
        level=PHONEMES['aperture'][min(frame,663)]
        sx,sy=poses[active[1]] if active else (1,.18)
        opening=.12+(sy-.12)*level if active else .12
        f=frame*2
        # Hold the old shape through the preceding video frame; switch the new
        # vowel pose on exactly the same frame as the Remotion lyric.
        if frame:
            for prop in values: values[prop].append((f-1,values[prop][-1][1]))
        values[16].append((f,sx))
        values[17].append((f,opening))
        values[15].append((f,0))
    return artboard('Singing mouth', 640, 500, 100,
                    contents + animation('Articulation', keyed(110, values), 1328, 105))


def wheel(x, ident):
    spokes = ''.join(shape(f'Spoke {i}', 0, 0, 69, 9, 'FFE6D8B7', 'Rectangle',
                            radius=4, rotation=i*math.pi/3) for i in range(3))
    return (f'<Node name="Wheel {ident}" x="{x}" y="305" id="0:{ident}">'
            + shape('Crank pin', 22, 0, 14, 14, 'FFFFF6CE')
            + shape('Hub', 0, 0, 23, 23, 'FF6C6189') + spokes
            + shape('Rim', 0, 0, 83, 83, 'FF8B7DB1')
            + shape('Tire', 0, 0, 101, 101, 'FF3C465D') + '</Node>')


def train():
    # Original generated locomotive is wheel-free. Machinery is native vector.
    body = ('<Node name="Locomotive suspension" id="0:210">'
            + shape('Eye glint', 535, 177, 5, 5, 'FFFFFFFF')
            + shape('Headlight eye', 532, 180, 13, 18, 'FF34364A')
            + '<Image name="Imagegen engine body" assetId="0:91" x="320" y="172" scaleX="0.36" scaleY="0.36"/>'
            + '</Node>')
    machinery = (wheel(190, 220) + wheel(450, 221)
                 + '<Node name="Piston linkage" id="0:222">'
                 + shape('Piston highlights', 320, 303, 257, 8, 'FFFFF6CE', 'Rectangle', radius=4)
                 + shape('Connecting rod', 320, 305, 270, 17, 'FFDF8A56', 'Rectangle', radius=8)
                 + '</Node>')
    steam, steam_motion = '', ''
    for i in range(4):
        ident = 240+i
        steam += shape(f'Steam puff {i}', 470-i*27, 55-i*16, 37+i*10, 32+i*8,
                       'FFFFFCF1', ident=ident, opacity=.7)
        steam_motion += keyed(ident, {
            13: [(0, 465-i*27), (120, 350-i*27)],
            14: [(0, 53-i*16), (120, 10-i*18)],
            18: [(0, .05), (24, .8), (90, .6), (120, .05)],
            16: [(0, .4), (120, 1.5)], 17: [(0, .4), (120, 1.5)]})
    motion = keyed(220, {15:[(0, 0), (120, 8*math.pi)]})
    motion += keyed(221, {15:[(0, 0), (120, 8*math.pi)]})
    pairs = list(range(0, 121, 5))
    motion += keyed(222, {
        13: [(f, 22*math.cos(f/120*8*math.pi)) for f in pairs],
        14: [(f, 22*math.sin(f/120*8*math.pi)) for f in pairs]})
    motion += keyed(210, {14:[(f, -4*abs(math.sin(f/120*8*math.pi))) for f in pairs]})
    return artboard('Locomotive', 640, 370, 200,
                    steam + machinery + body
                    + animation('Wheels pistons steam', motion+steam_motion, 120, 205, 'loop'))


def dancer():
    old = ET.parse(ROOT/'output/rive-hangul-20261012/scene.rml').getroot()
    node = old.find('.//Node[@id="0:20"]')
    node.set('x', '285'); node.set('y', '265')
    # Remap original node IDs into this artboard's namespace.
    for el in node.iter():
        if el.text and not el.text.strip():
            el.text = None
        if el.tail and not el.tail.strip():
            el.tail = None
        if 'id' in el.attrib:
            el.set('id', f'0:{int(el.get("id").split(":")[1])+300}')
        if 'assetId' in el.attrib:
            el.set('assetId', '0:92')
    duration = 212
    frames = list(range(0, duration+1, 4))
    frames += [duration] if frames[-1] != duration else []
    def wave(f): return math.sin(2*math.pi*f/53)
    motion = keyed(320, {
        13:[(f,285+24*math.sin(2*math.pi*f/106)) for f in frames],
        14:[(f,265-35*abs(wave(f))) for f in frames],
        15:[(f,.10*math.sin(2*math.pi*f/106)) for f in frames],
        16:[(f,1+.035*wave(f)) for f in frames],
        17:[(f,1-.035*wave(f)) for f in frames]})
    for ident, bias, amp in [(340,.8,.7),(342,-.8,-.7),(341,-.3,.4),(343,.3,-.4),
                             (350,0,.45),(352,0,-.45),(351,0,.32),(353,0,-.32)]:
        motion += keyed(ident, {15:[(f,bias+amp*wave(f)) for f in frames]})
    return artboard('Dancing giyok', 640, 640, 300,
                    ET.tostring(node, encoding='unicode')
                    + animation('Beat dance', motion, duration, 305, 'loop'))


def main():
    PROJECT.mkdir(parents=True, exist_ok=True)
    for file in ['lips.png', 'engine.png']:
        shutil.copy2(ASSETS/file, PROJECT/file)
    shutil.copy2(ROOT/'packages/remotion/public/hangul-sample-20261012/giyok-body.png', PROJECT/'giyok-body.png')
    cues = []
    for row_index, row in enumerate(ROWS):
        for index, start in enumerate(row):
            cues.append({'row':row_index, 'index':index, 'text':LETTERS[index],
                         'start':start, 'end':row[index+1] if index<9 else ENDS[row_index]})
    data = {'fps':30, 'duration':22.12, 'frames':664, 'letters':LETTERS, 'colors':COLORS,
            'rows':ROWS, 'ends':ENDS, 'cues':cues,
            'timingEvidence':PHONEMES['method'], 'revision':2}
    (ASSETS/'timing.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    markup = ('<Rive version="1" kind="fragment">'
              '<ImageAsset file="lips.png" name="Generated lips" id="0:90"/>'
              '<ImageAsset file="engine.png" name="Generated engine" id="0:91"/>'
              + mouth()+train()+'</Rive>')
    import xml.dom.minidom
    (PROJECT/'scene.rml').write_text(xml.dom.minidom.parseString(markup).toprettyxml(indent='  '),encoding='utf-8')
    (PROJECT/'rive.yaml').write_text('name: gagya-song\nlogs:\n  file: build/rive.log\n  problems: build/problems.log\n',encoding='utf-8')
    subprocess.run([str(CLI), str(PROJECT), '--verify'],check=True)
    subprocess.run([str(CLI), str(PROJECT), '--once'],check=True)
    shutil.copy2(PROJECT/'build/gagya-song.riv', ASSETS/'gagya-song.riv')
    for file in ['lips.png','engine.png']:
        im=Image.open(ASSETS/file)
        assert im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0
    print('Built 2 native Rive artboards, 40 synchronized lyric cues and vocal aperture.')


if __name__ == '__main__':
    main()
