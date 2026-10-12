"""Prepare all 19 series for local narration; GET only, no operating writes.

Checks current Korean against reviewed translations before copying any completed
audio. Old roots are read only. Reuse requires current recipe AND MP3/WAV hashes.
"""
import argparse
import concurrent.futures
import importlib.util
import pathlib
import shutil
import time
import urllib.request
import json

spec=importlib.util.spec_from_file_location('tts',pathlib.Path(__file__).with_name('changjak-voicebox-tts.py'))
tts=importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)


def copy_checked(src,dst):
    dst.parent.mkdir(parents=True,exist_ok=True)
    if dst.exists():
        if tts.digest(src.read_bytes())!=tts.digest(dst.read_bytes()):
            raise ValueError(f'Preserve conflicting output: {dst}')
    else:
        shutil.copy2(src,dst)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=pathlib.Path,default=pathlib.Path('D:/tangobook-audio/changjak-series-01-19-20261004'))
    parser.add_argument('--source-roots',nargs=2,type=pathlib.Path,default=[pathlib.Path('D:/tangobook-audio/changjak-series-01-10-20261004'),pathlib.Path('D:/tangobook-audio/changjak-series-11-19-20261004')])
    args=parser.parse_args();args.root.mkdir(parents=True,exist_ok=True)
    if args.root.resolve() in [p.resolve() for p in args.source_roots]:
        raise ValueError('New combined root must preserve old roots')
    repo=pathlib.Path(__file__).resolve().parent.parent
    ids=[f'changjak-{s}-{n:02d}' for s,count in tts.SERIES_COUNTS.items() for n in range(1,count+1)]
    assert len(ids)==850 and len(set(ids))==850
    checked_at=time.time()
    def fetch(bid):
        for attempt in range(3):
            try:
                with urllib.request.urlopen('https://www.tangobook.co.kr/api/storybooks/'+bid,timeout=60) as response:
                    book=json.load(response)['data']
                break
            except Exception:
                if attempt==2:raise
                time.sleep(2**attempt)
        if book['id']!=bid or [p['page_number'] for p in book['pages']]!=list(range(1,11)):
            raise ValueError(f'Invalid current source: {bid}')
        translated=tts.read(repo/'docs/changjak-books/translations/en'/f'{bid}.json')
        if translated['sourceSha256']!=tts.source_hash(book) or translated.get('reviewed') is not True:
            tts.save(args.root/'source-changes'/f'{bid}.json',book)
            raise ValueError(f'Current source changed; review translation before generating: {bid}')
        for folder,data in [('books-before',book),('translations',translated)]:
            path=args.root/folder/f'{bid}.json'
            if path.exists() and tts.read(path)!=data:
                raise ValueError(f'Preserve existing combined snapshot: {path}')
            tts.save(path,data)
        if tts.narration(book,'en',args.root) is None:
            raise ValueError(f'English unavailable: {bid}')
        return {'id':bid,'title':book['title'],'pages':10,
                'operatingKoTts':sum(bool(p.get('ttsUrl')) for p in book['pages']),
                'operatingEnTts':sum(bool(p.get('translations',{}).get('en',{}).get('ttsUrl')) for p in book['pages'])}
    rows=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i,row in enumerate(pool.map(fetch,ids),1):
            rows.append(row)
            if i%50==0:print(f'CURRENT SOURCE VERIFIED {i}/850',flush=True)
    tts.save(args.root/'inventory.json',{'books':850,'pages':8500,'scope':'01-19','currentSourceCheckedAt':checked_at,'perBook':rows})
    overrides={}
    for old in args.source_roots:
        path=old/'seed-overrides.json'
        if path.exists():
            for key,value in tts.read(path).items():
                if key in overrides and overrides[key]!=value:raise ValueError('Seed override conflict')
                overrides[key]=value
    tts.save(args.root/'seed-overrides.json',overrides)
    reused=[];excluded=[]
    for old in args.source_roots:
        for path in sorted((old/'audio').glob('*/*/p*.json')):
            if path.name.endswith('.request.json'):continue
            receipt=tts.read(path);bid=receipt['bookId'];lang=receipt['language'];number=receipt['pageNumber']
            if bid not in tts.scope_ids('01-19'):continue
            book=tts.read(args.root/'books-before'/f'{bid}.json')
            text=tts.narration(book,lang,args.root)[number-1]
            recipe=tts.recipe_for(bid,lang,number,text,overrides)
            if receipt.get('recipeSha256')!=tts.recipe_key(recipe):
                excluded.append({'bookId':bid,'language':lang,'pageNumber':number,'preservedReceipt':str(path),'reason':'current text or recipe differs'})
                continue
            for suffix,hashkey in [('.mp3','mp3Sha256'),('.wav','wavSha256')]:
                src=path.with_suffix(suffix)
                if not src.exists() or tts.digest(src.read_bytes())!=receipt[hashkey]:
                    raise ValueError(f'Invalid prior completed media: {src}')
                copy_checked(src,args.root/'audio'/path.relative_to(old/'audio').with_suffix(suffix))
            copy_checked(path,args.root/'audio'/path.relative_to(old/'audio'))
            request=path.with_suffix('.request.json')
            if request.exists():copy_checked(request,args.root/'audio'/request.relative_to(old/'audio'))
            for audit in ('audit-large-v3-vad-v1','audit-medium-vad-v1'):
                src=old/audit/bid/lang/path.name
                if src.exists() and tts.read(src).get('mp3Sha256')==receipt['mp3Sha256']:
                    copy_checked(src,args.root/audit/bid/lang/path.name)
            reused.append({'bookId':bid,'language':lang,'pageNumber':number})
    tts.save(args.root/'preparation.json',{'status':'prepared','scope':'01-19','books':850,'sourcePages':8500,'targetAudioPages':17000,'reused':reused,'excludedPreserved':excluded,'operatingKoTts':sum(r['operatingKoTts'] for r in rows),'operatingEnTts':sum(r['operatingEnTts'] for r in rows),'preparedAt':time.time()})
    print(f'PREPARED 850 books / 17,000 audio pages. Reused {len(reused)}, preserved obsolete {len(excluded)}.',flush=True)


if __name__=='__main__':main()
