// 통합된 콘텐츠 상세 장의 기존 링크를 보유 콘텐츠 요약으로 연결.
const chapterAliases={'#phonics-content':'#foundation','#reading-activities':'#foundation','#reading-sequence':'#foundation'};
function resolveChapterHash(){if(chapterAliases[location.hash])history.replaceState(null,'',chapterAliases[location.hash]);}
resolveChapterHash();
const slides=[...document.querySelectorAll('#investor-panel main>section:not(.appendix)')];
const panel=document.querySelector('#investor-panel');
const chapter=document.querySelector('#chapter-select');
const mode=document.querySelector('#mode');
const audience=document.querySelector('.audience');
const reader=document.querySelector('#investor-panel>header');
const tabNext=document.createElement('button');
tabNext.type='button';tabNext.className='audience-tab-next';
tabNext.setAttribute('aria-label','다음 탭 보기');tabNext.textContent='›';
audience.after(tabNext);
function updateTabHint(){tabNext.classList.toggle('has-more',audience.scrollWidth-audience.clientWidth-audience.scrollLeft>8);}
tabNext.onclick=()=>audience.scrollBy({left:240,behavior:'smooth'});
audience.addEventListener('scroll',updateTabHint,{passive:true});
new ResizeObserver(updateTabHint).observe(audience);
window.addEventListener('load',updateTabHint);

let index=Math.max(0,slides.findIndex(s=>'#'+s.id===location.hash));
let frame=0;
// Resolve width breakpoints against the slide canvas, not the browser window.
// Reading mode retains the original responsive stylesheet unchanged.
const readingStyle=document.querySelector('head style');
const canvasStyle=document.createElement('style');
canvasStyle.id='full-view-style';
canvasStyle.media='not all';
canvasStyle.textContent=readingStyle.textContent.replace(/\((min|max)-width:\s*(\d+)px\)/g,(_,kind,value)=>{
 const matches=kind==='min'?1440>=Number(value):1440<=Number(value);
 return matches?'(min-width:0px)':'(min-width:100000px)';
});
document.head.append(canvasStyle);
function isFullView(){return document.body.classList.contains('present')&&!panel.hidden;}
const rotateHint=document.createElement('div');
rotateHint.className='deck-rotate-hint';
rotateHint.setAttribute('role','status');
rotateHint.innerHTML='<div><span aria-hidden="true">↻</span><b>기기를 가로로 돌려주세요</b><p>가로 화면에서 슬라이드를 크게 볼 수 있습니다.</p><button type="button">스크롤 보기로 돌아가기</button></div>';
document.body.append(rotateHint);
rotateHint.querySelector('button').onclick=()=>setFullView(false);
let mobileView=false,viewRequest=0,ownsFullscreen=false,ownsOrientation=false;
function updateOrientationHint(){
 document.body.classList.toggle('deck-mobile-view',isFullView()&&mobileView);
 document.body.classList.toggle('deck-portrait',isFullView()&&mobileView&&innerHeight>innerWidth);
}
function releaseOrientation(){
 if(ownsOrientation){try{screen.orientation.unlock();}catch{}ownsOrientation=false;}
}
async function enterMobileLandscape(request){
 try{
  if(!document.fullscreenElement&&document.documentElement.requestFullscreen){
   await document.documentElement.requestFullscreen();ownsFullscreen=true;
  }
  if(request!==viewRequest||!isFullView()){
   if(ownsFullscreen){ownsFullscreen=false;await document.exitFullscreen().catch(()=>{});}return;
  }
  if(screen.orientation?.lock){
   await screen.orientation.lock('landscape');ownsOrientation=true;
   if(request!==viewRequest||!isFullView())releaseOrientation();
  }
 }catch{/* Unsupported or denied: keep the manual rotation guidance. */}
 updateOrientationHint();queueFit();
}
function fitSlide(){
 frame=0;if(!isFullView())return;
 const slide=slides[index],stage=panel.querySelector('main');
 if(slide.id.startsWith('part-')||slide.id==='proposal-cover')return;
 const scale=Math.min(stage.clientWidth/1440,(stage.clientHeight-2)/900);
 slide.style.setProperty('--slide-scale',String(Math.max(.01,scale)));
}
function queueFit(){if(!frame)frame=requestAnimationFrame(fitSlide);}
function render(){
 slides.forEach((s,i)=>s.classList.toggle('active',i===index));
 document.querySelector('#count').textContent=(index+1)+' / '+slides.length;
 chapter.value=String(index);queueFit();
}
function move(n){
 index=Math.max(0,Math.min(slides.length-1,index+n));render();
 history.replaceState(null,'','#'+slides[index].id);
 if(isFullView())window.scrollTo({top:0,behavior:'instant'});
 else slides[index].scrollIntoView({behavior:'instant'});
}
function setFullView(active){
 const request=++viewRequest;
 mobileView=active&&matchMedia('(any-pointer: coarse)').matches&&Math.min(innerWidth,innerHeight)<=1024;
 document.body.classList.toggle('present',active);
 readingStyle.sheet.disabled=active;canvasStyle.media=active?'all':'not all';
 mode.textContent=active?'스크롤 보기':'전체 보기';mode.setAttribute('aria-pressed',String(active));
 render();
 updateOrientationHint();
 if(active&&mobileView)void enterMobileLandscape(request);
 if(!active){
  releaseOrientation();
  if(ownsFullscreen){ownsFullscreen=false;if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});}
 }
 if(active)window.scrollTo({top:0,behavior:'instant'});
 else if(!panel.hidden)slides[index].scrollIntoView({behavior:'instant'});
}
chapter.onchange=()=>move(Number(chapter.value)-index);
mode.onclick=()=>setFullView(!isFullView());
document.querySelector('#prev').onclick=()=>move(-1);
document.querySelector('#next').onclick=()=>move(1);
document.querySelector('#print').onclick=()=>window.print();
document.addEventListener('keydown',e=>{
 if(panel.hidden||e.target.closest('[role=tab]')||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
 if(e.key==='Escape'&&isFullView()){e.preventDefault();setFullView(false);return;}
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}
});
new ResizeObserver(()=>{document.documentElement.style.setProperty('--audience-height',audience.offsetHeight+'px');queueFit();}).observe(audience);
new ResizeObserver(()=>{document.documentElement.style.setProperty('--reader-height',reader.offsetHeight+'px');queueFit();}).observe(reader);
const observer=new ResizeObserver(queueFit);slides.forEach(s=>observer.observe(s));
window.addEventListener('resize',()=>{updateOrientationHint();queueFit();});
screen.orientation?.addEventListener('change',()=>{updateOrientationHint();queueFit();});
document.addEventListener('fullscreenchange',()=>{
 if(ownsFullscreen&&!document.fullscreenElement){ownsFullscreen=false;if(isFullView())setFullView(false);}
 updateOrientationHint();queueFit();
});
document.fonts.ready.then(queueFit);
panel.querySelectorAll('img').forEach(img=>img.addEventListener('load',queueFit));
new MutationObserver(()=>{if(panel.hidden&&document.body.classList.contains('present'))setFullView(false);}).observe(panel,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('hashchange',()=>{resolveChapterHash();const found=slides.findIndex(s=>'#'+s.id===location.hash);if(found>=0){index=found;render();}});
let ticking=false;
window.addEventListener('scroll',()=>{
 if(ticking||isFullView()||panel.hidden)return;ticking=true;
 requestAnimationFrame(()=>{const line=audience.offsetHeight+reader.offsetHeight+48;let visible=0;slides.forEach((s,i)=>{if(s.getBoundingClientRect().top<=line)visible=i;});if(index!==visible){index=visible;render();}ticking=false;});
},{passive:true});
render();

// Restore the requested chapter after images and the tab shell have settled.
window.addEventListener('load',()=>{const found=slides.findIndex(s=>'#'+s.id===location.hash);if(found>=0&&!panel.hidden){index=found;render();if(!isFullView())slides[index].scrollIntoView({behavior:'instant'});}});
