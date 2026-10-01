"""Queue a selected local Qwen correction without mutating the batch manifest."""
import importlib.util,json,pathlib,time,urllib.request,urllib.parse,argparse,shutil
spec=importlib.util.spec_from_file_location('production',pathlib.Path(__file__).with_name('classic-scene-coloring.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
p=argparse.ArgumentParser();p.add_argument('key');p.add_argument('instruction');p.add_argument('--lineart',action='store_true');args=p.parse_args()
j=next(j for j in json.loads((m.ROOT/'manifest.json').read_text(encoding='utf-8')) if j['key']==args.key)
g=json.loads((m.ROOT/'workflows'/(args.key+'.json')).read_text(encoding='utf-8'))
name=('classic-color-removal-' if args.lineart else 'classic-repair-source-')+args.key+'.png'
# An applied repair replaces the stored graph, whose LoadImage may point to a
# previous line drawing. Select the actual manifest asset for every new repair.
shutil.copyfile(m.ROOT/j['lineartFile' if args.lineart else 'sourceFile'],pathlib.Path('C:/ComfyUI_windows_portable/ComfyUI/input')/name)
g['4']['inputs']['image']=name
g['5']['inputs']['prompt']=args.instruction if args.lineart else args.instruction+'\n'+m.PROMPT
g['7']['inputs']['seed']+=1
g['9']['inputs']['filename_prefix']='classic-scene-coloring-repairs/'+args.key
m.save(m.ROOT/'repairs'/(args.key+'-workflow.json'),g)
pid=m.request(m.COMFY+'/prompt',{'prompt':g,'client_id':'classic-scene-coloring-repair'})['prompt_id']
print('REPAIR',args.key,pid,flush=True)
start=time.monotonic()
while time.monotonic()-start<1800:
    time.sleep(3);hist=m.request(m.COMFY+'/history/'+pid)
    if pid not in hist:continue
    h=hist[pid];m.save(m.ROOT/'repairs'/(args.key+'-history.json'),h)
    if h['status']['status_str']!='success':raise RuntimeError(h['status'])
    output=h['outputs']['9']['images'][0]
    with urllib.request.urlopen(m.COMFY+'/view?'+urllib.parse.urlencode(output),timeout=120) as r:
        (m.ROOT/'repairs'/(args.key+'.png')).write_bytes(r.read())
    print('REPAIRED',args.key,flush=True);break
else:raise TimeoutError(pid)
