"""Six photoreal states in ONE FL2VA shot; four real intermediate VAE image guides."""
import importlib.util, json, pathlib, shutil

repo = pathlib.Path(__file__).resolve().parents[2]
root = pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out = root/'tango-dense-guides'
keyframes = out/'keyframes'
inputs = pathlib.Path('C:/ComfyUI_windows_portable/ComfyUI/input')
names = ['empty', 'grip-g', 'hover-g', 'release-g', 'hover-a', 'release-a']
indices = [0,22,44,66,88,123]
for name in names:
    source = keyframes/f'{name}.png'
    if not source.is_file():
        raise FileNotFoundError(source)
    shutil.copy2(source, inputs/f'tango_dense_{name}.png')

graph = json.loads((repo/'scripts/virtual-parenting/tango-gagu-fixed-workflow.json').read_text(encoding='utf-8'))
graph['50']['inputs']['image'] = 'tango_dense_empty.png'
graph['51']['inputs']['image'] = 'tango_dense_release-a.png'
prompt = '''One continuous real close-up phone video, fixed camera, of the same small child's RIGHT hand arranging two separate printed yellow tiles. The supplied image guides define successive moments of this ONE shot. Start with the empty board and right hand near the desk. First pinch the square ㄱ tile on the desk, then lift it toward the board, lower and release it at the guided location. Return that SAME right hand to the desk, pick the narrow ㅏ tile, lift it beside the existing ㄱ, lower it immediately to its RIGHT and release. End with exactly the two separate tiles ㄱ then ㅏ on the board. Keep each individual black printed glyph unchanged; never put a complete 가 syllable on one tile. The board count progresses empty, then one square ㄱ, then exactly two separate tiles. All already placed tiles remain fixed. Follow the actual natural skin, soft wrinkled cotton sleeve and ribbed cuff in the photographs, never a rigid cylindrical arm. The acting right sleeve enters from the LOWER RIGHT throughout. The same resting left fingertips stay at the LOWER LEFT; exactly two hands, no additional hand or sleeve. Only fingers, wrist and connected forearm move naturally. Keep the tablet, orange reflector, recognition board, studs, tabletop seam, shelves, books and sunlight unchanged. Tablet shows exactly 가구 above the same chair and teal drawer picture. The camera never moves, no cuts, no zoom, no fading, no new props, no floating text. Natural child finger motions and real cotton folds, ordinary home photograph.'''
graph['10']['inputs'].update(prompt=prompt, width=640, height=800, length=124)
positive = ['10',0]
for i,(name,frame) in enumerate(zip(names[1:-1],indices[1:-1])):
    image_node, guide_node = str(70+i),str(80+i)
    graph[image_node] = {'class_type':'LoadImage','inputs':{'image':f'tango_dense_{name}.png'}}
    graph[guide_node] = {'class_type':'MiniMaxH3AddGuide','inputs':{
        'positive':positive, 'latent':['10',1], 'vae':['3',0],
        'image':[image_node,0], 'frame_idx':frame}}
    positive = [guide_node,0]
graph['20']['inputs']['conditioning'] = positive
graph['22']['inputs']['steps'] = 20
graph['23']['inputs']['noise_seed'] = 202610620
graph['41']['inputs']['filename_prefix'] = 'tango_dense_guides/six-state-shot'

runner_path = pathlib.Path('C:/projects/comfy_test/.claude/worktrees/minimax-image-reference-video-322eac/scripts/minimax_r2v.py')
spec = importlib.util.spec_from_file_location('minimax_runner',runner_path)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.COMFY = 'http://127.0.0.1:8189'
runner.verify_schema(graph)
(out/'workflow.json').write_text(json.dumps(graph,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'prompt.txt').write_text(prompt,encoding='utf-8')
ledger = dict(kind='ONE continuous FL2VA shot with 4 intermediate MiniMaxH3AddGuide images, not stitched clips',
              model=graph['1']['inputs']['unet_name'], seed=202610620, steps=20, width=640,height=800,frames=124,
              guides=[dict(file=f'keyframes/{name}.png',frame=frame,seconds=frame/24) for name,frame in zip(names,indices)],
              original_geometry='../tango-two-block-close/two-block-native.blend',
              conditioning='VAE image guides; no native VIDEO input, no hard geometry lock',
              scope='two-block ㄱ/ㅏ test, not complete four-block 가구 video')
(out/'source-ledger.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2),encoding='utf-8')
print(out/'workflow.json')
