// LEGACY: user rejected this vocabulary-art layout. Current covers use imagegen-v2 assets.
// Editorial cover layout using unchanged owned illustrations and separate title layers.
// node this-file --render: editable HTML plus nine 900x1200 WebP cover exports.
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'../../..');
const dir=path.join(root,'docs/marketing/assets/investor-20261010/phonics-covers');
const fonts=path.join(root,'packages/client/public/fonts/tangobook-story-hand/0.4.0');
const manifest=JSON.parse(fs.readFileSync(path.join(fonts,'manifest.json')));
const books=JSON.parse(fs.readFileSync(path.join(dir,'sources.json'))).books;
const required=[...new Set(books.flatMap(b=>[...`${b.series}${b.title}${b.word}${b.volume}`]))].filter(c=>c.trim());
const supported=new Set(manifest.files.flatMap(f=>f.codepoints));
const missing=required.filter(c=>!supported.has(c.codePointAt(0)));
if(missing.length)throw Error('Unsupported cover glyphs: '+missing.join(''));
const fontCss=['korean-all.woff2','latin-all.woff2'].map(file=>{const f=manifest.files.find(x=>x.file===file);return `@font-face{font-family:StoryHand;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fonts,file)).toString('base64')}) format('woff2');unicode-range:${f.codepoints.map(x=>'U+'+x.toString(16)).join(',')}}`}).join('\n');
const palettes=[['#27685b','#dcebe0'],['#ad6337','#f3e3cf'],['#ad5262','#f4e0e2'],['#45748c','#dcebf0'],['#c07036','#f5e8d2'],['#427a69','#e1eddf'],['#af596a','#f5e2e5'],['#477994','#deedf1'],['#776699','#e9e2f0']];
const markup=books.map((b,i)=>{const [ink,tint]=palettes[i];return `<article class="cover" id="${b.id}" style="--ink:${ink};--tint:${tint}" aria-label="${b.series} ${b.volume}권 ${b.title}"><div class="edge"></div><div class="topline"><span>첫 글자부터 혼자 읽기까지</span><b>${b.volume}<small>권</small></b></div><h1><span>탱고</span>${b.id.startsWith('ko')?'한글':'영어'} 파닉스</h1><h2>${b.title}</h2><div class="arc"></div><figure><img src="data:image/webp;base64,${fs.readFileSync(path.join(dir,b.art)).toString('base64')}" alt="${b.word}"></figure><div class="word">${b.word}</div><footer><b>TangoBook</b><span>${b.id.startsWith('ko')?'KOREAN':'ENGLISH'} PHONICS · ${String(b.volume).padStart(2,'0')}</span></footer></article>`}).join('');
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><title>탱고 파닉스 · 표지 9종</title><style>${fontCss}
*{box-sizing:border-box}body{margin:0;background:#ece8df;font-family:'Malgun Gothic',sans-serif}.cover{width:900px;height:1200px;position:relative;overflow:hidden;background:#fffaf0;color:var(--ink);margin:0 0 28px}.edge{position:absolute;inset:0 auto 0 0;width:18px;background:var(--ink)}.topline{position:absolute;top:62px;left:64px;right:62px;display:flex;align-items:start;justify-content:space-between}.topline>span{font-size:23px;letter-spacing:2px;padding-top:5px}.topline>b{width:105px;height:105px;border-radius:50%;background:var(--ink);color:#fffaf0;display:flex;align-items:center;justify-content:center;font-size:69px;line-height:1;font-weight:500}.topline small{font-size:20px;margin:24px 0 0 3px}h1{position:absolute;top:145px;left:64px;margin:0;font:94px/1.2 StoryHand;letter-spacing:-2px}h1>span{display:block;font-size:52px;letter-spacing:0;margin-bottom:8px}h2{position:absolute;top:353px;left:69px;margin:0;font:59px/1.3 StoryHand;letter-spacing:0}.arc{position:absolute;left:-150px;top:491px;width:1200px;height:1040px;border-radius:50% 50% 0 0;background:var(--tint)}figure{position:absolute;left:165px;top:470px;width:570px;height:570px;margin:0;border:10px solid #fffaf0;border-radius:90px;overflow:hidden;background:#fffaf0;transform:rotate(-3deg)}figure img{width:100%;height:100%;object-fit:contain}.word{position:absolute;top:1052px;left:0;width:100%;text-align:center;font:53px/1.3 StoryHand}footer{position:absolute;bottom:40px;left:64px;right:60px;display:flex;align-items:center;justify-content:space-between;color:var(--ink)}footer b{font-size:25px;letter-spacing:-.7px}footer span{font-size:17px;letter-spacing:2px}
</style>${markup}</html>`;
fs.writeFileSync(path.join(dir,'covers.html'),html);
console.log('Built 9 editable cover layouts; required glyph coverage verified:',required.length);
if(process.argv.includes('--render')){
 const {pathToFileURL}=require('url');
 const runtime=path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
 const dependency=name=>{try{return require(name)}catch{return require(path.join(runtime,name))}};
 const {chromium}=dependency('playwright');
 const sharp=dependency('sharp');
 (async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
   const page=await browser.newPage({viewport:{width:960,height:1280}});
   await page.goto(pathToFileURL(path.join(dir,'covers.html')).href);
   await page.evaluate(()=>document.fonts.ready);
   for(const book of books){const png=await page.locator('#'+book.id).screenshot();await sharp(png).webp({quality:94}).toFile(path.join(dir,book.id+'-cover.webp'));}
   console.log('Rendered nine covers at 900x1200.');
  }finally{await browser.close()}
 })().catch(error=>{console.error(error);process.exitCode=1});
}
