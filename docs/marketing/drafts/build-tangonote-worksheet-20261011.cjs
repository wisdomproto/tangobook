// Native, editable worksheet artwork; layout inspired by the user's 2024 proposal.
const fs=require('fs');const path=require('path');
const sharp=require('C:/Users/kil21/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out=path.resolve(__dirname,'../assets/investor-20261010');
(async()=>{
const art=(await sharp(path.join(out,'phonics-gagu-word.webp')).png().toBuffer()).toString('base64');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1280" viewBox="0 0 1400 1280">
<rect width="1400" height="1280" fill="#fff9e9"/>
<path d="M0 0H1400V110H0Z" fill="#f4c94f"/>
<g font-family="Malgun Gothic,sans-serif" fill="#234f4b">
<text x="52" y="68" font-size="29" font-weight="700">TangoBook</text>
<text x="325" y="70" font-size="38" font-weight="700">가 · 구를 따라 써요</text>
<rect x="1110" y="28" width="238" height="55" rx="27" fill="white"/>
<text x="1229" y="65" font-size="25" text-anchor="middle">한글 1권 · ㄱ</text>
<text x="55" y="168" font-size="27">① 글자의 소리를 듣고, 순서대로 써 보세요.</text>
<rect x="45" y="205" width="644" height="498" rx="22" fill="#40b6ba"/>
<rect x="711" y="205" width="644" height="498" rx="22" fill="#639ed3"/>
<text x="368" y="570" font-size="350" font-weight="700" text-anchor="middle" fill="white">가</text>
<text x="1033" y="570" font-size="350" font-weight="700" text-anchor="middle" fill="white">구</text>
<g fill="#ffffff" fill-opacity=".85"><rect x="190" y="625" width="355" height="48" rx="24"/><rect x="855" y="625" width="355" height="48" rx="24"/></g>
<text x="368" y="657" text-anchor="middle" font-size="28">ㄱ + ㅏ = 가</text><text x="1033" y="657" text-anchor="middle" font-size="28">ㄱ + ㅜ = 구</text>
<text x="55" y="762" font-size="27">② 그림을 보고, 같은 낱말을 써 보세요.</text>
<rect x="45" y="803" width="400" height="379" rx="22" fill="#fff" stroke="#eddfb8" stroke-width="2"/>
<image href="data:image/png;base64,${art}" x="95" y="820" width="300" height="270"/>
<text x="245" y="1146" text-anchor="middle" font-size="49" font-weight="700">가구</text>
<rect x="475" y="803" width="880" height="379" rx="22" fill="white" stroke="#eddfb8" stroke-width="2"/>
<path d="M505 995H1325M915 835V1150" fill="none" stroke="#dce8e1" stroke-width="3" stroke-dasharray="9 8"/>
<g font-size="140" text-anchor="middle" fill="#bbd7d2"><text x="710" y="966">가구</text><text x="1120" y="966">가구</text><text x="710" y="1144">가구</text><text x="1120" y="1144">가구</text></g>
<text x="52" y="1240" font-size="23" fill="#72837c">탱고 한글 파닉스</text><text x="1345" y="1240" text-anchor="end" font-size="25">01</text>
</g></svg>`;
fs.writeFileSync(path.join(out,'tangonote-worksheet-v2.svg'),svg);
await sharp(Buffer.from(svg)).png().toFile(path.join(out,'tangonote-worksheet-v2.png'));
})().catch(e=>{console.error(e);process.exit(1)});
