// Existing Snow White materials, presented as channel-specific examples.
module.exports=({img})=>{
 const root='../investor-20261010/marketing-snow-white/';
 const pic=(name,alt)=>img(root+name,alt);
 const logo=(name)=>img('../investor-20261010/channel-logos/'+name+'.svg',name);
 return {html:`<div id="marketing-examples" class="mk-examples">
 <div class="mk-example-heading"><span class="mk-tag">콘텐츠 활용 예시</span><h3>백설공주 → 블로그 · 카드뉴스 · 숏폼</h3><p>동화의 이야기·삽화·음성을 채널에 맞는 홍보 콘텐츠로 재구성합니다.</p></div>
 <div class="mk-example-source">${pic('cover.webp','백설공주 보유 삽화')}<div><span>공통 원본 · 백설공주</span><b>이야기 + 삽화 + 음성</b><p>AI 원고 생성 · 채널별 편집 → 검수 후 예약 발행</p></div></div>
 <div class="mk-example-grid">
 <article class="mk-example"><div class="mk-example-head"><div class="mk-example-logos">${logo('naver')}${logo('google')}</div><h4>블로그</h4><span>검색으로 만나는 콘텐츠</span></div>
 <div class="mk-blog-preview"><div class="mk-blog-top">TangoBook <span>동화 가이드</span></div><h5>백설공주 줄거리와 교훈</h5><p class="mk-blog-deck">아이와 함께 읽고 이야기 나누기</p>${pic('cover.webp','블로그 본문에 활용한 백설공주 삽화')}<h6>백설공주, 어떤 동화인가요?</h6><p>왕비를 피해 숲속으로 떠난 공주가 일곱 난쟁이와 만나 시련을 이겨 내는 이야기입니다.</p><h6>아이와 나눌 질문</h6><p>“난쟁이들은 왜 백설공주를 도와줬을까?”</p><div class="mk-example-cta">탱고북에서 동화 읽기 →</div></div>
 <p class="mk-example-purpose">줄거리·교훈·읽어주기 팁으로<br>검색 유입과 동화 체험 연결</p></article>
 <article class="mk-example"><div class="mk-example-head"><div class="mk-example-logos">${logo('instagram')}</div><h4>카드뉴스</h4><span>장면과 질문으로 관심 유도</span></div>
 <div class="mk-card-preview"><span>TangoBook · 명작동화</span><h5>백설공주,<br>어떤 동화인가요?</h5>${pic('apple.webp','사과를 건네받는 백설공주 카드뉴스 장면')}<div><small>아이와 함께 이야기해요</small><b>“나라면 어떻게 했을까?”</b></div><footer><span>줄거리 → 교훈 → 읽기</span><b>1 / 6</b></footer></div>
 <p class="mk-example-purpose">핵심 장면과 짧은 문장으로<br>이야기 소개·저장·공유 유도</p></article>
 <article class="mk-example"><div class="mk-example-head"><div class="mk-example-logos">${logo('youtube')}${logo('instagram')}</div><h4>쇼츠·릴스</h4><span>영상으로 만나는 동화</span></div>
 <div class="mk-short-preview">${pic('shorts-poster.png','백설공주 기존 제작 숏폼 썸네일')}</div>
 <p class="mk-example-purpose">삽화·나레이션·자막으로 구성한<br>기존 제작 영상의 썸네일</p></article>
 </div>
 <div class="mk-callout"><b>콘텐츠 추가 → 홍보 자료 확대</b><span>동화 체험과 브랜드 검색을 늘려 유통사의 제품 소개·판매를 지원합니다.</span></div>
 <p class="mk-note">블로그·카드뉴스는 기존 원고와 보유 삽화를 활용한 편집 예시이며, 숏폼은 기존 제작 영상의 썸네일입니다.</p>
 </div>`,css:`
 #marketing-panel .mk-examples{scroll-margin-top:160px;margin:36px 0 30px;border-top:1px solid var(--doc-color-line);padding-top:30px}
 #marketing-panel .mk-example-heading h3{font-size:28px;margin:12px 0}#marketing-panel .mk-example-heading p{font-size:16px;color:var(--doc-color-muted)}
 #marketing-panel .mk-example-source{display:flex;align-items:center;gap:24px;padding:18px;background:var(--doc-color-wash);border-radius:12px;margin:24px 0 32px}#marketing-panel .mk-example-source>img{width:150px;aspect-ratio:16/9;object-fit:cover}#marketing-panel .mk-example-source span{font-size:13px;color:var(--doc-color-muted)}#marketing-panel .mk-example-source b{display:block;font-size:22px}#marketing-panel .mk-example-source p{font-size:14px;margin-top:4px}
 #marketing-panel .mk-example-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}#marketing-panel .mk-example{min-width:0}#marketing-panel .mk-example .mk-example-head{min-height:106px;display:block;color:var(--doc-color-ink)}#marketing-panel .mk-example h4{font-size:24px;margin:10px 0 4px;line-height:1.2}#marketing-panel .mk-example .mk-example-head>span{font-size:13px;color:var(--doc-color-muted)}
 #marketing-panel .mk-example-logos{display:flex;gap:10px;height:23px}#marketing-panel .mk-example-logos img{width:23px;height:23px;border-radius:0}
 #marketing-panel .mk-blog-preview,#marketing-panel .mk-card-preview{min-height:490px;background:white;border:1px solid var(--doc-color-line);border-radius:12px;overflow:hidden;padding:20px}
 #marketing-panel .mk-blog-top{font-size:14px;font-weight:700;border-bottom:1px solid var(--doc-color-line);padding-bottom:10px;color:var(--doc-color-teal)}#marketing-panel .mk-blog-top span{float:right;font-size:11px;font-weight:400}#marketing-panel .mk-blog-preview h5{font-size:22px;line-height:1.35;margin:16px 0 8px}#marketing-panel .mk-blog-preview .mk-blog-deck{font-size:12px;margin:0 0 14px;color:var(--doc-color-muted)}#marketing-panel .mk-blog-preview h6{font-size:15px;margin:18px 0 5px}#marketing-panel .mk-blog-preview p{font-size:13px;line-height:1.65;margin:0}#marketing-panel .mk-blog-preview img{aspect-ratio:16/9;object-fit:cover}#marketing-panel .mk-example-cta{font-size:13px;color:var(--doc-color-teal);margin-top:18px;border-top:1px solid var(--doc-color-line);padding-top:12px}
 #marketing-panel .mk-card-preview{background:#f4e9d4;display:flex;flex-direction:column;padding:22px 18px}#marketing-panel .mk-card-preview>span{font-size:12px;letter-spacing:.02em}#marketing-panel .mk-card-preview h5{font-size:29px;line-height:1.35;margin:20px 0}#marketing-panel .mk-card-preview img{aspect-ratio:1.15;object-fit:cover}#marketing-panel .mk-card-preview>div{padding:20px 0}#marketing-panel .mk-card-preview small{display:block;font-size:12px}#marketing-panel .mk-card-preview b{font-size:16px}#marketing-panel .mk-card-preview footer{display:flex;justify-content:space-between;gap:8px;border-top:1px solid #cdbf9f;padding-top:14px;margin-top:auto;font-size:11px}#marketing-panel .mk-card-preview footer b{font-size:12px}
 #marketing-panel .mk-short-preview{background:#151019;border-radius:12px;overflow:hidden;max-width:276px;margin:auto}#marketing-panel .mk-short-preview img{width:100%;aspect-ratio:9/16;display:block;object-fit:contain}#marketing-panel .mk-example-purpose{font-size:14px;line-height:1.7;margin-top:16px}
 @media(max-width:1000px){#marketing-panel .mk-example-grid{gap:14px}#marketing-panel .mk-blog-preview,#marketing-panel .mk-card-preview{padding:15px}#marketing-panel .mk-blog-preview h5{font-size:20px}#marketing-panel .mk-card-preview h5{font-size:25px}}
 @media(max-width:700px){#marketing-panel .mk-example-grid{grid-template-columns:1fr;gap:32px}#marketing-panel .mk-example .mk-example-head{min-height:0;margin-bottom:16px}#marketing-panel .mk-blog-preview,#marketing-panel .mk-card-preview{min-height:0;padding:22px}#marketing-panel .mk-example-source{gap:14px;align-items:flex-start}#marketing-panel .mk-example-source>img{width:90px}#marketing-panel .mk-example-source b{font-size:18px}#marketing-panel .mk-example-source p{font-size:12px}#marketing-panel .mk-short-preview{max-width:280px}#marketing-panel .mk-example-heading h3{font-size:24px}}
 @media print{#marketing-panel .mk-example{break-inside:avoid}#marketing-panel .mk-example-grid{gap:12px}#marketing-panel .mk-examples{break-before:page}}
`};
};
