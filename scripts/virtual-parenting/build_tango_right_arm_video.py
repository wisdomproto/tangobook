"""Real right-elbow photo guides after a separately verified fixed-length native rig."""
import pathlib,json,shutil,importlib.util
repo=pathlib.Path(__file__).resolve().parents[2]
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out=root/'tango-right-arm'
inputs=pathlib.Path('C:/ComfyUI_windows_portable/ComfyUI/input')
graph=json.loads((root/'tango-dense-guides/workflow.json').read_text(encoding='utf-8'))
names=['empty','grip-g','hover-g','release-g','hover-a','release-a']
for n in names:shutil.copy2(out/'keyframes'/f'{n}.png',inputs/f'tango_right_arm_{n}.png')
for node in graph.values():
    if node['class_type']=='LoadImage':node['inputs']['image']=node['inputs']['image'].replace('tango_dense_','tango_right_arm_')
prompt=graph['10']['inputs']['prompt']+' The acting right ELBOW stays at the far RIGHT edge beside the off-screen right hip, while the right forearm reaches left toward the board. The upper arm runs from that elbow out of frame on the right to the right shoulder. Preserve this actual right-arm chain continuously across pickup and placement. The elbow does not migrate to the bottom center. Forearm has constant physical length, wrist can rotate naturally, elbow bends outward on the right, no reversed elbow and no stretching sleeve. Match the corrected elbow silhouette of all five action photos.'
graph['10']['inputs']['prompt']=prompt
graph['23']['inputs']['noise_seed']=202610630
graph['41']['inputs']['filename_prefix']='tango_right_arm/fixed-elbow-six-guides'
runner_path=pathlib.Path('C:/projects/comfy_test/.claude/worktrees/minimax-image-reference-video-322eac/scripts/minimax_r2v.py')
spec=importlib.util.spec_from_file_location('runner',runner_path);runner=importlib.util.module_from_spec(spec);spec.loader.exec_module(runner);runner.COMFY='http://127.0.0.1:8189'
runner.verify_schema(graph)
(out/'workflow.json').write_text(json.dumps(graph,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'prompt.txt').write_text(prompt,encoding='utf-8')
(out/'source-ledger.json').write_text(json.dumps(dict(kind='FL2VA six corrected real photo states; fixed-length native arm is separately displayed, NOT a native VIDEO input',model=graph['1']['inputs']['unet_name'],seed=202610630,steps=20,frames=124,guide_frames=[0,22,44,66,88,123],scope='mute two-block ㄱㅏ trial; image guides are soft conditions'),ensure_ascii=False,indent=2),encoding='utf-8')
runner.run(graph)
