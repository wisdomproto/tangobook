"""Preserve the selected experiment and publish only to the local review page."""
import argparse, hashlib, json, pathlib, shutil, subprocess

ap=argparse.ArgumentParser()
ap.add_argument('clip',type=pathlib.Path)
ap.add_argument('--summary',required=True)
ap.add_argument('--passed',action='store_true')
ap.add_argument('--experiment',choices=['test','close','close-v2'],default='test')
args=ap.parse_args()
repo=pathlib.Path(__file__).resolve().parents[2]
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out=root/f'tango-two-block-{args.experiment}'
local=repo/f'output/virtual-parenting/tango-two-block-{args.experiment}'
local.mkdir(parents=True,exist_ok=True)
shutil.copy2(args.clip,out/'ai.mp4')
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out/'ai.mp4')]))
verdict=dict(summary=args.summary,passed=args.passed,conditioning='video reference, not hard spatial lock',raw_source=str(args.clip),sha256=hashlib.sha256(args.clip.read_bytes()).hexdigest(),duration=float(probe['format']['duration']))
(out/'verdict.json').write_text(json.dumps(verdict,ensure_ascii=False,indent=2),encoding='utf-8')
for name in ['ai.mp4','native.mp4','native.glb','two-block-native.blend','workflow.json','prompt.txt','source-ledger.json','native-manifest.json','verdict.json']:
    shutil.copy2(out/name,local/name)
for path in out.glob('tango_close_v2_*.png'):
    shutil.copy2(path,local/path.name)
for folder in ['review-native','review-ai']:
    target=local/folder
    target.mkdir(exist_ok=True)
    for path in (out/folder).glob('*'):
        if path.name.startswith('contact-') or path.name=='probe.json': shutil.copy2(path,target/path.name)
page=f'tango-two-block-{args.experiment}.html'
shutil.copy2(repo/'scripts/virtual-parenting'/page,root/page)
print(json.dumps(verdict,ensure_ascii=False))
