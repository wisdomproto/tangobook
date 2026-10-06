// Run with Node and sharp available (the desktop bundled runtime also provides sharp).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const dir = __dirname;
const W = 1800, H = 1640;
const ink = '#173e36', muted = '#52695f', coral = '#cf553a';
const parts = [], sources = new Set();
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function text(x,y,s,size=27,color=ink,weight=400,anchor='start') {
  parts.push(`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`);
}
function rect(x,y,w,h,fill='#fff',rx=20,stroke='none') {
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`);
}
function arrow(d,color=coral,width=5) {parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" marker-end="url(#arrow)"/>`);}
async function image(name,x,y,w,h,options={}) {
  sources.add(name);
  const file=path.join(dir,name);
  const buffer=await sharp(file).resize({width:Math.ceil(w*1.5),height:Math.ceil(h*1.5),fit:options.crop?'cover':'inside',withoutEnlargement:true}).png().toBuffer();
  const id='clip'+parts.length;
  if(options.crop) parts.push(`<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${options.rx||12}"/></clipPath>`);
  const transform=options.rotate?` transform="rotate(${options.rotate} ${x+w/2} ${y+h/2})"`:'';
  parts.push(`<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/png;base64,${buffer.toString('base64')}" preserveAspectRatio="${options.crop?'xMidYMid slice':'xMidYMid meet'}"${options.crop?` clip-path="url(#${id})"`:''}${transform}/>`);
}
function flag(type,x,y) {
  const existing=fs.readFileSync(path.resolve(dir,'../../branding-organic-strategy-2026-10-05.html'),'utf8');
  const flagImages=[...existing.matchAll(/<div class="language-flag"><svg\b[^>]*>([\s\S]*?)<\/svg>/g)].slice(0,5);
  const i=['kr','en','vi','zh','th'].indexOf(type);
  if(flagImages[i]){parts.push(`<svg x="${x}" y="${y}" width="78" height="50" viewBox="0 0 60 40">${flagImages[i][1]}</svg>`);return;}
  parts.push(`<g transform="translate(${x} ${y})"><rect width="78" height="50" rx="6" fill="white"/>`);
  if(type==='kr')parts.push('<circle cx="39" cy="25" r="12" fill="#cd2e3a"/><path d="M27 25a12 12 0 0 0 24 0a6 6 0 0 1-12 0a6 6 0 0 0-12 0" fill="#0047a0"/><path d="M9 8l9 7M7 11l9 7M5 14l9 7M60 32l9 7M62 29l9 7M64 26l9 7" stroke="#111" stroke-width="2"/>');
  if(type==='en'){for(let i=0;i<13;i+=2)parts.push(`<rect y="${i*50/13}" width="78" height="${50/13}" fill="#b22234"/>`);parts.push('<rect width="34" height="27" fill="#3c3b6e"/>');for(let r=0;r<4;r++)for(let c=0;c<5;c++)parts.push(`<circle cx="${4+c*6}" cy="${4+r*6}" r="1.3" fill="white"/>`);}
  if(type==='vi')parts.push('<rect width="78" height="50" rx="6" fill="#da251d"/><path d="M39 9l4 12h13l-10 8 4 12-11-8-11 8 4-12-10-8h13Z" fill="#ffde00"/>');
  if(type==='zh')parts.push('<rect width="78" height="50" rx="6" fill="#de2910"/><path d="M19 8l3 8h8l-7 5 3 8-7-5-7 5 3-8-7-5h8Z" fill="#ffde00"/><circle cx="34" cy="9" r="2" fill="#ffde00"/><circle cx="39" cy="17" r="2" fill="#ffde00"/><circle cx="39" cy="26" r="2" fill="#ffde00"/><circle cx="34" cy="34" r="2" fill="#ffde00"/>');
  if(type==='th')parts.push('<rect width="78" height="50" rx="6" fill="#a51931"/><rect y="8" width="78" height="34" fill="#f4f5f8"/><rect y="16" width="78" height="18" fill="#2d2a4a"/>');
  parts.push('</g>');
}
async function build() {
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>탱고북 전체 플랫폼 — 실제 콘텐츠로 보는 배움과 놀이의 연결</title><desc>한글·영어 파닉스와 1000권 이상의 동화책에서 출발해 이야기, 그림 어휘, 독후활동, 부모 리포트로 이어집니다. 인쇄·블록·노트 연계와 다국어 확장, AI 제작과 사람의 검수가 플랫폼을 넓힙니다. 리포트는 테스트 샘플 화면이고 아시아 언어 파닉스와 노트 연계는 확장 계획입니다.</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L9 5L0 9" fill="none" stroke="${coral}" stroke-width="2"/></marker></defs><rect width="${W}" height="${H}" rx="28" fill="#fff9f3"/><g font-family="Malgun Gothic,Arial,sans-serif">`);
  await image('tangobook-logo-kr.webp',68,28,190,95);
  text(290,74,'이야기와 놀이로 배우는, 하나의 플랫폼',44,ink,700);
  text(292,116,'아시아 미취학 아동의 어휘력·문해력 · 한국에서 시작',25,muted);
  rect(1405,57,316,57,'#edf4e8',18);text(1563,95,'공개 놀이로 첫 체험',25,ink,700,'middle');
  parts.push('<path d="M70 146H1730" stroke="#deded3" stroke-width="2"/>');
  // The content library is shown as actual books, rather than another list of features.
  text(84,200,'+1000권의 동화책',38,ink,700);text(474,199,'창작 19시리즈 포함',25,muted);
  const covers=['cover-1789350946382.webp','cover-1785303658036.webp','cover-1773912904434.webp','cover-1784550873799.webp','cover-1773576314846.webp','cover-1777615071158.webp'];
  for(let i=0;i<6;i++)await image(covers[i],84+(i%3)*220+(i>=3?25:0),222+Math.floor(i/3)*148,200,134,{rotate:i%2?3:-3});
  text(86,536,'명작 · 전래 · 생활 · 자연관찰 · 창작',25,muted);
  text(850,200,'한글·영어 파닉스',38,ink,700);text(1255,198,'32 + 39개 학습 단원',25,muted);
  rect(848,225,852,283,'#edf4e8',24);
  await image('word-kr-h1-u07-0.webp',872,253,168,166);
  text(1080,282,'글자와 소리를 조합하기',26,ink,700);
  text(1080,349,'ㅂ + ㅏ → 바',43,coral,700);text(1080,392,'바다 · 비누 · 나비 · 두부',25,muted);
  await image('word-en-b2-u01-5.webp',1380,252,150,160);
  text(1550,294,'c + at',32,ink,700);text(1550,345,'→ cat',34,coral,700);
  text(875,471,'듣기 → 조합 → 쓰기 → 낱말 놀이',27,ink,700);
  text(852,536,'커리큘럼과 같은 낱말의 다양한 활동',25,muted);
  arrow('M390 552V596');arrow('M1270 552V596');
  // One real story supplies every picture in the central experience.
  rect(66,602,1668,470,ink,30);
  text(101,652,'아이가 고르고, 직접 해보고, 다시 찾는 경험',35,'#fff',700);
  text(1698,651,'같은 이야기 · 같은 낱말',25,'#e9f0e6',400,'end');
  const xs=[103,516,929,1342];
  const labels=['01 이야기 읽기','02 그림 어휘 만나기','03 낱말로 놀기','04 부모가 배움 확인'];
  xs.forEach((x,i)=>{text(x,701,labels[i],27,'#fff',700);rect(x,719,352,236,'#fff',16);});
  await image('giant-page-1.webp',113,731,332,211);
  await image('giant-word-Tree.webp',561,730,261,212);
  await image('giant-tree-coloring-actual.jpg',973,730,261,211);
  // Crop the top of the real report inside a tablet-like frame, retaining visible product text.
  const report=await sharp(path.join(dir,'report-storybook-sample.webp')).extract({left:0,top:0,width:1264,height:800}).resize(660).png().toBuffer();sources.add('report-storybook-sample.webp');
  parts.push(`<image x="1353" y="730" width="330" height="210" href="data:image/png;base64,${report.toString('base64')}" preserveAspectRatio="xMidYMid meet"/>`);
  xs.slice(0,3).forEach(x=>arrow(`M${x+365} 831H${x+395}`));
  text(103,993,'「거인의 정원」',26,'#fff',700);text(103,1029,'그림 · 문장 · 나레이션',24,'#e9f0e6');
  text(516,993,'나무 · 담장 · 표지판',26,'#fff',700);text(516,1029,'뜻 · 소리 · 예문',24,'#e9f0e6');
  text(929,993,'나무 색칠 · 숨은그림',26,'#fff',700);text(929,1029,'같은 소재의 다음 놀이',24,'#e9f0e6');
  text(1342,993,'읽은 책 · 연습한 낱말',26,'#fff',700);text(1342,1029,'실제 제품 · 테스트 샘플',23,'#e9f0e6');
  // The report leads back to child choice, never to a mandatory task list.
  arrow('M1580 1073V1110H700V1073');rect(914,1090,344,44,'#fff9f3',12);text(1086,1120,'관심·기록에 맞는 다음 선택',24,ink,700,'middle');
  text(86,1174,'화면에서 손 놀이로',34,ink,700);text(86,1212,'인쇄 활동 · 탱고 블록 · 탱고 노트',25,muted);
  await image('activity-kr-block.svg',85,1230,367,224);
  await image('activity-note-bada.svg',475,1230,323,224);
  text(88,1480,'같은 낱말을 만들고 쓰기 · 노트 연계는 확장 계획',22,muted);
  text(886,1174,'좋아하는 이야기를 여러 언어로',34,ink,700);
  text(886,1212,'자국어의 첫 읽기 → 영어 → 한국어·중국어 등',25,muted);
  const types=['kr','en','vi','zh','th'],names=['한국어','English','베트남어','중국어','태국어'];
  for(let i=0;i<5;i++){flag(types[i],899+i*158,1244);text(938+i*158,1330,names[i],23,ink,700,'middle');}
  text(886,1384,'현재 5언어 콘텐츠 · 주요 아시아 언어 파닉스 제작 계획',24,muted);
  rect(886,1410,826,73,'#edf4e8',18);text(912,1454,'같은 그림·이야기 + 언어별 본문·음성·읽기 과정',25,ink,700);
  rect(66,1510,1668,90,'#e9eee4',20);
  text(99,1547,'계속 커지는 제작 기반',25,ink,700);
  text(99,1580,'AI 개발·제작 + 사람의 기획·검수',24,muted);
  text(644,1547,'양의 확장',25,ink,700);text(644,1580,'새 책 · 시리즈 · 학습 언어',24,muted);
  text(1085,1547,'깊이의 확장',25,ink,700);text(1085,1580,'어휘 · 활동 · 부모 가이드 · 학습 기록',24,muted);
  parts.push('</g></svg>');
  const svg=parts.join('');fs.writeFileSync(path.join(dir,'platform-overview.svg'),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir,'platform-overview.png'));
  fs.writeFileSync(path.join(dir,'platform-overview-sources-20261005.json'),JSON.stringify({createdAt:'2026-10-05',type:'SVG diagram with real local product assets',size:{width:W,height:H},assets:[...sources],scope:'시각적 연결 모식도. 실제 제품 UI 전체 화면 캡처가 아님. 보고서는 실제 제품의 테스트 샘플 화면 일부. 블록·노트는 활동 설명 도해, 노트 및 아시아 언어 파닉스는 확장 계획.'},null,2)+'\n');
  console.log(`Built SVG and PNG ${W}x${H}, using ${sources.size} existing assets.`);
}
build().catch(e=>{console.error(e);process.exit(1);});
