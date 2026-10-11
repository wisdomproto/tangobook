const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/kil21/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=process.env.DECK_URL||'http://127.0.0.1:5199/tangobook-business-plan.html';
  await page.goto(url+'#vision',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#chapter-select').inputValue(),'4');
  assert.equal(await page.locator('#mode').textContent(),'전체 보기');
  const ids=await page.locator('#investor-panel main>section:not(.appendix)').evaluateAll(es=>es.map(e=>e.id));
  assert.equal(ids.length,23);
  assert.deepEqual(ids.slice(7,15),['part-content','platform-overview','ai-authoring','phonics-content','foundation','reading-activities','advantage','marketing-tools']);
  await page.locator('#mode').click();
  for(const [width,height] of [[1440,900],[1280,720],[888,871],[390,844]]){
   await page.setViewportSize({width,height});
   for(let i=0;i<ids.length;i++){
    await page.locator('#chapter-select').selectOption(String(i));await page.waitForTimeout(60);
    const r=await page.locator('#investor-panel main>section.active').evaluate(e=>{const r=e.getBoundingClientRect();return {id:e.id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1}});
    assert.equal(r.id,ids[i]);assert.ok(r.x>=-1&&r.y>=55&&r.right<=width+1&&r.bottom<=height+1,JSON.stringify({width,height,r}));assert.equal(r.overflow,false,JSON.stringify({width,height,r}));
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
  await page.locator('#mode').click();await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('#investor-panel main>section:not(.appendix)').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none').length),23);
  assert.deepEqual(errors,[]);console.log('PASS: 23 slides × 4 viewports; full-bleed dividers, chapter order, deep links, detail navigation, Escape and print visibility.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
