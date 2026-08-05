import puppeteer from 'puppeteer';
const SITES=[
 ['웅진 스마트올 키즈','https://smartall.wjthinkbig.com/brand/smartallKids2'],
 ['웅진 스마트올 초등','https://smartall.wjthinkbig.com/brand/smartallKids'],
 ['엘리하이 키즈','http://elikids.mbest.co.kr/'],
 ['교원 아이캔두','https://www.aicandoclass.com/'],
 ['교원 빨간펜','https://www.kyowonedu.com/KEM/AicandoClassTeacher.jsp'],
 ['탱고북 /hangul','https://www.tangobook.co.kr/hangul'],
];
const b=await puppeteer.launch({headless:'new',args:['--hide-scrollbars']});
for(const [name,url] of SITES){
 const p=await b.newPage(); await p.setViewport({width:390,height:844});
 try{
  await p.goto(url,{waitUntil:'networkidle2',timeout:45000});
  await new Promise(r=>setTimeout(r,6000));
  // 끝까지 스크롤(lazy 이미지 로드)
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}});
  await new Promise(r=>setTimeout(r,2500));
  const o=await p.evaluate(()=>{
   const imgs=[...document.images].filter(i=>i.naturalWidth>200);
   const imgArea=imgs.reduce((s,i)=>{const r=i.getBoundingClientRect();return s+r.width*r.height},0);
   const txt=(document.body.innerText||'').replace(/\s+/g,'');
   return {h:document.body.scrollHeight, imgs:imgs.length,
    tallImgs:imgs.filter(i=>i.getBoundingClientRect().height>500).length,
    imgArea:Math.round(imgArea/1000), text:txt.length,
    videos:document.querySelectorAll('video').length,
    iframes:document.querySelectorAll('iframe').length,
    inputs:document.querySelectorAll('input,button,select').length};});
  console.log(`${name.padEnd(16)} 높이 ${String(o.h).padStart(6)} · 큰이미지 ${String(o.imgs).padStart(3)}(세로500+ ${o.tallImgs}) · 본문글자 ${String(o.text).padStart(5)} · 영상 ${o.videos} · 버튼류 ${o.inputs}`);
 }catch(e){console.log(`${name.padEnd(16)} 실패: ${e.message.slice(0,60)}`)}
 await p.close();
}
await b.close();
