"""Native video + appearance photo, actual ref2va video conditioning (soft)."""
import importlib.util, json, pathlib, shutil, argparse

repo = pathlib.Path(__file__).resolve().parents[2]
root = pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
ap=argparse.ArgumentParser();ap.add_argument('--experiment',choices=['test','close'],default='test');args=ap.parse_args()
out = root/f'tango-two-block-{args.experiment}'
video_name='tango_two_blocks_native_v2.mp4' if args.experiment=='test' else 'tango_two_blocks_close_native.mp4'
prefix='tango_two_block_test/video-reference-v2' if args.experiment=='test' else 'tango_two_block_close/video-reference'
comfy_input = pathlib.Path('C:/ComfyUI_windows_portable/ComfyUI/input')
shutil.copy2(out/'native.mp4',comfy_input/video_name)
shutil.copy2(root/'tango-turnaround/keyframes/complete.png',comfy_input/'tango_two_blocks_appearance.png')
prompt = '''Make a single continuous real smartphone video following the entire action and exact fixed rear-oblique camera of <Video 1>. Use <Picture 1> only for the real child's identity, clothing, skin, furniture materials and natural home lighting. The VIDEO defines the starting state, block count and placement timing, not the completed board in the photograph. At the beginning the white recognition board is EMPTY; the yellow Hangul blocks are on the desk beside it. The same image-RIGHT hand reaches for and places the square ㄱ block at 1.5 seconds, releases, returns to the desk, then picks and places the narrow ㅏ block beside it at 3.4 seconds to form 가. Only two blocks end on the board. Other tiles remain on the desk. Follow the reference video hand paths and block positions closely. The image-LEFT hand rests on the desk throughout. Exactly two hands and two arms. One physical solid yellow tile with white sticker and bold black character per piece, rigid unchanged glyphs. Preserve the fixed tablet, orange camera reflector, recognition studs, desk edge and seam, shelves, books, room geometry and camera perspective throughout. Tablet has 가구 and the chair/drawer picture, unchanged. No camera movement, no cuts, no change of room or furniture. Natural small child hand movements, real cotton, skin texture, hair and soft daylight. Transform the stylized child into the same real boy of Picture 1, not a plastic doll. No captions, overlays or floating letters.'''
if args.experiment=='close':
    prompt=prompt.replace('fixed rear-oblique camera','fixed CLOSE over-the-shoulder camera')
    prompt+=' The CLOSE FRAMING comes only from Video 1: the recognition board, hands and entire tablet fill most of the image. Do not switch to the wide photograph viewpoint. The child head and torso stay OUTSIDE the close crop; show only the existing sage sleeves and two small hands entering from the bottom. The acting right sleeve enters from the LOWER-RIGHT, and the resting left fingertips stay at the LOWER-LEFT edge.'
spec = importlib.util.spec_from_file_location('minimax_runner', pathlib.Path('C:/projects/comfy_test/.claude/worktrees/minimax-image-reference-video-322eac/scripts/minimax_r2v.py'))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.COMFY='http://127.0.0.1:8189'
graph = runner.build(['tango_two_blocks_appearance.png'],prompt,512,640,124,20,202610610,'match',prefix)
# ref2va model, rather than the previous first/last-frame FL2VA model.
graph['1']['inputs']['unet_name']='minimax_h3_ref2va_pruned_int8_convrot.safetensors'
graph['60']={'class_type':'LoadVideo','inputs':{'file':video_name}}
graph['61']={'class_type':'GetVideoComponents','inputs':{'video':['60',0]}}
graph['10']['inputs']['ref_videos.ref_video_0']=['61',0]
# Use the game's audio after evaluating placement; don't generate audio.
for node in ['4','31']: graph.pop(node,None)
graph['10']['inputs'].pop('audio_vae',None)
graph['40']['inputs'].pop('audio',None)
runner.verify_schema(graph)
(out/'workflow.json').write_text(json.dumps(graph,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'prompt.txt').write_text(prompt,encoding='utf-8')
(out/'source-ledger.json').write_text(json.dumps(dict(native_source='two-block-native.blend',video_reference='native.mp4',appearance_photo='../tango-turnaround/keyframes/complete.png',conditioning='MiniMaxH3ReferenceToVideo.ref_videos.ref_video_0; VAE encoded video; soft reference, not hard structure lock',seed=202610610),indent=2),encoding='utf-8')
print(out/'workflow.json')
