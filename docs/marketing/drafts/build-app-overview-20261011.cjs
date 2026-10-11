// Editable proposal UI. Uses existing artwork; this is not an actual app screenshot.
const fs=require('fs');const path=require('path');
const sharp=require('C:/Users/kil21/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out=path.resolve(__dirname,'../assets/investor-20261010');
const text=(x,y,size,str,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${str}</text>`;
(async()=>{
const data=async f=>'data:image/png;base64,'+(await sharp(f).png().toBuffer()).toString('base64');
const word=await data(path.join(out,'phonics-gagu-word.webp'));
const book=await data(path.resolve(out,'../strategy-20261005/cover-1789350946382.webp'));
const scene=await data(path.join(out,'goldilocks-chair-scene.webp'));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="960" viewBox="0 0 1600 960">
<rect x="20" y="16" width="1560" height="928" rx="58" fill="#122f2c"/><circle cx="800" cy="40" r="6" fill="#53756d"/>
<rect x="52" y="67" width="1496" height="828" rx="28" fill="#fffaf3"/>
<g font-family="Malgun Gothic,sans-serif" fill="#183e38">
${text(102,141,39,'TangoBook','font-weight="700"')}${text(1510,138,24,'한글 · 영어','text-anchor="end" fill="#687e76"')}
<path d="M100 170H1500" stroke="#d8e3da" stroke-width="2"/>
${text(108,233,35,'오늘의 학습','font-weight="700"')}${text(1487,232,23,'첫 글자부터 동화 읽기까지','text-anchor="end" fill="#687e76"')}
<rect x="100" y="266" width="650" height="310" rx="24" fill="#e6f1e9"/>
${text(134,317,23,'한글 1권 · ㄱ 배우기','fill="#4c776b"')}
<image href="${word}" x="133" y="340" width="215" height="204" preserveAspectRatio="xMidYMid meet"/>
${text(400,429,71,'가구','font-weight="700"')}${text(400,478,25,'보고 듣고, 직접 만들기')}
<rect x="399" y="502" width="271" height="46" rx="23" fill="#228c82"/>
${text(535,534,22,'학습 시작  →','text-anchor="middle" fill="white" font-weight="700"')}
<rect x="777" y="266" width="723" height="310" rx="24" fill="#f4eadb"/>
${text(809,317,23,'동화책 · 읽기와 독후활동','fill="#7a6c54"')}
<image href="${scene}" x="809" y="343" width="297" height="194" preserveAspectRatio="xMidYMid slice"/>
${text(1132,399,27,'금발 머리 소녀와','font-weight="700"')}${text(1132,439,27,'곰 세 마리','font-weight="700"')}
${text(1132,500,22,'이야기 읽기  →')}
${text(109,632,27,'더 읽고, 더 연습하기','font-weight="700"')}
<rect x="100" y="655" width="432" height="133" rx="18" fill="#f0f0e8"/><image href="${book}" x="115" y="669" width="159" height="102" preserveAspectRatio="xMidYMid slice"/>
${text(294,711,26,'동화책','font-weight="700"')}${text(294,751,23,'이야기 고르기')}
<rect x="552" y="655" width="462" height="133" rx="18" fill="#eaf0f5"/>
${text(581,711,26,'독후활동','font-weight="700"')}${text(581,751,23,'듣기 · 찾기 · 순서 맞추기')}
<rect x="1034" y="655" width="466" height="133" rx="18" fill="#f6e7df"/>
${text(1063,711,26,'학습 리포트','font-weight="700"')}${text(1063,751,23,'교구와 앱의 학습 기록')}
${text(799,852,23,'학습 홈          파닉스          동화책          학습 현황','text-anchor="middle" fill="#55776e"')}
</g></svg>`;
fs.writeFileSync(path.join(out,'app-overview-v1.svg'),svg);
await sharp(Buffer.from(svg)).png().toFile(path.join(out,'app-overview-v1.png'));
await sharp(Buffer.from(svg)).webp({quality:94}).toFile(path.join(out,'app-overview-v1.webp'));
console.log('Rendered editable app overview illustration');
})();
