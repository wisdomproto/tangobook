// 기존 보유 자산 + 공개 서비스의 실제 화면. 공개 권수와 제작 권수를 합산하지 않는다.
module.exports=({img})=>{
 const asset=f=>'../investor-20261010/'+f;
 const catalogue=require('../assets/strategy-20261005/content-showcase-sources.json');
 const scale=require('../assets/strategy-20261005/catalogue-scale-20261005.json');
 const sum=match=>scale.categories.filter(c=>match(c.category)).reduce((n,c)=>n+c.public,0);
 const counts={'세계 명작':sum(c=>c==='세계 명작'),'전래동화':sum(c=>c==='전래 동화'),'생활동화':sum(c=>c==='생활동화'||c==='호리 유치원동화'),'자연관찰':sum(c=>/친구들$|우주와 자연|우리 몸|호리 세상 탐험/.test(c)),'창작동화':scale.creativeCatalogue};
 if(Object.values(counts).reduce((n,v)=>n+v,0)!==scale.currentLineup)throw Error('Storybook category counts do not reconcile');
 const pick=(g,n)=>catalogue.groups[g].books[n];
 const groups=[
  ['세계 명작','이야기로 만나는 상상과 감정',[pick(0,0),pick(0,1)]],
  ['전래동화','옛이야기로 만나는 지혜와 문화',[pick(1,0),pick(1,1)]],
  ['생활동화','친구·감정·일상 속 이야기',[pick(2,0),pick(2,3)]],
  ['자연관찰','동물·공룡·식물의 세계',[pick(4,1),pick(5,2)]]
 ];
 const books=`<div class="td-library-total"><span>전체 구성</span><strong>${scale.currentLineup.toLocaleString('ko-KR')}<small>권</small></strong><span>5개 분야 · 그림체별 판본 기준</span></div><div class="td-library-gallery">${groups.map(([title,desc,books])=>`<article><div class="td-category-heading"><h3>${title}</h3><b>${counts[title]}<small>권</small></b></div><figure>${img(books[0].file,books[0].title+' 표지')}<figcaption>${books[0].title.replace(/^\d+\. /,'')}</figcaption></figure><p>${desc}</p></article>`).join('')}</div>
<div class="td-original-gallery"><div class="td-gallery-heading"><h3>창작동화 <b class="td-creative-count">${counts['창작동화']}<small>권</small></b></h3><p>${scale.creativeSeries}개 시리즈 · 친구 · 가족 · 일상 · 모험</p></div><div>${[catalogue.groups[6].books[0],catalogue.groups[6].books[1],catalogue.groups[6].books[4]].map(b=>`<figure>${img(b.file,b.series+' 본문')}<figcaption>${b.series}</figcaption></figure>`).join('')}</div></div><p class="td-note">2026.10.05 집계 · 그림체별 판본 기준 · 자연관찰은 탐구 콘텐츠 포함</p><details class="v-evidence"><summary>분류별 집계 기준</summary><p>기존 제안서의 전체 구성 ${scale.currentLineup}권 기준입니다. 세계 명작144권·전래동화40권·생활동화63권·자연관찰 및 탐구115권·창작동화850권을 중복 없이 합산했습니다. 생활동화는 생활동화와 호리 유치원동화, 자연관찰은 동물·공룡·식물·우주·인체·호리 세상 탐험을 포함합니다. 같은 이야기의 다른 그림체는 별도 판본으로 계산하며 번역 언어 수를 곱하지 않습니다. 창작동화는 사용자 지정에 따라 공개된 상품 구성을 전제로 설명합니다.</p></details>`;
 const activities=[
  ['듣고 이해하기','이야기 듣고 그림 찾기','들은 내용에 어울리는 장면을 고릅니다.','story-listening-actual.png'],
  ['낱말과 장면 연결하기','이 물건 어느 장면?','낱말 속 물건이 등장하는 장면을 찾습니다.','object-scene-actual.png'],
  ['어휘 찾아보기','숨은그림 찾기','책 속 그림을 찾으며 낱말을 다시 만납니다.','giant-reading-activity-actual.png'],
  ['이야기 흐름 떠올리기','쪽 순서 맞추기','삽화를 이야기의 순서대로 놓습니다.','page-order-actual.png']
 ];
 const games=`<div class="td-activity-collection">${activities.map(([skill,title,text,file],i)=>`<article><div class="td-activity-heading"><span class="td-activity-number">0${i+1}</span><h3>${title}</h3></div><figure>${img(asset(file),'거인의 정원 · '+title+' 실제 활동 화면')}</figure><p>${text}</p></article>`).join('')}</div><p class="td-note">『거인의 정원』 실제 활동 화면 · 제공 활동은 책·언어별로 다릅니다.</p>`;
 const ai=`<figure class="td-authoring-visual"><div class="td-editor-mock"><div class="td-editor-bar"><b>TangoBook <span>STUDIO</span></b><span>거인의 정원 <i>·</i> 콘텐츠 제작</span><small>편집 · 검수</small></div><div class="td-editor-workspace"><aside class="td-editor-pages"><span class="v-label">장면 구성</span>${['giant-page-1.webp','giant-page-3.webp'].map((f,i)=>`<div class="${i===0?'selected':''}">${img(f,'거인의 정원 본문 장면')}<span>0${i+1} 장면</span></div>`).join('')}<div class="td-editor-add">＋ 다음 장면</div></aside><div class="td-editor-canvas"><div class="td-editor-canvas-label"><span>본문 · 삽화</span><span>한국어</span></div>${img(asset('authoring-giant-page.webp'),'거인의 정원 실제 보유 삽화를 배치한 저작도구 구성 예시')}<div class="td-editor-manuscript"><span class="v-label">원고 예시</span><p>아이들은 거인의 정원에서 뛰어놀았어요.<br>나무에는 꽃이 피고, 새들은 노래했지요.</p><div><span>▶ 음성 듣기</span><span>문장 수정</span></div></div></div><aside class="td-editor-ai"><span class="v-label">AI 제작 도구</span><h3>한 장면에서<br>다양한 콘텐츠로</h3><div class="td-editor-tool"><b>이야기 · 삽화</b><span>원고 다듬기 / 장면 생성</span></div><div class="td-editor-tool"><b>다국어 · 음성</b><span>번역 / 나레이션 제작</span></div><div class="td-editor-tool"><b>어휘 · 독후활동</b><span>책의 글·그림으로 활동 구성</span></div><div class="td-editor-review"><b>편집자 검수</b><span>연령 적합성 · 문장과 그림<br>캐릭터 일관성 · 번역과 발음</span></div></aside></div><div class="td-editor-flow"><b>기획</b><span>→</span><b>AI 제작</b><span>→</span><b>사람의 검수</b><span>→</span><b>공개 · 활동 확장</b></div></div><figcaption>저작도구 구성 예시 · 실제 보유 삽화와 예시 원고로 재구성</figcaption></figure>
<div class="td-ai-values"><article><b>제작 비용 절감</b><p>반복 작업과 별도 자산 제작을 줄입니다.</p></article><article><b>품질 관리</b><p>편집·검수·수정을 거쳐 공개합니다.</p></article><article><b>지속적인 콘텐츠 추가</b><p>새 주제·시리즈·언어로 읽을거리를 늘립니다.</p></article></div><details class="v-evidence"><summary>구현 기반과 비용 검증 범위</summary><p>현재 저작도구에 이야기·삽화·음성·번역 제작 기능이 있고, 책의 글·그림에서 학습 활동을 구성하는 로직이 있습니다. 각 단계의 자동화와 사람의 편집·검수를 결합하는 운영 방식입니다. 완전 무인 제작을 뜻하지 않으며, 권당 제작비·검수 시간·절감률은 운영 실측 후 제시합니다.</p></details>`;
 return {books,games,ai};
};
