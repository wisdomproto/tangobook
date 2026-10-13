"""Build a private Kaggle notebook from a selected local H3 shot.

No credentials, production book JSON, or full films are included. The selected
reference PNG and ComfyUI graph are intentionally embedded for this test.
Large embedded references exceed Kaggle's 1 MB version-save limit; replace
the reference cell with a local-upload read before saving a reusable version.
Experimental FP16 produced all-black frames on the tested T4 configuration.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path

COMFY_COMMIT = '8ff6dc384ba5c410266b40e137799e049459d4f2'


def cell(source, markdown=False):
    result = dict(cell_type='markdown' if markdown else 'code', metadata={},
                  source=source.strip() + '\n')
    if not markdown:
        result.update(execution_count=None, outputs=[])
    return result


def build(reference, graph_path, experimental_fp16=False):
    graph = json.loads(graph_path.read_text(encoding='utf-8'))
    image = reference.read_bytes()
    image_sha = hashlib.sha256(image).hexdigest()
    assert graph['1']['inputs']['unet_name'] == 'minimax_h3_ref2va_pruned_w4a8_mixed.safetensors'
    assert graph['50']['inputs']['image'] == reference.name
    assert graph['10']['inputs']['length'] % 17 == 5
    assert (graph['10']['inputs']['width'], graph['10']['inputs']['height'],
            graph['10']['inputs']['length'], graph['40']['inputs']['fps'],
            graph['22']['inputs']['steps'], graph['23']['inputs']['noise_seed']) == (
                1024, 576, 141, 24, 8, 610450), 'Graph must match the fixed comparison settings'
    graph['41']['inputs']['filename_prefix'] = 'tangobook_h3_test/w4a8'
    cells = [cell('''# TangoBook MiniMax H3 GPU Test
Private compatibility and timing test. Use GPU T4 x2 and Internet ON.
The baseline uses the supplied local scene graph (1024×576,
141 frames, 24fps, 8 steps, seed 610450). It uses GPU 0 initially;
two GPUs are not treated as a single 32GB device.
Models and dependencies are temporary. Only reports, logs and generated clips
are retained under /kaggle/working. No paid service or public tunnel is used.
W6A8 is a separate manual comparison after the W4A8 test passes.
Stock H3 supports BF16/FP32. T4 lacks native BF16, so --fp16-unet alone
still falls back to FP32 computation. The optional experimental FP16 override
changes only the temporary H3 dtype declaration and requires visual validation.
''', True)]
    cells.append(cell('''import json, os, sys, time, subprocess, shutil, hashlib, urllib.request, urllib.error
from pathlib import Path
import psutil, torch
OUT = Path('/kaggle/working/tangobook-h3-test'); OUT.mkdir(parents=True, exist_ok=True)
TEMP = Path('/kaggle/temp/tangobook-h3-test'); TEMP.mkdir(parents=True, exist_ok=True)
COMFY = TEMP / 'ComfyUI'
report = {'status': 'preflight', 'started_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
          'torch': torch.__version__, 'cuda': torch.version.cuda,
          'ram_gib': psutil.virtual_memory().total / 2**30, 'gpus': []}
for i in range(torch.cuda.device_count()):
    p = torch.cuda.get_device_properties(i)
    report['gpus'].append({'index': i, 'name': p.name, 'vram_gib': p.total_memory / 2**30,
                           'capability': list(torch.cuda.get_device_capability(i))})
print(json.dumps(report, indent=2), flush=True)
assert report['gpus'], 'No CUDA GPU allocated'
assert report['gpus'][0]['vram_gib'] > 12, 'GPU has insufficient memory for this test'
assert shutil.disk_usage(TEMP).free > 40 * 2**30, 'Need 40GiB temporary disk for models/setup'
def save_report():
    (OUT/'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
save_report()
'''))
    cells.append(cell(f'''# Official ComfyUI source, pinned to the locally verified revision.
def command(args, cwd=None):
    result = subprocess.run(args, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    with (OUT/'setup.log').open('a', encoding='utf-8') as f: f.write(result.stdout)
    print(result.stdout[-5000:], flush=True)
    result.check_returncode()
if not COMFY.exists():
    command(['git','clone','https://github.com/Comfy-Org/ComfyUI.git',str(COMFY)])
command(['git','checkout','{COMFY_COMMIT}'], cwd=COMFY)
command([sys.executable,'-m','pip','install','--no-cache-dir','-r',str(COMFY/'requirements.txt'), 'huggingface_hub'])
report['comfy_commit'] = '{COMFY_COMMIT}'
report['status'] = 'environment_ready'; save_report()
'''))
    cells.append(cell('''from huggingface_hub import HfApi, hf_hub_download
api = HfApi()
revisions = {}
def download(repo, filename, folder):
    if repo not in revisions: revisions[repo] = api.model_info(repo).sha
    started = time.monotonic()
    path = Path(hf_hub_download(repo_id=repo, filename=filename, revision=revisions[repo],
                               local_dir=str(TEMP/'downloads'/repo.replace('/','--'))))
    dest = COMFY/'models'/folder/path.name; dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists(): dest.symlink_to(path)
    item = {'repo': repo, 'revision': revisions[repo], 'filename': filename,
            'bytes': path.stat().st_size, 'download_seconds': round(time.monotonic()-started,2)}
    with path.open('rb') as f: item['sha256'] = hashlib.file_digest(f,'sha256').hexdigest()
    report.setdefault('model_files', []).append(item); save_report()
    print('MODEL READY', filename, item['bytes'], flush=True)
    return path
download('Kijai/MiniMax-H3-experimental','minimax_h3_ref2va_pruned_w4a8_mixed.safetensors','diffusion_models')
download('Comfy-Org/MiniMax-H3','text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors','text_encoders')
download('Comfy-Org/MiniMax-H3','vae/minimax_h3_video_vae_fp16.safetensors','vae')
download('Comfy-Org/MiniMax-H3','vae/minimax_h3_audio_vae_fp32.safetensors','vae')
lora_source = download('larryvrh/MiniMax-H3-Turbo-Lora','minimax_h3_turbo_v4_step600_ema.safetensors','loras')
# Apply the same compatibility filter used locally for pruned H3's AdaLN input.
from safetensors.torch import load_file, save_file
tensors = load_file(str(lora_source), device='cpu')
drop = [k for k in tensors if '.adaln_proj.linear.' in k]
assert len(drop) == 102, 'Unexpected LoRA structure; do not silently change baseline'
kept = {k:v for k,v in tensors.items() if k not in drop}
assert len(kept) == 416
save_file(kept, str(COMFY/'models/loras/cinderella30_h3_turbo_pruned_compatible.safetensors'),
          metadata={'source': lora_source.name, 'reason': 'Pruned AdaLN has input width 8; original adapter has width 2688. These 51 module patches already fail and contribute no delta in ComfyUI. Keep the 208 other module patches unchanged.'})
with (COMFY/'models/loras/cinderella30_h3_turbo_pruned_compatible.safetensors').open('rb') as filtered_lora_stream:
    report['filtered_lora_sha256'] = hashlib.file_digest(filtered_lora_stream, 'sha256').hexdigest()
report['lora_filter'] = {'dropped_tensor_keys':len(drop), 'kept_tensor_keys':len(kept), 'strength':1.0}
del tensors, kept
import gc; gc.collect()
report['status'] = 'models_ready'; save_report()
'''))
    cells.append(cell(f'''import base64
reference_bytes = base64.b64decode({base64.b64encode(image).decode('ascii')!r})
assert hashlib.sha256(reference_bytes).hexdigest() == {image_sha!r}
(COMFY/'input').mkdir(exist_ok=True)
(COMFY/'input'/{reference.name!r}).write_bytes(reference_bytes)
del reference_bytes
graph = json.loads({json.dumps(graph, ensure_ascii=False)!r})
report['reference_sha256'] = {image_sha!r}
report['settings'] = {{'width':1024,'height':576,'frames':141,'fps':24,'steps':8,'seed':610450}}
(OUT/'baseline-graph.json').write_text(json.dumps(graph,indent=2),encoding='utf-8')
save_report()
'''))
    cells.append(cell('''# No tunnel: the ComfyUI API listens only on the notebook's loopback interface.
port = 8188
URL = f'http://127.0.0.1:{port}'
def request(path, data=None):
    payload = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(URL+path, data=payload, headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=45) as r: return json.load(r)
comfy_log = (OUT/'comfy.log').open('a',encoding='utf-8')
proc = subprocess.Popen([sys.executable,'main.py','--listen','127.0.0.1','--port',str(port),
                          '--fp16-unet','--fp16-text-enc','--use-pytorch-cross-attention',
                          '--disable-smart-memory','--output-directory',str(OUT/'clips')],
                         cwd=COMFY, stdout=comfy_log, stderr=subprocess.STDOUT)
for attempt in range(120):
    if proc.poll() is not None:
        raise RuntimeError((OUT/'comfy.log').read_text()[-10000:])
    try:
        schema = request('/object_info'); break
    except (OSError, ValueError): time.sleep(2)
else: raise RuntimeError('ComfyUI did not become ready within 4 minutes')
for node in graph.values():
    assert node['class_type'] in schema, 'Missing node: '+node['class_type']
print('COMFY READY', flush=True)
report['status'] = 'comfy_ready'; save_report()
'''))
    cells.append(cell(r'''def run_test(test_graph, label, timeout_seconds=3600):
    started = time.monotonic()
    response = request('/prompt', {'prompt':test_graph})
    if 'prompt_id' not in response: raise RuntimeError(response)
    pid = response['prompt_id']
    report['status'] = 'generating'; report['active_prompt_id'] = pid; save_report()
    print('GENERATING', label, pid, flush=True)
    history = None
    while time.monotonic()-started < timeout_seconds:
        if proc.poll() is not None: raise RuntimeError('ComfyUI exited; inspect comfy.log')
        try:
            history = request('/history/'+pid)
        except (TimeoutError, urllib.error.URLError) as e:
            print('History polling delayed; keeping existing prompt:',type(e).__name__,flush=True)
            time.sleep(30)
            continue
        elapsed = time.monotonic()-started
        telemetry = subprocess.run(['nvidia-smi','--query-gpu=index,name,memory.used,utilization.gpu,power.draw,utilization.memory',
                                    '--format=csv,noheader,nounits'],capture_output=True,text=True).stdout.strip()
        with (OUT/'telemetry.log').open('a',encoding='utf-8') as f:
            f.write(f'{label} {elapsed:.1f}s RAM_used_GiB={psutil.virtual_memory().used/2**30:.2f} '+telemetry.replace('\n',' | ')+'\n')
        if pid in history: break
        print(f'{label} {elapsed/60:.1f} min | {telemetry.replace(chr(10)," | ")}',flush=True)
        active_log = OUT/('comfy-w6a8.log' if label == 'w6a8' else 'comfy.log')
        if active_log.exists():
            progress_lines = [line for line in active_log.read_text(errors='replace').splitlines()
                              if 'it/s' in line or 's/it' in line]
            if progress_lines: print('SAMPLER',progress_lines[-1][-250:],flush=True)
        time.sleep(30)
    else:
        request('/interrupt',{}); raise TimeoutError('Test reached 60 minute cap')
    entry = history[pid]
    (OUT/(label+'-history.json')).write_text(json.dumps(entry,indent=2),encoding='utf-8')
    if entry.get('status',{}).get('status_str') == 'error':
        raise RuntimeError(entry['status']['messages'])
    clips = list((OUT/'clips').rglob('*.mp4'))
    assert clips, 'History returned but no MP4 was saved'
    clip = max(clips,key=lambda p:p.stat().st_mtime)
    import av
    count = 0
    black_frames = []
    with av.open(str(clip)) as video:
        stream = video.streams.video[0]
        width,height,fps = stream.width,stream.height,float(stream.average_rate)
        for frame in video.decode(video=0):
            pixels = frame.to_ndarray(format='rgb24')
            if pixels.max() == 0: black_frames.append(count)
            count += 1
    assert (width,height,count,fps) == (1024,576,141,24.0), (width,height,count,fps)
    assert not black_frames, f'All-black decoded frames: {black_frames}'
    result = {'label':label,'generation_seconds':round(time.monotonic()-started,2),
              'clip':str(clip.relative_to(OUT)),'width':width,'height':height,'frames':count,'fps':fps,
              'black_frames':black_frames,'manual_review':'pending'}
    with clip.open('rb') as f: result['sha256'] = hashlib.file_digest(f,'sha256').hexdigest()
    report.setdefault('tests',[]).append(result); report['status']='baseline_passed'; save_report()
    print(json.dumps(result,indent=2),flush=True)
    from IPython.display import Video, display
    display(Video(str(clip), embed=True))
    return result
try:
    baseline_result = run_test(graph,'w4a8')
except Exception as e:
    report['status']='failed'; report['error']=str(e)[-12000:]; save_report(); raise
finally:
    proc.terminate()
    try: proc.wait(timeout=30)
    except subprocess.TimeoutExpired: proc.kill(); proc.wait()
    comfy_log.close()
print('Test process stopped. Stop the Kaggle session after saving/downloading results.')
'''))
    if experimental_fp16:
        cells[0]['source'] += '\nThis notebook enables the experimental H3 FP16 override.\n'
        cells[2]['source'] += '''
source_file = COMFY/'comfy/supported_models.py'
source_text = source_file.read_text()
before = source_text.index('class MiniMaxH3(')
after = source_text.index('\\nclass ',before+1)
block = source_text[before:after]
old = 'supported_inference_dtypes = [torch.bfloat16, torch.float32]'
new = 'supported_inference_dtypes = [torch.bfloat16, torch.float16, torch.float32]'
if old in block:
    assert block.count(old) == 1
    patched = source_text[:before]+block.replace(old,new)+source_text[after:]
    compile(patched,str(source_file),'exec')
    source_file.write_text(patched)
else:
    assert new in block, 'Unexpected H3 dtype declaration'
report['experimental_h3_fp16_override'] = True
report['h3_runtime_source_sha256'] = hashlib.sha256(source_file.read_bytes()).hexdigest()
report['compiler_disabled'] = True
save_report()
'''
        cells[5]['source'] = cells[5]['source'].replace(
            "'--disable-smart-memory','--output-directory'",
            "'--disable-smart-memory','--disable-comfy-compiler','--output-directory'")
        cells[6]['source'] = cells[6]['source'].replace(
            "run_test(graph,'w4a8')", "run_test(graph,'w4a8_fp16_experimental')")
    return dict(nbformat=4,nbformat_minor=5,metadata={
        'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},
        'language_info':{'name':'python'}},cells=cells)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--reference', type=Path, required=True)
    parser.add_argument('--graph', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--experimental-fp16', action='store_true',
                        help='Diagnostic only: temporary FP16 override produced black frames on T4; not production-safe')
    args = parser.parse_args()
    notebook = build(args.reference,args.graph,args.experimental_fp16)
    for index,c in enumerate(notebook['cells']):
        if c['cell_type']=='code': compile(c['source'],f'cell-{index}','exec')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(notebook,ensure_ascii=False,indent=1),encoding='utf-8')
    print(f'Built {args.output}: {len(notebook["cells"])} cells; code syntax passed')
