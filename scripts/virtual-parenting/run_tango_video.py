"""Run a saved Tango MiniMax graph through the existing local ComfyUI runner."""
import argparse,importlib.util,json
from pathlib import Path

ap=argparse.ArgumentParser();ap.add_argument('graph',type=Path);ap.add_argument('--url',default='http://127.0.0.1:8189');a=ap.parse_args()
runner=Path('C:/projects/comfy_test/.claude/worktrees/minimax-image-reference-video-322eac/scripts/minimax_r2v.py')
spec=importlib.util.spec_from_file_location('minimax_runner',runner);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);module.COMFY=a.url
graph=json.loads(a.graph.read_text(encoding='utf-8'));module.verify_schema(graph);module.run(graph)
