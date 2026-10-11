// 실물 제품 이력·현재 게임 화면·현재 콘텐츠·연계 기획을 구분한다.
module.exports=({slides,img})=>{
 const get=id=>slides.find(s=>s[0]===id);
 const photo=(file,alt,caption,height=240)=>`<figure class="v-photo">${img(file,alt).replace('<img ',`<img style="height:${height}px;width:100%;object-fit:contain" `)}<figcaption>${caption}</figcaption></figure>`;
 const asset=file=>'../investor-20261010/'+file;
 const actualGame=photo(asset('language-block-game-actual.png'),'실제 탱고북 한글 블록 게임의 나비 미션과 조각 배치판','현재 디지털 제품 · 실제 한글 블록 게임 화면');
 const pastProduct=photo(asset('playtango-hardware-ir-extract.png'),'과거 플레이탱고 IR에 실린 실물 교구와 연계 게임 화면','과거 제품 · 사용자 제공 2024.01 IR 11쪽',225);
 const media=get('media'), priorMedia=media[5];
 media[2]='부모의 구매 이유';
 media[5]=`<div class="viz"><div class="v-comparison"><article><span class="v-label">ANALOG · 손으로 익히기</span><h3>직접 조합하고 쓰는 연습</h3><div class="v-pair">${photo('activity-kr-block.svg','실물 자모 조합 활동 설명 도해','블록 조합 · 활동 도해',155)}${photo('duck-note-link.svg','탱고 노트 쓰기 연계 설명 도해','쓰기 · 연계 기획',155)}</div><div class="v-pro"><b>＋ 장점</b><span>직접 만지고 조합 · 손으로 표현</span></div><div class="v-con"><b>△ 한계</b><span>교구만으로 반응·새 학습 소재를 제공하기 어려움</span></div></article><article><span class="v-label">DIGITAL · 게임처럼 이어가기</span><h3>미션과 반응으로 도전 유도</h3>${photo('activity-kr-hunt.svg','소리를 듣고 글자를 찾는 디지털 미션 설명 도해','글자 사냥 · 활동 설명 도해',225)}<div class="v-pro"><b>＋ 장점</b><span>그림·소리·반응 · 반복과 다음 선택 유도</span></div><div class="v-con"><b>△ 한계</b><span>화면 조작만으로 실물 조합·쓰기 경험에 한계</span></div></article></div><div class="v-takeaway">부모에게는 <b>손으로 익히는 연습</b>, 아이에게는 <b>다시 도전할 재미</b>. 어휘·동화책으로 오래 쓸 이유를 더합니다.</div><details class="v-evidence"><summary>구매 이유와 관찰할 가치</summary>${priorMedia}</details></div>`;
 const background=get('background');
 const learningImage=(side,alt)=>`<figure class="v-photo"><div class="ir-media-window ${side}">${img(asset('analog-digital-premium-concept.png'),alt)}</div><figcaption>학습 방식 설명 · AI 콘셉트 이미지</figcaption></figure>`;
 media[5]=`<div class="viz"><div class="v-comparison"><article><span class="v-label">01 / ANALOG</span><h3>손으로 익히는 배움</h3>${learningImage('left','직접 글자를 쓰고 실물 자모 블록으로 연습하는 아이의 콘셉트')}<div class="v-pro"><b>장점</b><span>직접 조합하고 쓰며, 손으로 연습</span></div><div class="v-con"><b>한계</b><span>교구만으로 반응·새 콘텐츠 제공에 한계</span></div></article><article><span class="v-label">02 / DIGITAL</span><h3>게임처럼 이어가는 배움</h3>${learningImage('right','태블릿의 그림과 글자 게임으로 배우는 아이의 콘셉트')}<div class="v-pro"><b>장점</b><span>그림·소리·반응으로 흥미·반복·자기주도 학습 유도</span></div><div class="v-con"><b>한계</b><span>화면만으로 실물 조합·쓰기 경험에 한계</span></div></article></div><div class="v-takeaway">탱고북은 <b>손으로 익히는 연습</b>에 <b>게임의 재미와 반응</b>을 더합니다.</div><p class="v-caption">학습 방식 설명을 위한 AI 이미지입니다. 실제 제품·고객 사진이 아니며 자기주도 학습 유도는 설계 방향입니다.</p><details class="v-evidence"><summary>부모의 구매 이유와 검증 조건</summary>${priorMedia}</details></div>`;
 background[3]='미션을 보고, 손으로 만들고, 다음 배움으로.';
 background[4]='화면의 게임 경험을 실물 블록·쓰기로 확장하는 제품 설계.';
 background[5]=`<div class="viz"><div class="v-pair">${photo(asset('screen-block-use-concept.png'),'화면 안내에 따라 실물 자모를 조합하는 AI 사용 장면','제품 연동 경험 · AI 콘셉트',280)}${actualGame}</div><div class="v-sequence"><article class="v-node"><span class="v-label">01 · 미션</span><h3>그림과 낱말을 만납니다.</h3><p>‘나비’처럼 익힐 낱말과 조합할 글자를 보여줍니다.</p></article><span class="v-arrow">→</span><article class="v-node"><span class="v-label">02 · 도전</span><h3>조합하고, 확인합니다.</h3><p>조각을 배치·회전하며 만들고 확인합니다. 실물 조합·쓰기로 연습을 확장합니다.</p></article><span class="v-arrow">→</span><article class="v-node"><span class="v-label">03 · 이어가기</span><h3>다시 해보고, 다음으로.</h3><p>수정·재도전과 다음 낱말 선택으로 학습을 이어가도록 유도합니다.</p></article></div><div class="v-takeaway">손으로 익히고, <b>게임처럼 즐기며 스스로 이어가는 언어 학습.</b></div><p class="v-caption">오른쪽은 실제 디지털 화면, 왼쪽은 연계 설계 시안입니다. 화면 캡처는 실물 인식 성능이나 학습 효과를 입증하지 않습니다.</p></div>`;
 const advantage=get('advantage'),priorAdvantage=advantage[5];
 const proof=`<div class="v-sequence"><article class="v-node"><span class="v-label">실물 제품 개발 이력</span>${pastProduct}<h3>블록·소리·화면을 연결한 경험</h3><p>플레이탱고 IR의 제품 자료와 교원 공식 협업 발표가 보여주는 실행 배경입니다.</p></article><article class="v-node"><span class="v-label">현재 학습·기록 제품</span>${photo('report-phonics-sample.webp','실제 탱고북 제품의 한글 학습표 테스트 화면','현재 제품 화면 · 테스트 데이터',225)}<h3>학습 과정과 기록을 운영하는 기반</h3><p>글자·소리 학습 과정과 부모가 연습 내용을 확인하는 제품 화면. 고객 성과가 아닌 구현 근거입니다.</p></article><article class="v-node"><span class="v-label">현재 콘텐츠 제작 자산</span>${photo('series-changjak-mina-01.webp','실제 미나 창작 시리즈 콘텐츠 이미지','미나 시리즈 · 제작 콘텐츠',225)}<h3>50권 · 500장 제작 기록</h3><p>2026년9월 삽화 제작·검수·등록 기록. 새 콘텐츠를 더하는 실행 근거입니다.</p></article></div><div class="v-takeaway">실물 교구 경험에 <b>현재 학습 제품과 콘텐츠 제작 기반</b>을 연결합니다.</div>`;
 advantage[5]=`<div class="viz">${proof}<a class="v-source" href="https://www.kyowon.co.kr/Media/News_detail?iscont=&nttId=442&searchword=" target="_blank" rel="noopener">교원 공식 협업 제품 발표 · 2020.10.29 ↗</a><p class="v-caption">과거 제품·현재 제품 화면·제작 기록을 구분합니다. 고객 성과·경쟁 우위·현재 실물 연동 완성의 증거는 아닙니다.</p><details class="v-evidence"><summary>상세 이력·자산 근거</summary>${priorAdvantage}</details></div>`;
 const usage=`<div class="v-word-chain"><span>글자·소리 연습</span><i>→</i><span>새 어휘로 같은 교구 활용</span><i>→</i><span>동화책 속 낱말을 다시 조합·쓰기</span></div><p class="v-caption">구매 후 활용 설계입니다. 새 교구를 매번 사는 대신 학습 소재를 넓히는 제안이며, 모든 책의 연동 완료를 뜻하지 않습니다.</p>`;
 get('foundation')[5]+=usage;
 const productPhoto=(side,alt)=>`<figure class="v-photo"><div class="ir-product-window ${side}">${img(asset('hardware-premium-concept.png'),alt)}</div><figcaption>제품 방향 · AI 콘셉트 이미지 · 확정 사양 아님</figcaption></figure>`;
 let productIndex=0;
 get('business')[5]=get('business')[5].replace(/<figure[\s\S]*?<\/figure>/g,old=>{
  productIndex++;
  return productIndex===1?productPhoto('left','언어 학습용 자모 블록과 보드의 제품 콘셉트'):productIndex===2?productPhoto('right','글자 따라 쓰기 보드와 펜의 제품 콘셉트'):old;
 });
 get('education-market')[5]=get('education-market')[5].replace('이야기와 손 놀이가 연결되는 제품으로 진입합니다.','게임의 재미와 손 연습을 결합한 언어 학습 제품으로 진입합니다.');
 // 속독용: 장마다 사업 정의·학습 방식·사용 장면·반복사용·유입의 역할을 나눈다.
 get('vision')[4]='블록·쓰기 교구를 판매하고, 디지털 학습과 동화책으로 활용을 넓힙니다.';
 get('vision')[5]=get('vision')[5]
  .replace('손으로 익히고,<br>게임처럼 즐기며,<br><em>스스로 이어갑니다.</em>','블록·쓰기 교구<br><em>＋ 디지털 학습 콘텐츠</em>')
  .replace('아이에게는 다시 하고 싶은 놀이.<br>부모에게는 손으로 배우고 오래 쓸 교구.','글자와 소리부터 어휘·이야기까지.<br>교구 하나의 활용을 다음 배움으로 넓힙니다.');
 media[2]='학습 방식';
 media[3]='손의 연습과 화면의 반응, 함께 씁니다.';
 media[4]='직접 조합·쓰기의 경험에 미션·소리·반응을 결합합니다.';
 background[5]=background[5].replace('손으로 익히고, <b>게임처럼 즐기며 스스로 이어가는 언어 학습.</b>','그림·낱말 미션이 <b>조합·확인·재도전의 다음 행동</b>을 안내합니다.');
 advantage[3]='교구 개발 경험에 콘텐츠 제작 기반을 더합니다.';
 advantage[5]=advantage[5].replace('실물 교구 경험에 <b>현재 학습 제품과 콘텐츠 제작 기반</b>을 연결합니다.','<b>교구를 만들고, 학습 소재를 더하고, 사용 과정을 운영하는 기반.</b> 세 가지를 함께 갖춥니다.');
 get('foundation')[3]='같은 교구에, 다음 배움을 연결합니다.';
 get('foundation')[4]='학습 단원부터 새 어휘·동화책 낱말까지, 반복 사용할 소재를 갖추고 있습니다.';
 get('business')[4]='판매 상품은 블록·쓰기 교구입니다. 연결된 디지털 콘텐츠는 구매 후 활용을 지원합니다.';
 get('business')[5]=get('business')[5].replace('교구의 가치를 한 번의 학습으로 끝내지 않고,<b>새로운 어휘와 이야기로 활용을 넓힙니다.</b>','<b>새 낱말을 배우고 → 같은 교구로 연습하고 → 동화책에서 다시 만나는</b> 구매 후 활용 설계.');
 const growth=get('growth'),priorGrowth=growth[5];
 growth[3]='낱말 하나의 체험을 교구 구매로 연결합니다.';
 growth[4]='대표 유입 예시: ‘나비’를 만드는 짧은 영상에서 시작합니다.';
 growth[5]=`<div class="viz"><div class="v-growth ir-acquisition"><div><span class="v-label">01 / 발견</span><h3>‘나비’ 글자 만들기 영상</h3><p>그림과 소리를 보고 블록으로 ‘나비’를 만드는 짧은 장면. 검색·숏폼에서 학습에 관심 있는 부모를 만납니다.</p></div><div><span class="v-label">02 / 체험</span><h3>같은 낱말 직접 해보기</h3><p>영상에서 본 한글 블록 게임으로 연결합니다. 그림·소리 미션과 조합 활동을 먼저 경험합니다.</p></div><div><span class="v-label">03 / 구매</span><h3>블록·쓰기 제품 확인</h3><p>집에서 손으로 연습할 교구의 구성과 사용 장면을 보여줍니다. 가격·구매 조건은 확정 후 제시합니다.</p></div><div><span class="v-label">04 / 재사용</span><h3>다음 낱말과 동화책</h3><p>새 어휘·동화책 속 낱말을 같은 교구로 조합하고 씁니다. 배움이 바뀌어도 제품을 계속 활용할 이유를 만듭니다.</p></div></div><div class="v-takeaway"><b>보여줄 콘텐츠 → 같은 활동 체험 → 손 연습 교구 → 다음 학습 소재.</b></div><p class="v-caption">기존 ‘나비’ 게임을 활용한 유입 기획 예시입니다. 해당 영상·구매 경로의 공개 완료나 전환율을 주장하지 않습니다. 체험의 이용 조건과 책별 연결 범위는 실제 제공 조건을 따릅니다.</p><details class="v-evidence"><summary>전체 채널 구성·한국 시작·아시아 확장</summary>${priorGrowth}</details></div>`;
 // 판매 상품을 먼저 이해하고, 사용 경험과 오래 활용할 이유를 읽는다.
 const order=['vision','education-market','media','background','business','experience','foundation','advantage','growth','validation','team'];
 slides.sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]));
 background[3]='아이 스스로 도전하고 이어가도록 설계합니다.';
 background[4]='그림·소리로 시작을 돕고, 확인·재도전·다음 선택으로 스스로 이어가도록 설계합니다.';
 background[5]=background[5]
  .replace('그림과 낱말을 만납니다.','무엇을 할지 알게 됩니다.')
  .replace('‘나비’처럼 익힐 낱말과 조합할 글자를 보여줍니다.','‘나비’ 그림과 소리, 만들 글자를 보여줍니다. 아이가 도전할 목표를 이해하도록 돕습니다.')
  .replace('조합하고, 확인합니다.','내가 만들고 확인합니다.')
  .replace('조각을 배치·회전하며 만들고 확인합니다. 실물 조합·쓰기로 연습을 확장합니다.','조각을 배치·회전하고 확인합니다. 바꿔 보고 다시 도전할 수 있는 조작 경험입니다.')
  .replace('다시 해보고, 다음으로.','다음 낱말을 선택합니다.')
  .replace('수정·재도전과 다음 낱말 선택으로 학습을 이어가도록 유도합니다.','확인 뒤 다음 낱말로 넘어갑니다. 매번 어른이 시키기보다 아이가 활동을 이어가도록 유도합니다.')
  .replace('그림·낱말 미션이 <b>조합·확인·재도전의 다음 행동</b>을 안내합니다.','<b>목표를 이해하고 → 직접 도전하고 → 다시 하거나 다음을 고르는</b> 게임형 학습 경험.')
  .replace('화면 캡처는 실물 인식 성능이나 학습 효과를 입증하지 않습니다.','현재 디지털 조작 경험을 보여줍니다. 실물 연동·자기주도 학습 효과는 별도 검증합니다.');
 get('business')[3]='블록·쓰기 교구 판매에, 디지털 학습을 연결합니다.';
 get('business')[4]='판매 제품은 한글·영어 블록과 쓰기 교구. 디지털 미션을 손으로 하는 연습에 연결합니다.';
 get('business')[5]=get('business')[5].replace('게임처럼 배우기 → 스스로 반복하기 → 어휘·동화책으로 이어가기','같은 낱말을 보고 듣기 → 블록으로 조합하기 → 손으로 쓰기').replace('<b>새 낱말을 배우고 → 같은 교구로 연습하고 → 동화책에서 다시 만나는</b> 구매 후 활용 설계.','<b>화면이 연습할 낱말을 제시하고, 교구가 직접 조합·쓰기 경험을 더합니다.</b> 이 연결을 상품의 선택 이유로 제안합니다.');
 const foundation=get('foundation'),priorFoundation=foundation[5];
 const reuse=`<div class="ir-reuse"><div class="ir-reuse-rail"><span class="v-label">ONE KIT · MORE LEARNING</span><strong>한 번 구매한 블록·쓰기 교구</strong><p>학습 소재가 바뀌어도, 같은 교구로 연습합니다.</p></div><div class="v-sequence"><article class="v-node"><span class="v-label">01 / 첫 글자</span><h3>글자 모양과 소리</h3><p>처음 배우는 글자를 블록으로 조합하고 손으로 씁니다.</p><div class="ir-reuse-example">글자 연습</div></article><span class="v-arrow">→</span><article class="v-node"><span class="v-label">02 / 새 어휘</span><h3>연습할 낱말을 더하기</h3><p>새 낱말을 배울 때도 같은 블록·쓰기 교구를 사용합니다.</p><div class="ir-reuse-example">낱말 조합·쓰기</div></article><span class="v-arrow">→</span><article class="v-node"><span class="v-label">03 / 동화책</span><h3>이야기에서 다시 꺼내기</h3><p>동화책 속 낱말을 골라 같은 교구로 다시 조합하고 씁니다.</p><div class="ir-reuse-example">읽은 낱말 복습</div></article></div></div>`;
 foundation[3]='글자를 배운 뒤에도, 교구를 계속 쓸 이유가 있습니다.';
 foundation[4]='새 어휘와 동화책이 다음 연습 소재가 됩니다. 교구의 활용을 첫 글자 학습에서 끝내지 않습니다.';
 foundation[5]=`<div class="viz">${reuse}<div class="v-takeaway"><b>교구를 한 번 쓰고 끝내는 대신, 새로운 콘텐츠로 다음 연습을 제안합니다.</b></div><div class="ir-asset-support"><span><b>71</b> 정의된 한글·영어 학습 단원</span><span><b>362판본</b> 공개 동화 · 2026.10.05 집계</span></div><p class="v-caption">구매 후 활용 설계입니다. 모든 책의 교구 연동 완료나 실제 재사용 성과를 뜻하지 않습니다. 판본은 같은 이야기의 다른 그림체를 포함합니다.</p><details class="v-evidence"><summary>학습 단원·동화책 구성과 집계 근거</summary>${priorFoundation}</details></div>`;
 return {updateTeam(team){return team.replace(/(<section[^>]*id="organic"[^>]*>[\s\S]*?<\/h2>)([\s\S]*?)(<\/section>)/,`$1${growth[5]}<details class="v-evidence"><summary>기존 채널별 상세 실행안</summary>$2</details>$3`).replace(/(<section[^>]*id="heritage"[^>]*>[\s\S]*?<\/h2>)/,`$1<div class="viz">${proof}</div>`).replace(/(<section[^>]*id="analog"[^>]*>[\s\S]*?<\/h2>)/,`$1<div class="viz">${reuse}<p>화면에서 보고 들은 같은 낱말을 블록으로 조합하고 손으로 쓰는 연결을 상품의 선택 이유로 제안합니다. 단계별 실제 사용·재사용은 검증합니다.</p></div>`).replace(/(<section[^>]*id="architecture"[^>]*>[\s\S]*?<\/h2>)/,`$1<div class="viz">${actualGame}<p>그림·소리로 목표를 이해하고, 직접 조각을 배치·회전하며 확인하고, 재도전하거나 다음 낱말을 선택합니다. 이 조작 경험으로 스스로 이어가도록 유도하며, 실물 블록·쓰기로 연습을 확장하는 것이 제품 연계 방향입니다. 자기주도 학습 효과는 별도 검증합니다.</p>${usage}</div>`);}};
};
