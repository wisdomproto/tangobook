"""Publish an inspected local MiniMax clip alongside the Tango comparison page."""
from pathlib import Path
import argparse, json, hashlib, shutil

ap=argparse.ArgumentParser()
ap.add_argument('clip',type=Path)
ap.add_argument('--root',type=Path,default=Path('D:/ComfyUI-output/virtual-parenting-20261006'))
args=ap.parse_args()
if not args.clip.is_file():raise FileNotFoundError(args.clip)
assets=args.root/'tango-v8/video'
assets.mkdir(parents=True,exist_ok=True)
dest=assets/'tango-gagu-minimax.mp4'
if args.clip.resolve()!=dest.resolve():shutil.copy2(args.clip,dest)
workspace=Path(__file__).resolve().parents[2]/'output/virtual-parenting/tango-v8/video'
workspace.mkdir(parents=True,exist_ok=True)
shutil.copy2(dest,workspace/dest.name)
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>탱고 · 가구 블록 놀이 영상</title><style>body{margin:0;background:#eeeae3;color:#25382f;font-family:system-ui}main{max-width:960px;margin:auto;padding:24px}h1{font-size:24px}a{color:#236448}video{display:block;width:min(100%,512px);max-height:76vh;margin:22px auto;background:#141414;border-radius:12px}p{line-height:1.6}.links{display:flex;gap:16px;flex-wrap:wrap}</style><main><h1>가구 단어 맞추기 · MiniMax 시안</h1><p>오른손으로 마지막 모음 블록을 누르고 손을 빼는 5초 시안입니다.<br>같은 집·교구 사진을 참조한 AI 생성 영상입니다.</p><video controls playsinline preload="metadata" poster="tango-v8/detail-photo-v5.png" src="tango-v8/video/tango-gagu-minimax.mp4"></video><div class="links"><a href="tango-v8.html">원본 렌더·사진·3D 비교</a><a href="tango-v8/video/tango-gagu-minimax.mp4" download>영상 다운로드</a></div></main></html>'''
(args.root/'tango-video.html').write_text(html,encoding='utf-8')
Path(__file__).with_name('tango-video.html').write_text(html,encoding='utf-8')
record={'file':str(dest),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'bytes':dest.stat().st_size,'provider':'Local ComfyUI MiniMax H3 first/last-frame I2V','source':'detail-photo-v5.png','prompt':'scripts/virtual-parenting/tango-gagu-fixed-prompt.txt'}
(assets/'selected.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(record,ensure_ascii=False))
