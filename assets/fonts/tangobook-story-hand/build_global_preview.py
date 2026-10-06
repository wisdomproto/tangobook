"""Reviewable global-coverage prototype; NOT a claim of original CJK/Thai authorship.

Original Korean construction and approved lettering + explicitly attributed OFL
compatibility glyphs. Keep the independent original trial files unchanged.
No upload occurs here. Record exact cmap/source hashes for the method decision.
"""
import json, hashlib, unicodedata, argparse
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.merge import Merger
from fontTools.varLib.instancer import instantiateVariableFont
from build import ROOT

SOURCES=Path('D:/ComfyUI-output/library-clean-covers-20261006/font-sources')
OUTPUT=ROOT/'dist-global-preview'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def slice_font(font,cps,path):
 opt=subset.Options();opt.recalc_timestamp=False;opt.name_IDs=['*'];opt.name_legacy=True;opt.name_languages=['*']
 sub=subset.Subsetter(options=opt);sub.populate(unicodes=set(cps));sub.subset(font);font.recalcTimestamp=False;font.flavor=None;font.save(path)
def rename(font,family):
 names={1:family,2:'Regular',3:family.replace(' ','')+'-0.4-preview',4:family+' Regular',5:'Version 0.400 Preview',6:family.replace(' ','')+'-Regular',13:'SIL Open Font License 1.1 compatibility prototype. Original additions copyright TangoBook; Noto source notices are preserved separately.',14:'https://openfontlicense.org/'}
 for rec in font['name'].names:
  if rec.nameID in names:rec.string=names[rec.nameID].encode(rec.getEncoding())
 font.recalcTimestamp=False;font['head'].created=3786912000;font['head'].modified=3786912000

def main(custom_path, output, reuse_existing=False, uniform_scripts=False):
 global OUTPUT
 OUTPUT=output
 OUTPUT.mkdir(exist_ok=True);(OUTPUT/'work').mkdir(exist_ok=True)
 custom=TTFont(custom_path);cmap=custom.getBestCmap();sources=json.loads((SOURCES/'sources.json').read_text(encoding='utf8'))
 groups=[
  ('Korean',None,lambda cp:0xAC00<=cp<=0xD7A3 or 0x1100<=cp<=0x11FF or 0x3130<=cp<=0x318F),
  ('Latin','NotoSans-Regular.ttf',lambda cp:cp<0x3000 and not(0x0E00<=cp<=0x0E7F) and not(0x1100<=cp<=0x11FF)),
  ('Thai','NotoSansThai-Regular.ttf',lambda cp:0x0E00<=cp<=0x0E7F),
  ('Chinese','NotoSansSC-VF.ttf',lambda cp:cp>=0x3000 and not(0xAC00<=cp<=0xD7A3) and not(0x3130<=cp<=0x318F)),
  ('Japanese','NotoSansJP-VF.ttf',lambda cp:cp>=0x3000 and not(0xAC00<=cp<=0xD7A3) and not(0x3130<=cp<=0x318F)),
 ]
 report={'status':'local-method-review-prototype','version':'0.5.0' if uniform_scripts else '0.4-preview','sources':sources,'originalFontSha256':digest(custom_path),'originalOutlinesOnly':['Korean'],'licensedCompatibilityScripts':['Latin' if uniform_scripts else 'Latin additions','Chinese','Japanese','Thai'],'groups':{},'fullExclusiveOriginalDesign':False}
 for key,source,allowed in groups:
  own=[cp for cp in cmap if allowed(cp)];family='TangoBook Story Hand Global'+(' Japanese' if key=='Japanese' else '')
  if key=='Thai' or (uniform_scripts and source):own=[] # One complete shaping/design system per script.
  own_file=OUTPUT/'work'/('own-'+key+'.ttf');slice_font(TTFont(custom_path),own,own_file)
  if reuse_existing and source and (OUTPUT/(key+'.ttf')).exists():
   font=TTFont(OUTPUT/(key+'.ttf'))
  elif source:
   donor=TTFont(SOURCES/source)
   if 'fvar' in donor:donor=instantiateVariableFont(donor,{'wght':600},inplace=True)
   # Cover labels use horizontal text. The original font has no vertical
   # metrics; merging donor-only vhea/vmtx would compare missing table fields.
   for tag in ('vhea','vmtx','VORG'):
    if tag in donor:del donor[tag]
   missing=[cp for cp in donor.getBestCmap() if allowed(cp) and cp not in own]
   donor_file=OUTPUT/'work'/('compatible-'+key+'.ttf');slice_font(donor,missing,donor_file)
   font=Merger().merge([str(own_file),str(donor_file)]) if own else TTFont(donor_file)
  else:font=TTFont(own_file)
  rename(font,family);font['hhea'].ascent=1450;font['hhea'].descent=-350
  font['OS/2'].sTypoAscender=1450;font['OS/2'].sTypoDescender=-350;font['OS/2'].usWinAscent=1700;font['OS/2'].usWinDescent=500
  ttf=OUTPUT/(key+'.ttf');font.save(ttf);font.flavor='woff2';web=OUTPUT/(key+'.woff2');font.save(web)
  cps=sorted(font.getBestCmap());report['groups'][key]={'family':family,'supportedCount':len(cps),'codepoints':cps,'ttfSha256':digest(ttf),'woff2Sha256':digest(web),'ownGlyphCount':len(own),'compatibleGlyphCount':len(cps)-len(own)}
  print(key,len(cps),flush=True)
 union=set(cp for key,group in report['groups'].items() if key!='Japanese' for cp in group['codepoints'])
 hangul=set(range(0xAC00,0xD7A4));assert not hangul-union
 thai={cp for cp in range(0x0E01,0x0E5C) if unicodedata.category(chr(cp))!='Cn'};assert not thai-union,thai-union
 expected=set(map(ord,'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzñáéíóúüàâæçèêëîïôœùûÿäößẞÀÂÆÇÈÉÊËÎÏÔŒÙÛÜŸÄÖ'))
 assert not expected-union,expected-union
 rows=json.loads(Path('D:/ComfyUI-output/library-clean-covers-20261006/all-list.json').read_text(encoding='utf8'))['data'];missing=[];titles=0
 for b in rows:
  if '파닉스' in b.get('category',''):continue
  for lang,title in {'ko':b['title'],**b.get('titleTranslations',{})}.items():
   titles+=1
   missing_cps={ord(c) for c in unicodedata.normalize('NFC',title)}-union
   if missing_cps:missing.append({'id':b['id'],'lang':lang,'missing':''.join(map(chr,sorted(missing_cps)))})
 report['uniformScripts']=uniform_scripts
 report['glyphDesignPolicy']='Uniform original Hangul; complete attributed Noto face per other script, no traced trial overrides' if uniform_scripts else 'Historical preserved trial outlines with compatible additions'
 report['validation']={'hangul11172':True,'thaiAssignedCharacters':True,'latinRegisteredLanguages':True,'actualTitleCount':titles,'missingTitles':missing,'unionCodepoints':len(union)}
 (OUTPUT/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(report['validation'],ensure_ascii=False))

if __name__=='__main__':
 parser=argparse.ArgumentParser()
 parser.add_argument('--custom-font',type=Path,default=ROOT/'dist-expanded-bold/TangoBookStoryHand-Expanded-Regular.ttf')
 parser.add_argument('--output',type=Path,default=ROOT/'dist-global-bold-preview')
 parser.add_argument('--reuse-compatible',action='store_true')
 parser.add_argument('--uniform-scripts',action='store_true')
 args=parser.parse_args()
 assert not(args.uniform_scripts and args.reuse_compatible),'Uniform scripts require a fresh source build, not mixed historical fonts'
 main(args.custom_font,args.output,args.reuse_compatible,args.uniform_scripts)
