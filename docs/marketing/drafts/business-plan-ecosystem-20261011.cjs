// Part 2: 투자자가 이 부분만 읽어도 학습 범위, 이용 과정, 구매 가치를 이해하도록 구성.
module.exports=({img})=>{
 const asset=f=>'../investor-20261010/'+f;
 const scope=`<div class="eco-scope">
 <article><span class="eco-kicker">01 · 글자와 소리</span><h3>한글·영어 파닉스</h3><div class="eco-letters">${img(asset('phonics-covers/ko-1-chapter-v3.webp'),'한글 기본 글자 학습')}${img(asset('phonics-covers/en-1-chapter-v3.webp'),'영어 알파벳 학습')}</div><b>한글 4권 · 영어 5권</b><p>글자 익히기 → 조합 → 낱말 읽기</p></article>
 <article><span class="eco-kicker">02 · 문장과 이야기</span><h3>동화 읽기</h3><div class="eco-cover-pair">${img('cover-1789350946382.webp','거인의 정원 동화책')}${img('series-changjak-coco-01.webp','코코네 빵집 골목 창작동화')}</div><b>명작·전래·생활·자연관찰·창작</b><p>배운 낱말을 문장과 이야기에서 만나기</p></article>
 <article><span class="eco-kicker">03 · 이해와 복습</span><h3>독후활동</h3><div class="eco-game">${img(asset('giant-reading-activity-actual.png'),'거인의 정원 실제 독후활동 화면')}</div><b>듣기 · 낱말 찾기 · 순서 맞추기</b><p>읽은 내용을 게임으로 다시 확인하기</p></article>
 </div><div class="eco-path"><span>글자·소리</span><i>→</i><span>낱말·문장</span><i>→</i><span>이야기 이해</span></div>`;
 const choice=`<div class="eco-choice">
 <article><span class="eco-kicker">디지털 학습</span><h3>앱으로 시작</h3>${img(asset('digital-tablet-giyeok-v3.webp'),'태블릿의 ㄱ 카드를 세 번씩 누르며 글자와 소리를 익히는 아이')}<b>ㄱ을 누르고 소리 듣기</b><p>글자 카드를 세 번씩 터치하며<br>모양과 소리를 반복해서 익히기</p></article>
 <article class="eco-choice-main"><span class="eco-kicker">주력 상품 · 블록 + 구독 12개월</span><h3>손으로 조합</h3>${img(asset('hardware-feedback-use-v3.png'),'화면의 안내를 보며 실물 블록을 조합하는 아이')}<b>화면의 문제를 실물 블록으로 해결</b><p>손으로 글자를 만들고<br>앱의 반응에 따라 반복 연습</p></article>
 <article><span class="eco-kicker">추가 교구 · 탱고노트</span><h3>종이에 쓰기</h3>${img(asset('tangonote-product-v5.webp'),'종이에 필기하고 앱과 연결하는 탱고노트')}<b>실제 종이·펜으로 쓰는 경험</b><p>쓴 내용과 학습지 정보를<br>앱에 연결하는 쓰기 학습</p></article>
 </div><div class="eco-value"><div><span>아이</span><b>손으로 직접 조합·필기</b></div><div><span>앱</span><b>학습 순서·반응·다음 활동 안내</b></div><div><span>부모</span><b>설명·준비 부담 완화</b></div></div><p class="td-note">앱·교구 연동 경험은 개발·검증 중입니다. 탱고노트는 별도 상품으로 2027년 3분기 출시 계획입니다.</p>`;
 const css=`
 .eco-scope,.eco-choice{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
 .eco-scope article,.eco-choice article{padding:24px;background:white;border:1px solid var(--doc-color-line);border-radius:12px;min-width:0}
 .eco-kicker{font-size:14px;color:var(--doc-color-teal);display:block;margin-bottom:12px}
 .eco-scope h3,.eco-choice h3{font-size:29px;margin:0 0 22px}
 .eco-scope article>b,.eco-choice article>b{display:block;font-size:19px;margin-top:22px;line-height:1.5}
 .eco-scope p,.eco-choice p{font-size:17px;line-height:1.7;margin:10px 0 0;color:var(--doc-color-muted)}
 .eco-letters,.eco-cover-pair{display:flex;gap:12px;height:270px;align-items:center}
 .eco-letters img{width:calc(50% - 6px);height:240px!important;object-fit:contain;border-radius:8px}
 .eco-cover-pair{position:relative;background:var(--doc-color-wash);border-radius:8px;padding:16px}
 .eco-cover-pair img{width:58%;height:190px!important;object-fit:cover;border:6px solid white;box-shadow:0 8px 18px #173e3620}
 .eco-cover-pair img:first-child{align-self:flex-start;transform:rotate(-5deg)}
 .eco-cover-pair img:last-child{position:absolute;right:16px;bottom:16px;transform:rotate(5deg)}
 .eco-game{height:270px;display:flex;align-items:center;background:var(--doc-color-wash);border-radius:8px;padding:8px}
 .eco-game img{width:100%;height:100%!important;object-fit:contain}
 .eco-path{display:flex;justify-content:center;align-items:center;gap:40px;padding:24px;background:var(--doc-color-wash);border-radius:8px;margin-top:28px;font-size:23px;font-weight:700}.eco-path i{font-style:normal;color:var(--doc-color-teal)}
 .eco-choice article>img{height:265px!important;width:100%;object-fit:cover;border-radius:8px}.eco-choice article:last-child>img{object-fit:contain;background:var(--doc-color-paper)}
 .eco-choice .eco-choice-main{border:2px solid var(--doc-color-teal);background:var(--doc-color-wash)}
 .eco-value{display:grid;grid-template-columns:repeat(3,1fr);margin-top:24px;border-top:1px solid var(--doc-color-line);padding-top:22px;gap:24px}.eco-value span{display:block;color:var(--doc-color-teal);font-size:14px;margin-bottom:7px}.eco-value b{font-size:20px}
 @media(max-width:699px){.eco-scope,.eco-choice,.eco-value{grid-template-columns:1fr}.eco-path{gap:12px;font-size:16px;padding:18px}.eco-value{gap:16px}}
`;
 return {scope,choice,css};
};
