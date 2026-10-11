// Export the introduction's presentation layout as searchable landscape PDF.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/kil21/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
 const root = path.resolve(__dirname, '../../..');
 const output = path.resolve(process.argv[2] || path.join(root, 'output/pdf/TangoBook-Introduction-v1-20261011.pdf'));
 fs.mkdirSync(path.dirname(output), {recursive:true});
 const browser = await chromium.launch({channel:'chrome', headless:true});
 try {
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(process.env.DECK_URL || pathToFileURL(path.join(root,'packages/client/public/tangobook-business-plan.html')).href, {waitUntil:'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#mode').click();
  await page.emulateMedia({media:'screen'});
  await page.evaluate(() => {
   document.querySelectorAll('#investor-panel details').forEach(e=>e.open=false);
  });
  await page.addStyleTag({content:`
   @page {size:1440px 900px;margin:0}
   html,body.present[data-audience="investor"] {width:1440px!important;height:900px!important;overflow:hidden!important;margin:0!important;padding:0!important;background:#fffaf5!important;scroll-behavior:auto!important}
   .audience,#investor-panel>header,#simulation-panel,#marketing-panel,.deck-rotate-hint {display:none!important}
   body.present[data-audience="investor"] #investor-panel>main {position:fixed!important;inset:0!important;width:1440px!important;height:900px!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important}
   body.present[data-audience="investor"] #investor-panel>main>section.active {display:block!important;position:absolute!important;inset:0!important;left:0!important;top:0!important;transform:none!important;zoom:1!important;width:1440px!important;height:900px!important;min-height:900px!important;max-height:900px!important;margin:0!important;box-shadow:none!important;overflow:visible!important;break-before:auto!important;break-after:page!important;break-inside:avoid!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
   body.present[data-audience="investor"] #investor-panel>main>section.active:last-child {break-after:auto!important}
   body.present[data-audience="investor"] #investor-panel>main>section.active:is([id^="part-"],#proposal-cover) {padding:0!important}
  `});

  const count=await page.locator('#chapter-select option').count();
  const temp=path.join(root,'tmp/pdfs/tangobook-v1');fs.mkdirSync(temp,{recursive:true});
  const parts=[];
  for(let i=0;i<count;i++){
   await page.locator('#chapter-select').selectOption(String(i),{force:true});
   await page.locator('section.active img').evaluateAll(images=>Promise.all(images.map(image=>{image.loading='eager';return image.decode();})));
   await page.waitForTimeout(80);
   const slide=await page.locator('section.active').evaluate(e=>({id:e.id,width:e.offsetWidth,height:e.offsetHeight,scroll:e.scrollHeight}));
   if(slide.width!==1440||slide.height!==900||slide.scroll>901)throw Error(JSON.stringify(slide));
   const part=path.join(temp,String(i+1).padStart(2,'0')+'.pdf');parts.push(part);
   await page.pdf({path:part,width:'1440px',height:'900px',margin:{top:0,bottom:0,left:0,right:0},printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false,tagged:true});
  }
  const python=process.env.PDF_PYTHON || 'C:/Users/kil21/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
  require('node:child_process').execFileSync(python,['-c',`import sys
from pypdf import PdfReader,PdfWriter
w=PdfWriter()
for f in sys.argv[2:]:
 r=PdfReader(f)
 assert len(r.pages)==1,(f,len(r.pages))
 w.append(r)
seen=set()
for p in w.pages:
 for img in p.images:
  ref=img.indirect_reference
  if ref is None or ref.idnum in seen: continue
  seen.add(ref.idnum)
  im=img.image
  if im.mode!='RGB' or max(im.size)<600: continue
  im.thumbnail((1800,1800))
  img.replace(im,quality=85,optimize=True)
w.add_metadata({'/Title':'TangoBook Introduction v1','/Author':'TangoBook'})
w.compress_identical_objects()
w.write(sys.argv[1])`,output,...parts]);
  console.log(JSON.stringify({output,slides:count,bytes:fs.statSync(output).size}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
