const slides=[...document.querySelectorAll('#investor-panel main>section:not(.appendix)')];
const panel=document.querySelector('#investor-panel');
const chapter=document.querySelector('#chapter-select');
const mode=document.querySelector('#mode');
const audience=document.querySelector('.audience');
const reader=document.querySelector('#investor-panel>header');
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
 document.body.classList.toggle('present',active);
 readingStyle.sheet.disabled=active;canvasStyle.media=active?'all':'not all';
 mode.textContent=active?'스크롤 보기':'전체 보기';mode.setAttribute('aria-pressed',String(active));
 render();
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
window.addEventListener('resize',queueFit);
document.fonts.ready.then(queueFit);
panel.querySelectorAll('img').forEach(img=>img.addEventListener('load',queueFit));
new MutationObserver(()=>{if(panel.hidden&&document.body.classList.contains('present'))setFullView(false);}).observe(panel,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('hashchange',()=>{const found=slides.findIndex(s=>'#'+s.id===location.hash);if(found>=0){index=found;render();}});
let ticking=false;
window.addEventListener('scroll',()=>{
 if(ticking||isFullView()||panel.hidden)return;ticking=true;
 requestAnimationFrame(()=>{const line=audience.offsetHeight+reader.offsetHeight+48;let visible=0;slides.forEach((s,i)=>{if(s.getBoundingClientRect().top<=line)visible=i;});if(index!==visible){index=visible;render();}ticking=false;});
},{passive:true});
render();

// Restore the requested chapter after images and the tab shell have settled.
window.addEventListener('load',()=>{const found=slides.findIndex(s=>'#'+s.id===location.hash);if(found>=0&&!panel.hidden){index=found;render();if(!isFullView())slides[index].scrollIntoView({behavior:'instant'});}});
