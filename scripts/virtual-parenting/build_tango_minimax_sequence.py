"""Create explicit first/last-frame MiniMax graphs from inspected native-based photos."""
import argparse,json,pathlib,shutil
ap=argparse.ArgumentParser();ap.add_argument('segment',type=int,choices=range(1,6));args=ap.parse_args()
repo=pathlib.Path(__file__).resolve().parents[2]
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006/tango-minimax-sequence')
keyframes=root/'keyframes';graphs=root/'graphs';graphs.mkdir(parents=True,exist_ok=True)
if args.segment<5:
    first,last=f'grip-state-{args.segment-1}.png',f'right-state-{args.segment}.png'
    letter=['ㄱ','ㅏ','ㄱ','ㅜ'][args.segment-1]
    action=[
        'pick up ONLY the nearest square ㄱ tile from the waiting row on the left tabletop, lift it clearly off the surface, carry it, and place it at the exact first-consonant location on the upper-left portion of the plate shown by the last image',
        'pick up ONLY the narrow vertical ㅏ vowel tile from the waiting row, lift and carry it, and place it directly to the RIGHT of the existing first ㄱ as seen from the seated child, to compose 가, exactly matching the last image',
        'pick up ONLY the remaining square ㄱ consonant tile in the waiting row, lift and carry it, and place it at the separate second-consonant location to the RIGHT of the 가 group as seen from the seated child, exactly matching the last image',
        'pick up ONLY the last narrow horizontal ㅜ vowel tile in the waiting row, lift and carry it, and place it immediately BELOW the second ㄱ IN THE SAME COLUMN to compose 구, exactly matching the last image; absolutely never put ㅜ beside ㄱ'
    ][args.segment-1]
    prompt=f'''A single continuous real smartphone close-up of a small child playing with rigid physical Korean letter blocks. The first and last photos define the exact scene, objects, camera and final placement. Only the child's actual RIGHT hand (sage sleeve in the lower-left foreground, connected to the right shoulder outside frame) moves. It must {action}. Clear physical pick-up, transport through the air, fingers lower onto the studs, release, then right hand withdraws to its original resting position. The visible foreground hand ALREADY grasps the chosen tile in the first photo. Begin with that SAME hand lifting its held tile, transport through air, place and release by about 3 seconds, then withdraw to the foreground resting position. Never invent a reaching arm from the left edge. No other hand is visible. All already placed blocks remain absolutely stationary at their positions. Board count changes from {args.segment-1} to {args.segment} ONLY by carrying this one real block; no appearance or sliding on its own. One crisp heavy black {letter} glyph stays printed rigidly on the moving white sticker at all times. The other waiting tiles and all nine spare tiles never move or change. The white board, studs, portrait tablet, orange camera mirror and tablet display exactly 가구 above chair and teal chest picture are still. There is ONLY ONE visible hand, the foreground RIGHT hand. That same hand and connected sleeve move from the bottom foreground throughout. The left hand stays entirely outside the frame. Nothing enters from the left edge. No second or third visible hand, no new sleeve, no adult hand. Never keep the foreground hand still while inventing another hand to perform the action. Locked camera, no zoom, no cut, no morphing, no fading, no new props, no letter rewrite or tile duplication. Natural child finger/wrist motion and warm real daylight. Photoreal photograph, never a cartoon or Blender render.'''
else:
    first,last='reaction-rest.png','reaction-happy.png'
    prompt='''One continuous real smartphone shot of the same small boy, following the first and last photographs exactly. His eyes glance slightly down, he smiles naturally and raises his TWO existing arms from the bottom edge of the frame to the final overhead pose. Exactly two arms, two hands with five fingers each. Preserve the same face, haircut, sage cotton sweatshirt, shoulders, seated torso, doorway, wood shelf and books. Absolutely NOTHING else appears or moves. Background remains unchanged. No words, no text, no letters, no captions, no overlays, no graphics, no toys, no tiles, no floating objects, no picture-in-picture. Camera completely still. Natural unposed child happiness, gentle smile and small joyful arm lift.'''
g=json.loads((repo/'scripts/virtual-parenting/tango-gagu-fixed-workflow.json').read_text(encoding='utf-8'))
for node,file in [('50',first),('51',last)]:
    src=keyframes/file
    if not src.is_file():raise FileNotFoundError(src)
    name='tango_sequence_'+file
    shutil.copy2(src,pathlib.Path('C:/ComfyUI_windows_portable/ComfyUI/input')/name)
    g[node]['inputs']['image']=name
g['10']['inputs'].update(prompt=prompt,width=640,height=800,length=124)
g['23']['inputs']['noise_seed']=(202610400 if args.segment==5 else 202610300)+args.segment
g['41']['inputs']['filename_prefix']=f'tango_minimax_sequence/grip-segment-{args.segment}'
dest=graphs/f'grip-segment-{args.segment}.json'
dest.write_text(json.dumps(g,ensure_ascii=False,indent=2),encoding='utf-8')
(graphs/f'grip-segment-{args.segment}.txt').write_text(prompt,encoding='utf-8')
print(dest)
