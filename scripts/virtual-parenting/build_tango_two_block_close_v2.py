"""Close retry: consistent empty-board appearance and separate exact tile reference."""
import importlib.util, json, pathlib, shutil

root = pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
previous = root/'tango-two-block-close'
out = root/'tango-two-block-close-v2'
out.mkdir(exist_ok=True)
inputs = pathlib.Path('C:/ComfyUI_windows_portable/ComfyUI/input')
for name in ['native.mp4', 'native.glb', 'two-block-native.blend', 'native-manifest.json']:
    shutil.copy2(previous/name, out/name)
shutil.copytree(previous/'review-native', out/'review-native', dirs_exist_ok=True)
refs = ['tango_close_v2_empty.png', 'tango_close_v2_exact_tiles.png']
sources = [previous/'review-ai/frame-001.png', previous/'native-frames/frame-0124.png']
for ref, source in zip(refs, sources):
    shutil.copy2(source, inputs/ref)
    shutil.copy2(source, out/ref)
shutil.copy2(out/'native.mp4', inputs/'tango_close_v2_motion.mp4')

prompt = '''A single continuous close smartphone video of a child's right hand placing TWO separate yellow tiles on a white recognition board. Video 1 is the complete motion, timing and fixed camera reference. Picture 1 is the EMPTY starting board and the realistic home materials and light, with the same close camera. Picture 2 is ONLY the precise two physical tile shapes, sticker patterns, and their final positions; do not copy its computer-rendered material style.
Start with the recognition board empty. At 1.5 seconds the hand entering from lower RIGHT places and releases the square yellow tile with ONE black ㄱ symbol on its white sticker: a horizontal top stroke joined to a downward stroke on the right, exactly as seen in Picture 2. This tile has ONLY ㄱ, unchanged for the entire video. At 3.4 seconds the SAME right hand places the separate NARROW yellow tile immediately to its right. This second sticker has ONLY the black ㅏ symbol: one long vertical stroke with one short right-facing branch. These are separate printed shapes on two separate rigid physical tiles. Copy the exact sticker patterns from Video 1 and Picture 2. Never draw a complete syllable on either single tile. Do not add a stroke to the first tile when the second tile approaches. The final board has exactly these two separate tiles, as shown in Picture 2.
The acting sleeve and hand enter from the lower RIGHT. The resting LEFT fingertips remain at the lower LEFT desk edge. Exactly two hands. Head and torso stay outside the close crop. The hand picks up actual desk tiles and returns naturally between placements. Other yellow tiles stay on the desk. Follow the video's hand trajectories and placement positions. Preserve the narrow width of the second tile.
The entire black tablet, orange camera reflector, studded board and desk seam stay fixed throughout. Tablet displays the same 가구 word above the existing chair and drawer picture, unchanged. The camera never moves and no cuts occur. Real child's skin and sage cotton sleeve, realistic plastic and wood, natural sunlight. Preserve Picture 1 lighting and Video 1 perspective. No added text, no subtitles, no floating symbols.'''
runner_path = pathlib.Path('C:/projects/comfy_test/.claude/worktrees/minimax-image-reference-video-322eac/scripts/minimax_r2v.py')
spec = importlib.util.spec_from_file_location('minimax_runner', runner_path)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.COMFY = 'http://127.0.0.1:8189'
graph = runner.build(refs, prompt, 512, 640, 124, 24, 202610611, 'match', 'tango_two_block_close_v2/video-reference')
graph['60'] = {'class_type':'LoadVideo', 'inputs':{'file':'tango_close_v2_motion.mp4'}}
graph['61'] = {'class_type':'GetVideoComponents', 'inputs':{'video':['60',0]}}
graph['10']['inputs']['ref_videos.ref_video_0'] = ['61',0]
for node in ['4','31']:
    graph.pop(node, None)
graph['10']['inputs'].pop('audio_vae', None)
graph['40']['inputs'].pop('audio', None)
runner.verify_schema(graph)
(out/'workflow.json').write_text(json.dumps(graph, ensure_ascii=False, indent=2), encoding='utf-8')
(out/'prompt.txt').write_text(prompt, encoding='utf-8')
ledger = dict(native_source='../tango-two-block-close/two-block-native.blend',
              video_reference='native.mp4', image_references=[str(p) for p in sources],
              conditioning='ref2va VAE-encoded native video and two images; soft reference, not hard lock',
              seed=202610611, steps=24, width=512, height=640, frames=124,
              changes='same native camera/action; empty photoreal reference + exact native final tiles; shape-focused prompt; new seed and 24 steps')
(out/'source-ledger.json').write_text(json.dumps(ledger, indent=2), encoding='utf-8')
print(out/'workflow.json')
