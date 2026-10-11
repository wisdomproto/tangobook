module.exports=({slides,img})=>{
 const asset=f=>'../investor-20261010/'+f;
 const cover=['proposal-cover','표지','TANGOBOOK','탱고북 사업계획서','',`<div class="td-title-cover"><div class="td-title-copy"><span>아날로그 × 디지털</span><h1>탱고북</h1><h2>유아 언어 학습 플랫폼</h2><p>앱의 안내와 실물 교구,<br>글자 학습부터 동화 읽기까지.</p><div class="td-title-meta">사업계획서 · 2026.10</div></div><figure>${img(asset('hardware-kit-studio-v3.png'),'앱과 실물 한글 블록이 연결된 탱고북 제품 구성')}</figure><div class="td-cover-index"><span>01 시장 배경</span><span>02 탱고북 플랫폼 생태계</span><span>03 탱고북 플랫폼 구성</span><span>04 사업화 전략</span></div></div>`];
 const divider=(id,num,title,sub,visual)=>[id,'PART '+num,'',title,'',`<div class="td-part"><div class="td-part-copy"><span class="td-part-number">PART ${num}</span><h2>${title}</h2><p>${sub}</p><div class="td-part-rule"></div></div><div class="td-part-visual">${visual}</div></div>`];
 const parts={
  vision:divider('part-product','02','탱고북 플랫폼 생태계','탱고북 개요 · 교구 학습 · 동화 연결',img(asset('hardware-feedback-use-v3.png'),'화면 안내를 보며 한글 블록을 조합하는 아이의 학습 장면')),
  'platform-overview':divider('part-content','03','탱고북 플랫폼 구성','저작도구 · 보유 콘텐츠 · 디지털 · 아날로그 · 마케팅 도구',`<div class="td-part-books">${img('series-changjak-coco-01.webp','코코 창작동화 삽화')}${img('series-changjak-pongi-01.webp','퐁이 창작동화')}${img('series-changjak-mina-01.webp','미나 창작동화')}</div>`),
  growth:divider('part-business','04','사업화 전략','상품 · 수익 구조 · 확장 · 출시 계획',`<div class="td-part-years"><span>2027</span><b>한국 출시</b><i>→</i><span>2028</span><b>아시아 3개국</b></div>`)
 };
 const original=slides.slice();
 const groups=[['01','시장 배경',0,2],['02','탱고북 플랫폼 생태계',2,5],['03','탱고북 플랫폼 구성',5,13],['04','사업화 전략',13,20]];
 const contents=['contents','차례','CONTENTS','차례','',`<div class="td-contents-grid">${groups.map(([n,title,start,end])=>`<article><div class="td-contents-heading"><span>${n}</span><h3>${title}</h3></div><div class="td-contents-links">${original.slice(start,end).map(([id,num,,heading])=>`<a href="#${id}"><span>${num}</span>${heading}<i aria-hidden="true">↗</i></a>`).join('')}</div></article>`).join('')}</div>`];
 slides.splice(0,slides.length,cover,contents,...original.flatMap(s=>parts[s[0]]?[parts[s[0]],s]:[s]));
 return `
 #investor-panel #proposal-cover,#investor-panel [id^="part-"]{padding:24px 0 36px}
 .td-contents-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px}
 .td-contents-grid>article{padding:24px;border:1px solid var(--doc-color-line);border-radius:8px;background:white}
 .td-contents-heading{display:flex;align-items:center;gap:18px;margin-bottom:18px}
 .td-contents-heading>span{font-size:30px;color:var(--doc-color-teal)}
 .td-contents-heading h3{font-size:24px;margin:0}
 .td-contents-links{display:grid;grid-template-columns:1fr;gap:8px}
 .td-contents-grid>article:nth-child(n+3) .td-contents-links{grid-template-columns:1fr 1fr;column-gap:22px}
 .td-contents-links a{display:flex;align-items:baseline;gap:10px;color:var(--doc-color-ink);font-size:15px;text-decoration:none;padding:6px 0;border-bottom:1px solid var(--doc-color-line)}
 .td-contents-links a>span{color:var(--doc-color-teal);font-size:13px;flex:none}.td-contents-links i{font-style:normal;margin-left:auto;color:var(--doc-color-teal)}
 .td-contents-links a:hover,.td-contents-links a:focus-visible{background:var(--doc-color-wash)}
 @media(max-width:699px){.td-contents-grid{grid-template-columns:1fr}.td-contents-grid>article:nth-child(n+3) .td-contents-links{grid-template-columns:1fr}}
 #proposal-cover>.section-badge,#proposal-cover>.section-h2,#proposal-cover>.section-sub,[id^="part-"]>.section-badge,[id^="part-"]>.section-h2,[id^="part-"]>.section-sub{display:none}
 .td-title-cover{display:grid;grid-template-columns:1fr 1.15fr;background:var(--doc-color-wash);border-radius:12px;overflow:hidden;align-items:center;min-height:540px}
 .td-title-copy{padding:48px 0 40px 40px}.td-title-copy>span{font-size:18px;color:var(--doc-color-teal)}.td-title-copy h1{font-size:76px;letter-spacing:-.065em;line-height:1.1;margin:22px 0}.td-title-copy h2{font-size:26px;line-height:1.4;margin:0}.td-title-copy p{font-size:17px;color:var(--doc-color-muted);margin:24px 0}.td-title-meta{font-size:13px;margin-top:40px;color:var(--doc-color-muted)}
 .td-title-cover figure{margin:0;padding:32px}.td-title-cover figure img{width:100%;height:auto!important;max-height:470px;object-fit:contain;border-radius:10px;mix-blend-mode:multiply}.td-cover-index{grid-column:1/-1;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;border-top:1px solid var(--doc-color-sage);padding:20px 40px;font-size:13px}
 .td-part{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;min-height:470px;background:var(--doc-color-ink);border-radius:12px;padding:40px;color:var(--doc-color-paper)}
 .td-part-number{font-size:15px;letter-spacing:.14em;color:var(--doc-color-brightMint)}.td-part h2{font-size:40px;line-height:1.3;color:var(--doc-color-paper);margin:24px 0 18px}.td-part p{font-size:16px;color:var(--doc-color-onDark)}.td-part-rule{height:3px;width:56px;background:var(--doc-color-brightMint);margin-top:36px}.td-part-visual>img{width:100%;height:330px!important;object-fit:cover;border-radius:8px}
 .td-part-books{display:flex;gap:12px;align-items:center}.td-part-books img{width:31%;height:220px!important;object-fit:cover;border-radius:5px}.td-part-books img:nth-child(2){transform:translateY(-25px)}.td-part-books img:nth-child(3){transform:translateY(15px)}
 .td-part-years{display:grid;grid-template-columns:1fr;gap:4px;border-left:1px solid var(--doc-color-darkLine);padding-left:48px}.td-part-years span{font-size:54px;line-height:1.2;color:var(--doc-color-brightMint)}.td-part-years b{font-size:23px}.td-part-years i{font-style:normal;font-size:28px;transform:rotate(90deg);width:30px;margin:16px 0}
 #vision .td-app-hub figure img{max-height:540px!important;object-fit:contain}
 @media(max-width:900px){.td-title-copy{padding:30px 0 25px 28px}.td-title-copy h1{font-size:60px}.td-title-copy h2{font-size:22px}.td-title-cover{min-height:450px}.td-title-cover figure{padding:20px}.td-part{gap:24px;padding:32px;min-height:400px}.td-part h2{font-size:32px}.td-part-visual>img{height:280px!important}.td-part-books img{height:180px!important}}
 @media(max-width:650px){.td-title-cover,.td-part{grid-template-columns:1fr}.td-title-copy{padding:28px 24px 0}.td-title-copy h1{font-size:58px}.td-title-copy p{margin:18px 0}.td-title-meta{margin-top:24px}.td-title-cover figure{padding:0 20px 20px}.td-title-cover figure img{max-height:280px}.td-cover-index{padding:18px 24px;display:grid;grid-template-columns:1fr 1fr;font-size:11px}.td-part{padding:30px 24px;gap:24px}.td-part h2{font-size:30px}.td-part-rule{margin-top:20px}.td-part-visual>img{height:240px!important}.td-part-years{padding-left:20px}.td-part-books{padding:20px 0}.td-part-books img{height:150px!important}}
 @media print{.td-title-cover,.td-part{min-height:600px;break-inside:avoid}.td-part{print-color-adjust:exact}.td-title-cover figure img{height:auto!important}}
`;
};
