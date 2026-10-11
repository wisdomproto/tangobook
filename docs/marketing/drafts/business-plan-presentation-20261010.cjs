// Historical intermediate draft; not loaded by the canonical generator.
// Current investor main: business-plan-topdown-20261010.cjs.
// 투자자 속독용 표현: 블록·쓰기는 실물, 디지털은 안내·독후활동으로 구분한다.
// 실제 제품의 디지털 블록/쓰기 기능을 제거하거나 미구현으로 바꾸는 작업은 아니다.
module.exports=({slides,img})=>{
 const get=id=>slides.find(s=>s[0]===id);
 const photo=(file,alt,caption)=>`<figure class="v-photo">${img(file,alt).replace('<img ','<img style="width:100%;height:240px;object-fit:contain" ')}<figcaption>${caption}</figcaption></figure>`;
 const digital=photo('../investor-20261010/digital-hidden-object-actual.png','실제 거인의 정원 디지털 숨은그림 찾기의 그림과 낱말 선택 화면','디지털 독후활동 · 실제 숨은그림 찾기 화면');
 const media=get('media');
 media[3]='손으로 하는 연습에, 화면의 안내와 반응을 더합니다.';
 media[4]='손으로 조합하고 쓰는 연습에, 화면의 안내와 게임형 독후활동을 더합니다.';
 media[5]=media[5].replace(/<figure class="v-photo"><div class="ir-media-window right">[\s\S]*?<\/figure>/,digital)
  .replace('게임처럼 이어가는 배움','그림과 소리로 즐기는 독후활동');
 media[5]=media[5].slice(0,media[5].indexOf('<details'))+'<details class="v-evidence"><summary>부모의 구매 이유와 검증 기준</summary><p>탱고북은 실물 블록·쓰기 교구로 직접 만지고 표현하는 연습을 제공합니다. 디지털 콘텐츠는 그림·소리 안내와 숨은그림 찾기·그림 짝 찾기 등의 독후활동으로 흥미와 반복을 유도합니다. 부모의 구매 반응과 아이의 반복 사용은 실제 가정에서 확인합니다.</p></details></div>';
 const background=get('background');
 const business=get('business');
 business[4]='판매 제품은 실물 블록과 쓰기 교구입니다. 디지털 콘텐츠는 학습 안내와 독후활동을 제공합니다.';
 business[5]=business[5].replace('같은 낱말을 보고 듣기 → 블록으로 조합하기 → 손으로 쓰기','그림·소리 안내 · 숨은그림 찾기 · 그림 짝 찾기');
 const experience=get('experience');
 experience[5]=experience[5].replace('01 · 글자와 소리','01 · 실물 블록·쓰기').replace('그림과 소리로 배울 글자를 확인하고, 블록으로 조합하거나 직접 씁니다.','글자와 소리를 보고 들은 뒤, 실물 블록으로 조합하고 쓰기 교구로 연습합니다.').replace('반응을 확인하고 다시 도전하기','실물 블록으로 조합하고 손으로 쓰기');
 experience[5]=experience[5].replace(/<details class="v-evidence">[\s\S]*<\/details>/,'<details class="v-evidence"><summary>학습 활동과 제공 조건</summary><p>블록·쓰기는 실물 교구로 설명합니다. 디지털은 글자·낱말의 그림·소리 안내, 이야기 읽기와 독후활동을 제공합니다. 계정·이용권 조건과 콘텐츠별 제공 범위는 실제 서비스 상태에 맞춰 안내합니다.</p></details>');
 const growth=get('growth');
 growth[3]='디지털 독후활동으로 만나고, 실물 교구 구매로 연결합니다.';
 growth[4]='‘정원 속 나무 찾기’ 영상에서 시작해 온라인 체험과 교구 소개로 이어지는 유입 계획입니다.';
 growth[5]=`<div class="viz"><div class="v-growth ir-acquisition"><div><span class="v-label">01 / 발견</span><h3>숨은그림 찾기 영상</h3><p>동화책 장면에서 나무를 찾는 짧은 영상을 검색과 숏폼으로 소개합니다.</p></div><div><span class="v-label">02 / 디지털 체험</span><h3>같은 그림에서 직접 찾기</h3><p>현재 공개된 ‘거인의 정원’ 숨은그림 찾기로 안내합니다. 영상에서 본 낱말을 그림 속에서 찾아봅니다.</p></div><div><span class="v-label">03 / 실물 제품</span><h3>낱말을 만들고 쓰는 교구</h3><p>만난 낱말을 실물 블록으로 조합하고 쓰는 사용 장면을 보여줍니다. 구성과 가격은 확정한 뒤 안내합니다.</p></div><div><span class="v-label">04 / 반복 활용</span><h3>다른 낱말과 동화책</h3><p>새 콘텐츠의 낱말도 같은 교구로 조합하고 씁니다. 디지털 독후활동과 함께 복습할 내용을 제안합니다.</p></div></div><div class="v-takeaway"><b>영상으로 발견 → 디지털 독후활동 → 실물 교구 구매 → 새 낱말 복습.</b></div><p class="v-caption">현재 공개 독후활동을 활용한 기획 예시입니다. 영상·구매 경로의 공개 완료나 전환율을 보여주는 자료는 아닙니다. 교구와의 연결 범위는 검증·확정이 필요합니다.</p><details class="v-evidence"><summary>채널 운영과 확장 기준</summary><p>네이버·Google 검색, YouTube·Instagram 영상으로 실제 독후활동을 소개합니다. 체험·구매·반복 사용을 한국에서 먼저 확인한 뒤 현지 언어와 사용 환경에 맞춰 확장합니다. 조회수와 실제 구매를 구분하고 콘텐츠 제작·운영 비용도 함께 계산합니다.</p></details></div>`;
 // 대표 낱말 하나로 처음 만남→실물 연습→읽기/복습을 보여준다.
 const block=photo('../investor-20261010/tree-block-concept.svg','실물 자모 블록 ㄴ·ㅏ·ㅁ·ㅜ로 나무를 조합하는 설명도','아날로그 · 나무 블록 조합 설명도');
 const writing=photo('../investor-20261010/tree-writing-concept.svg','쓰기 교구에서 나무를 손으로 쓰는 설명도','아날로그 · 나무 쓰기 설명도');
 const tree=photo('giant-word-Tree.webp','거인의 정원의 실제 나무 어휘 그림','실제 나무 어휘 콘텐츠');
 media[5]=media[5].replace(/<figure class="v-photo"><div class="ir-media-window left">[\s\S]*?<\/figure>/,`<div class="v-pair">${block}${writing}</div>`).replace('학습 방식 설명을 위한 AI 이미지입니다. 실제 제품이나 고객 사진은 아닙니다. 자기주도 학습은 이 제품이 지향하는 설계 방향입니다.','블록·쓰기는 실물 교구 설명도, 디지털은 실제 독후활동 화면입니다. 자기주도 학습 유도는 설계 방향이며 효과는 별도 검증합니다.');
 const flow=`<div class="ir-one-word"><article><span class="v-label">01 / 디지털 안내</span>${tree}<h3>‘나무’를 보고 듣기</h3><p>그림과 소리로 낱말의 뜻을 만납니다.</p></article><article><span class="v-label">02 / 아날로그 블록</span>${block}<h3>‘나무’를 조합하기</h3><p>ㄴ·ㅏ·ㅁ·ㅜ 실물 블록으로 낱말을 만듭니다.</p></article><article><span class="v-label">03 / 아날로그 쓰기</span>${writing}<h3>‘나무’를 손으로 쓰기</h3><p>같은 낱말을 쓰기 교구로 연습합니다.</p></article><article><span class="v-label">04 / 디지털 독후활동</span>${digital}<h3>그림 속 ‘나무’ 찾기</h3><p>동화책을 읽고 그림 속에서 나무를 다시 찾습니다.</p></article></div>`;
 background[3]='배운 낱말을 손으로 익히고, 이야기 속에서 다시 만납니다.';
 background[4]='그림과 소리로 만난 낱말을 블록으로 조합하고 직접 쓴 뒤, 동화책과 독후활동에서 복습합니다.';
 background[5]=`<div class="viz">${flow}<div class="v-takeaway"><b>화면에서 시작한 배움을 손으로 익히고, 이야기로 넓힙니다.</b> 탱고북은 실물 교구와 디지털 콘텐츠로 같은 낱말을 반복해 익히도록 설계합니다.</div><p class="v-caption">‘나무’는 학습 흐름을 설명하기 위한 예시 낱말입니다. 나무 그림과 숨은그림 찾기는 실제 콘텐츠입니다. 블록·쓰기 설명도와 전체 연결은 제품·학습 설계 예시이며 확정 사양·연동 완료·학습 효과를 뜻하지 않습니다.</p></div>`;
 const vision=get('vision');
 vision[5]=vision[5].replace(/<figure class="v-linked-scene">[\s\S]*?<\/figure>/,`<figure class="v-linked-scene">${img('../investor-20261010/tree-block-concept.svg','대표 낱말 나무를 실물 블록으로 조합하는 설명도')}<figcaption>대표 낱말 ‘나무’ · 실물 교구 설명도</figcaption></figure>`);
 experience[5]=experience[5].replace('ㅂ + ㅏ = 바','ㄴ + ㅏ = 나').replace(img('word-kr-h1-u07-0.webp','실제 바다 어휘 그림'),img('giant-word-Tree.webp','실제 나무 어휘 그림')).replaceAll('바다','나무').replace('아이가 나무에서<br>조개를 찾았어요.','정원에 나무가<br>자라고 있어요.').replace('어디에서 찾았을까요?<br>무엇을 찾았을까요?','무엇이 자라고 있나요?<br>어디에 있나요?');
 // inline image attributes were added by the language module; replace the source explicitly.
 experience[5]=experience[5].replace(img('word-kr-h1-u07-0.webp','').match(/src="([^"]+)"/)[1],img('giant-word-Tree.webp','').match(/src="([^"]+)"/)[1]);
 business[5]=business[5].replace('배운 글자로 낱말을 직접 조합하기','실물 블록으로 ‘나무’ 조합하기').replace('배운 글자와 낱말을 직접 쓰기','쓰기 교구로 ‘나무’ 쓰기');
 const foundation=get('foundation');
 foundation[3]='새 낱말과 동화책에도 같은 교구를 사용합니다.';
 foundation[4]='한글·영어 학습 과정과 동화책 콘텐츠를 활용해, 구매 후에도 연습할 내용을 넓힙니다.';
 foundation[5]=foundation[5].replace(/<div class="ir-reuse">[\s\S]*?<div class="v-takeaway">/,`<div class="v-content-panel"><span class="v-label">LEARNING CONTENTS</span><div class="v-covers">${['series-changjak-mina-01.webp','series-changjak-pongi-01.webp','series-changjak-coco-01.webp','giant-cover-en.webp'].map(f=>img(f,'실제 동화책 표지')).join('')}</div><div class="v-content-labels"><span>한글·영어 학습</span><span>어휘 연습</span><span>동화책 읽기</span></div></div><div class="v-takeaway">`);
 const advantage=get('advantage');
 advantage[3]='교구 개발 경험과 디지털 콘텐츠 제작 기반을 갖췄습니다.';
 advantage[4]='과거 실물 교구 자료, 현재 공개 독후활동, 동화책 제작 기록으로 실행 기반을 보여줍니다.';
 advantage[5]=advantage[5].replace(/<figure class="v-photo">[\s\S]*?<\/figure>/g,(figure)=>figure.includes('한글 학습표 테스트 화면')?digital:figure)
  .replace('현재 학습·기록 제품','현재 디지털 콘텐츠')
  .replace('학습 과정과 연습 기록을 보여주는 제품','실제 공개된 디지털 독후활동')
  .replace('글자·소리 학습 과정과 연습 내용을 부모에게 보여주는 제품 화면입니다. 화면 속 기록은 테스트 데이터입니다.','동화책 장면과 낱말을 활용한 숨은그림 찾기입니다. 현재 공개된 콘텐츠 화면을 보여줍니다.')
  .replace('현재 학습 제품과 콘텐츠 제작 기반','현재 독후활동과 콘텐츠 제작 기반')
  .replace('교구 개발, 콘텐츠 제작, 학습 기록 관리. 세 가지 경험을 사업에 활용합니다.','과거 교구 개발 경험과 현재 콘텐츠 제작 기반을 새 제품에 활용합니다.');
 advantage[5]=advantage[5].replace('50권 · 500장 제작 기록','창작 동화책 제작 기록').replace('2026년 9월 삽화 제작·검수·등록 기록. 새 콘텐츠를 더하는 실행 근거입니다.','미나 시리즈의 삽화 제작·검수·등록 기록입니다. 세부 수량과 기준은 근거 자료에서 확인합니다.');
 const historicalFigure=advantage[5].match(/<figure class="v-photo">[\s\S]*?<\/figure>/)?.[0];
 if(historicalFigure){
  advantage[5]=advantage[5].replace(historicalFigure,'<div class="v-photo" style="min-height:180px;display:flex;align-items:center;justify-content:center;background:var(--doc-color-cream,#f7f5ef)"><p style="font-size:28px;line-height:1.5;text-align:center"><b>플레이탱고</b><br><span style="font-size:18px">실물 교구 개발 이력</span></p></div>');
  advantage[5]=advantage[5].replace('<summary>상세 이력·자산 근거</summary>','<summary>상세 이력·자산 근거</summary>'+historicalFigure);
 }
 // 학습 과정은 해결책 장과 중복되어 투자자 본편에서 제외한다. 내부 팀 자료는 유지한다.
 slides.splice(slides.findIndex(slide=>slide[0]==='experience'),1);
 return {updateTeam(team){return team.replace('<details class="team-intro">',`<div class="team-intro"><p><b>투자자 발표 기준:</b> 대표 낱말은 ‘나무’입니다. 디지털로 그림·소리를 만나고, 실물 블록으로 조합하고, 손으로 쓴 뒤 동화책·독후활동에서 다시 만나는 하나의 학습 흐름을 보여줍니다. 투자자 발표에서는 실물 블록·쓰기와 디지털 안내·독후활동을 대표 예시로 제시합니다. 이는 매체별 활동의 한계를 뜻하지 않습니다. 아래의 디지털 블록·쓰기 구현 자료는 내부 확인용입니다.</p></div><details class="team-intro">`);}};
};
