import puppeteer from 'puppeteer';
const OUT=process.argv[2];
const S=[['wj','https://smartall.wjthinkbig.com/brand/smartallKids2'],['eli','http://elikids.mbest.co.kr/']];
const b=await puppeteer.launch({headless:'new',args:['--hide-scrollbars']});
for(const [n,u] of S){
 const p=await b.newPage(); await p.setViewport({width:390,height:844});
 await p.goto(u,{waitUntil:'networkidle2',timeout:45000}); await new Promise(r=>setTimeout(r,5000));
 await p.evaluate(async()=>{for(let y=0;y<4000;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150))}});
 await p.evaluate(()=>window.scrollTo(0,0)); await new Promise(r=>setTimeout(r,1500));
 await p.screenshot({path:`${OUT}/${n}-top.png`});
 await p.evaluate(()=>window.scrollTo(0,2600)); await new Promise(r=>setTimeout(r,2000));
 await p.screenshot({path:`${OUT}/${n}-mid.png`});
 await p.close();
}
console.log('done'); await b.close();
