const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/kil21/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=process.env.DECK_URL||'http://127.0.0.1:5199/tangobook-business-plan.html';
  await page.goto(url+'#vision',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#chapter-select').inputValue(),'5');
  assert.equal(await page.locator('#mode').textContent(),'전체 보기');
  const ids=await page.locator('#investor-panel main>section:not(.appendix)').evaluateAll(es=>es.map(e=>e.id));
  assert.equal(ids.length,22);
  const expectedNumbers=ids.map((_,i)=>String(i+1).padStart(2,'0'));
  assert.deepEqual(await page.locator('#investor-panel main>section:not(.appendix) .section-badge>.badge-num').allTextContents(),expectedNumbers);
  assert.deepEqual(await page.locator('#chapter-select option').evaluateAll(es=>es.map(e=>e.textContent.split(' · ')[0])),expectedNumbers);
  const contentsNumbers=await page.locator('#contents .td-contents-links a').evaluateAll(es=>es.map(e=>({id:e.hash.slice(1),number:e.querySelector('span').textContent})));
  for(const entry of contentsNumbers)assert.equal(entry.number,expectedNumbers[ids.indexOf(entry.id)],entry.id);

  assert.deepEqual(ids.slice(5,9),['vision','learning-range','business','reading-report']);
  assert.deepEqual(ids.slice(9,15),['part-content','platform-overview','ai-authoring','foundation','advantage','marketing-tools']);
  assert.deepEqual(ids.slice(16,19),['growth','sales-strategy','revenue-model']);
  await page.locator('#mode').click();
  await page.locator('#chapter-select').selectOption('1');
  assert.equal(await page.locator('#contents .td-contents-links a').count(),17);
  await page.locator('#contents a[href="#vision"]').click();
  await page.waitForTimeout(80);
  assert.equal(await page.locator('section.active').getAttribute('id'),'vision');
  assert.equal(await page.locator('#vision').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 250, 245)');
  assert.equal(await page.locator('.td-sales-summary-brand .td-sales-summary-support').count(),1);
  for(const [width,height] of [[1440,900],[1280,720],[888,871],[390,844]]){
   await page.setViewportSize({width,height});
   for(let i=0;i<ids.length;i++){
    await page.locator('#chapter-select').selectOption(String(i));await page.waitForTimeout(60);
    const r=await page.locator('#investor-panel main>section.active').evaluate(e=>{const r=e.getBoundingClientRect();return {id:e.id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1}});
    assert.equal(r.id,ids[i]);assert.ok(r.x>=-1&&r.y>=55&&r.right<=width+1&&r.bottom<=height+1,JSON.stringify({width,height,r}));assert.equal(r.overflow,false,JSON.stringify({width,height,r}));
    if(!r.id.startsWith('part-')&&r.id!=='proposal-cover'){
     const bounds=await page.locator('section.active').evaluate(e=>({width:e.offsetWidth,height:e.offsetHeight,scroll:e.scrollHeight,contentBottom:Math.max(...[...e.children].filter(c=>getComputedStyle(c).display!=='none').map(c=>c.offsetTop+c.offsetHeight))}));
     assert.equal(bounds.width,1440);assert.equal(bounds.height,900);assert.ok(bounds.scroll<=901,JSON.stringify({id:r.id,bounds}));assert.ok(bounds.contentBottom<=900,JSON.stringify({id:r.id,bounds}));
    }
    if(r.id.startsWith('part-')||r.id==='proposal-cover'){assert.ok(Math.abs(r.x)<1&&Math.abs(r.y-56)<1&&Math.abs(r.right-width)<1&&Math.abs(r.bottom-height)<1);}
   }
  }
  await page.setViewportSize({width:888,height:871});
  await page.locator('#chapter-select').selectOption(String(ids.indexOf('marketing-tools')));
  await page.locator('#marketing-tools [data-open-tab]').click();
  assert.equal(await page.locator('#marketing-panel').isVisible(),true);
  assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('present')),false);
  assert.match(page.url(),/#marketing-examples$/);
  await page.goto(url+'#marketing-tools',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#investor-panel').isVisible(),true);
  assert.equal(await page.locator('#chapter-select').inputValue(),String(ids.indexOf('marketing-tools')));
  await page.locator('#mode').click();await page.locator('#mode').blur();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#mode').textContent(),'전체 보기');
  assert.equal(await page.locator('.audience').isVisible(),true);
  await page.goto(url+'#phonics-content',{waitUntil:'networkidle'});
  await page.waitForURL(/#foundation$/);
  assert.match(page.url(),/#foundation$/);
  assert.equal(await page.locator('#chapter-select').inputValue(),String(ids.indexOf('foundation')));
  await page.locator('#mode').click();await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('#investor-panel main>section:not(.appendix)').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none').length),22);
  assert.deepEqual(errors,[]);console.log('PASS: 22 slides × 4 viewports; full-bleed dividers, chapter order, deep links, detail navigation, Escape and print visibility.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
