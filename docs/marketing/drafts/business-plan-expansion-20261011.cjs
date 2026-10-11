module.exports=({img})=>{
 const asset=f=>'../investor-20261010/'+f;
 const platform=`<div class="td-language-expansion"><div><h3>아시아 언어</h3><p>글자·소리·낱말을 배우는 과정을<br>언어별 특성에 맞춰 확장합니다.</p></div><div class="td-language-road"><div class="td-language-current"><span>현재 기반</span><b>한글 · 영어</b></div><div class="td-language-next"><span>추가 개발 언어</span><div><b>베트남어 <small>VI</small></b><b>태국어 <small>TH</small></b><b>말레이어 <small>MS</small></b></div></div></div></div>
<div class="td-expansion-heading"><h3>추가 블록</h3></div>
<div class="td-block-expansion">${[
 ['숫자·연산 블록','수를 세고, 조합하고, 계산하기','expansion-numbers-blocks.webp'],
 ['창의 블록','색·모양을 조합해 새로운 형태 만들기','expansion-creative-blocks.webp'],
 ['보드게임 블록','길 연결·공간 채우기·논리 퍼즐','expansion-puzzle-blocks.webp']
 ].map(([title,desc,file])=>`<article><figure>${img(asset(file),title+' 개발 방향 예시')}</figure><h3>${title}</h3><p>${desc}</p></article>`).join('')}</div>
<div class="v-takeaway"><b>확장 방식 · 공통 인식판 + 추가 블록 + 앱 콘텐츠</b></div><p class="td-note">새 언어 과정과 추가 블록은 개발 방향이며, 그림은 제품 콘셉트입니다. 블록별 인식·호환성·학습 설계는 검증 후 확정합니다. 언어 확장 후보와 2028년 판매 예정 국가는 별도 계획입니다.</p>`;
 const stories=`<div class="td-age-path"><div><span class="v-label">현재 · 유아</span><h3>글자·낱말과 동화 읽기</h3><p>한글·영어 파닉스 · 동화책 · 독후활동</p></div><span class="td-age-arrow" aria-hidden="true">→</span><div><span class="v-label">확장 · 초등 저학년</span><h3>주제별 학습만화</h3><p>역사 · 문화 · 모험으로 읽기 범위 확대</p></div></div>
<div class="td-comic-expansion"><figure>${img(asset('tico-ep01-p7.png'),'타임 티코 1화 실제 보유 삽화')}<figcaption>타임 티코 · 보유 학습만화 삽화 예시</figcaption></figure><div><span class="v-label">학습만화 확장 주제</span><ul><li><b>타임 티코</b><span>시대여행·생존 등 주제별 이야기</span></li><li><b>삼국지</b><span>인물과 사건을 따라가는 역사 이야기</span></li><li><b>그리스 로마신화</b><span>신화로 만나는 상상과 문화</span></li></ul></div></div><p class="td-age-continuity"><b>유아 콘텐츠도 지속 추가</b><span>기존 창작동화를 바탕으로 새로운 주제·그림체·시리즈 개발</span></p><p class="td-note">타임 티코는 보유 삽화 예시입니다. 신규 시리즈와 학습만화 확대는 개발 계획입니다.</p>`;
 return {platform,stories};
};
