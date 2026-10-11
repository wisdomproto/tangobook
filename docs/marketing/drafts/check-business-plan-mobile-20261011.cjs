const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/kil21/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const supported of [false,true]){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await context.addInitScript(({supported})=>{
    window.orientationCalls=[];let fullscreen=null;
    Object.defineProperty(document,'fullscreenElement',{get:()=>fullscreen});
    Element.prototype.requestFullscreen=async()=>{window.orientationCalls.push('fullscreen');if(!supported)throw new Error('Unsupported');fullscreen=document.documentElement;document.dispatchEvent(new Event('fullscreenchange'));};
    document.exitFullscreen=async()=>{window.orientationCalls.push('exit');fullscreen=null;document.dispatchEvent(new Event('fullscreenchange'));};
    Object.defineProperty(screen.orientation,'lock',{value:async mode=>window.orientationCalls.push(mode)});
    Object.defineProperty(screen.orientation,'unlock',{value:()=>window.orientationCalls.push('unlock')});
   },{supported});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:5199/tangobook-business-plan.html#vision',{waitUntil:'networkidle'});
   await page.waitForTimeout(200);
   await page.locator('#mode').click();
   await page.waitForTimeout(80);
   assert.equal(await page.locator('.deck-rotate-hint').isVisible(),true);
   assert.deepEqual(await page.evaluate(()=>window.orientationCalls),supported?['fullscreen','landscape']:['fullscreen']);
   if(!supported){
    await page.locator('.deck-rotate-hint button').click();
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('present')),false);
    await page.locator('#mode').click();
   }
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);
   assert.equal(await page.locator('.deck-rotate-hint').isVisible(),false);
   assert.equal(await page.locator('.audience').isVisible(),false);
   const bounds=await page.locator('section.active').boundingBox();assert.ok(bounds.x>=-1&&bounds.y>=55&&bounds.x+bounds.width<=845&&bounds.y+bounds.height<=391);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.locator('#next').click();assert.equal(await page.locator('section.active').getAttribute('id'),'learning-range');
   if(supported){await page.evaluate(()=>document.exitFullscreen());await page.waitForTimeout(50);assert.ok((await page.evaluate(()=>window.orientationCalls)).includes('unlock'));}
   else await page.locator('#mode').click();
   assert.equal(await page.locator('.audience').isVisible(),true);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS: mobile fullscreen/orientation request, unsupported fallback, manual rotation, navigation and cleanup (API mocks; no physical device verification).');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
