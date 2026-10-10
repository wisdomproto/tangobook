"""Preserve a reviewed dense-guide clip and all six actual local image inputs."""
import argparse,hashlib,json,pathlib,shutil,subprocess
ap=argparse.ArgumentParser()
ap.add_argument('clip',type=pathlib.Path)
ap.add_argument('--summary',required=True)
ap.add_argument('--passed',action='store_true')
args=ap.parse_args()
repo=pathlib.Path(__file__).resolve().parents[2]
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out=root/'tango-dense-guides'
local=repo/'output/virtual-parenting/tango-dense-guides'
local.mkdir(parents=True,exist_ok=True)
shutil.copy2(args.clip,out/'ai.mp4')
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out/'ai.mp4')]))
verdict=dict(summary=args.summary,passed=args.passed,raw_source=str(args.clip),sha256=hashlib.sha256(args.clip.read_bytes()).hexdigest(),duration=float(probe['format']['duration']),conditioning='one FL2VA shot: first/last plus four intermediate VAE image guides; no native VIDEO input')
verdict['validation_scope']='Full decode and 21 sampled motion/letter frames; exact CAD geometry and pixel lock not certified'
verdict['photo_cuts_sha256']=hashlib.sha256((out/'photo-cuts.mp4').read_bytes()).hexdigest()
(out/'verdict.json').write_text(json.dumps(verdict,ensure_ascii=False,indent=2),encoding='utf-8')
for name in ['ai.mp4','photo-cuts.mp4','photo-cuts-manifest.json','native.glb','two-block-native.blend','workflow.json','prompt.txt','source-ledger.json','image-generation.json','image-corrections.json','image-validation.json','verdict.json']:
    shutil.copy2(out/name,local/name)
for name in ['keyframes','drafts','review-ai','review-photo-cuts']:
    shutil.copytree(out/name,local/name,dirs_exist_ok=True)
shutil.copy2(repo/'scripts/virtual-parenting/tango-dense-guides.html',root/'tango-dense-guides.html')
print(json.dumps(verdict,ensure_ascii=False))
