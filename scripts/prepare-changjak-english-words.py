"""Context-sensitive English labels using the already reviewed per-image sense ledger."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'generated-images/activity-completion-20261013'
SOURCE = Path('C:/projects/tangobook/.worktrees/changjak-word-images/generated-images')

def main():
    dictionary = dict(line.split('\t') for line in (ROOT / 'docs/work/games/tasks/20261013-changjak-english-words.tsv').read_text(encoding='utf-8').splitlines() if line.strip())
    books = json.loads(Path('D:/tangobook-inventory/20261012-after-active-word-gap-fill/books.json').read_text(encoding='utf-8'))
    cards = []
    for folder in ['changjak-words', 'changjak-words-11-19']:
        cards += json.loads((SOURCE / folder / 'cards.json').read_text(encoding='utf-8'))
    usages = {(u['bookId'], u['objectName']): c for c in cards for u in c['uses']}
    variants = {'cat-named-nabi': 'Nabi', 'several-kinds': 'kinds', 'leaving': 'leave',
                'one-round': 'turn', 'liquid-drop': 'drop', 'bell': 'bell',
                'windmill-blade': 'blade', 'waterwheel-paddle': 'paddle',
                'water-wheel': 'waterwheel', 'chestnut-bur': 'chestnut bur',
                'chestnut-shell': 'shell', 'coconut-shell': 'shell',
                'leaf-fragment': 'piece of leaf', 'broken-ceramic': 'broken piece',
                'watermelon-slice': 'watermelon slice', 'snow': 'snow'}
    result=[]
    for b in books:
        if not b['id'].startswith('changjak-'): continue
        words=[]
        for k in b.get('key_objects', []):
            c=usages[(b['id'],k['name'])]
            english=variants.get(c['variant'],dictionary[k['korean'] or k['name']])
            context=' '.join(p.get('text','') for p in b['pages'] if p['page_number'] in k['pages'])
            if k['name']=='잠자리' and b['id']=='changjak-coco-22': english='bed'
            if k['name']=='집게': english='clothespin' if b['id']=='changjak-pipo-17' else 'claw'
            if b['id']=='changjak-bung-23' and k['name']=='나무': english='wood'
            if b['id']=='changjak-mei-06' and k['name']=='가위': english='scissors gesture'
            if b['id']=='changjak-mei-06' and k['name']=='바위': english='rock gesture'
            if k['name']=='수염': english='beard'
            if k['name']=='방울' and b['id'].startswith('changjak-bruno-'): english='drop'
            if k['name']=='방울' and b['id'].startswith('changjak-mio-'): english='bubble'
            if k['name']=='앞발' and b['id'].startswith('changjak-dari-'): english='flipper'
            if k['name']=='껍질' and c['variant'] not in variants:
                if any(s in context for s in ['조개','달걀','밤 껍질','밤껍질','땅콩']): english='shell'
                elif '빵' in context: english='crust'
                elif '수박' in context: english='rind'
                elif '나무 껍질' in context or '나무껍질' in context: english='bark'
            words.append({'name':k['name'],'nameEn':english,'sourceCard':c['id'],'sense':c['variant'],
                          'context':context,'existingNameEn':k.get('nameEn','')})
        result.append({'id':b['id'],'title':b['title'],'words':words})
    assert len(result)==850
    assert sum(len(b['words']) for b in result)==3957
    OUT.mkdir(exist_ok=True)
    (OUT/'english-word-plan.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print('850 books / 3957 labels / reviewed source sense ledger reused')

if __name__=='__main__': main()
