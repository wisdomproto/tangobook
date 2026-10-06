"""Requeue deferred local requests only after their original server has exited."""
import importlib.util
import json
import shutil
import urllib.error
import urllib.request
from pathlib import Path
from PIL import Image

spec = importlib.util.spec_from_file_location('production',Path(__file__).with_name('classic-scene-coloring.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
jobs = json.loads((m.ROOT/'manifest.json').read_text(encoding='utf-8'))
for j in jobs:
    if j['status'] != 'waiting-original-server':
        continue
    original = j['promptEndpoint']
    try:
        urllib.request.urlopen(original+'/queue',timeout=3).close()
    except urllib.error.URLError as error:
        reason = error.reason
        if not isinstance(reason,ConnectionRefusedError) and getattr(reason,'winerror',None) != 10061:
            raise RuntimeError('Original request remains unconfirmed; do not requeue') from error
    else:
        raise RuntimeError('Original server still responds; recover its history first')
    graph = json.loads((m.ROOT/'workflows'/(j['key']+'.json')).read_text(encoding='utf-8'))
    prefix = Path('D:/ComfyUI-output/qwen21-mermaid-test')/graph['9']['inputs']['filename_prefix']
    for file in prefix.parent.glob(prefix.name+'_*.png'):
        with Image.open(file) as image:
            if json.loads(image.info.get('prompt','{}')) == graph:
                raise RuntimeError('Matching completed artifact found; inspect before regenerating: '+str(file))
    archive = m.ROOT/'revisions'/'original-server-exited'/j['key']
    archive.mkdir(parents=True,exist_ok=True)
    m.save(archive/'job.json',j)
    for folder,suffix in [('lineart','.png'),('workflows','.json'),('history','.json')]:
        source = m.ROOT/folder/(j['key']+suffix)
        if source.exists():
            shutil.copyfile(source,archive/(folder+suffix))
    j.setdefault('supersededSubmissions',[]).append({'promptId':j['promptId'],'endpoint':original,'phase':j['resumePhase'],'reason':'Original server exited; connection refused; no matching completed artifact'})
    j['status'] = 'color-repair-needed' if j['resumePhase']=='color-repairing' else 'pending'
    j.pop('promptId',None)
    j.pop('promptEndpoint',None)
    j.pop('deferReason',None)
    print('Recovered for regeneration:',j['key'],j['status'])
m.save(m.ROOT/'manifest.json',jobs)
