// 최신 사용자 결정: 언어 학습이 중심, 동화책은 어휘·읽기·문해력 확장 자산.
module.exports=({slides,img})=>{
 const get=id=>slides.find(s=>s[0]===id);
 const body=(id,s)=>get(id)[5]=`<div class="viz">${s}</div>`;
 const step=(icon,title,copy)=>`<article class="v-node"><span class="v-label">${icon}</span><h3>${title}</h3><p>${copy}</p></article>`;
 const journey=`<div class="v-sequence">${step('01 · LANGUAGE','글자와 소리 배우기','화면의 그림·발음·안내를 보고, 실물 블록을 조합하고 손으로 씁니다.')}<span class="v-arrow">→</span>${step('02 · WORDS','연결된 어휘 익히기','배운 글자로 낱말을 만들고, 그림·소리·뜻을 함께 익힙니다.')}<span class="v-arrow">→</span>${step('03 · READING','동화책으로 읽기 확장','배운 낱말을 이야기 속 문장에서 만나고, 내용을 이해하며 문해력을 키워갑니다.')}</div>`;
 const priorVision=get('vision')[5], priorDecision=get('decision')[5];
 const scene=`<figure class="v-linked-scene">${img('../investor-20261010/screen-block-use-concept.png','화면 안내와 실물 블록 조합으로 언어를 배우는 아이의 사용 장면')}<figcaption>화면으로 보고 듣고, 손으로 조합하며 배우기 · AI 콘셉트 이미지</figcaption></figure>`;
 const titles={
 vision:['언어 학습을, 화면과 손 놀이로 연결합니다.','글자·소리 학습에서 어휘와 동화책 읽기까지 이어지는 유아교육 제품.'],
 media:['언어 학습의 두 방식, 아날로그와 디지털.','직접 조합하고 쓰는 경험과, 그림·발음·반응의 장점을 연결합니다.'],
 background:['화면으로 배우고, 블록과 쓰기로 연습합니다.','디지털의 안내·소리·반응과 아날로그의 조합·쓰기 경험을 결합합니다.'],
 experience:['언어 학습 다음에는, 어휘와 동화책 읽기가 기다립니다.','배운 글자와 소리를 낱말·문장·이야기 이해로 넓히는 학습 흐름.'],
 foundation:['학습을 이어갈 과정과 콘텐츠를 갖췄습니다.','한글·영어 학습 단원과 다양한 동화책 · 보유 자산의 구성.'],
 parent:['배운 글자를 이야기에서 다시 만나고, 제품을 계속 씁니다.','연결된 어휘와 다양한 동화책이 블록·쓰기 제품의 활용을 넓힙니다.'],
 growth:['언어 학습 체험으로 만나고, 제품 구매로 연결합니다.','글자·소리 체험 → 블록·쓰기 제품 → 어휘와 동화책으로 지속 사용.'],
 business:['언어 학습용 블록·쓰기 제품을 판매합니다.','디지털 학습 과정과 어휘·동화책 콘텐츠가 제품의 사용 가치를 더합니다.'],
 decision:['언어 학습으로 시작해, 이야기 읽기로 성장합니다.','블록·쓰기 제품 판매를 중심으로 어휘와 동화책 콘텐츠를 연결합니다.']};
 for(const [id,[title,sub]]of Object.entries(titles)){get(id)[3]=title;get(id)[4]=sub;}
 body('vision',`<div class="v-hero-layout"><div><span class="v-label">LANGUAGE LEARNING</span><p class="v-hero-lead">보고 듣고,<br>조합하고 쓰고,<br><em>이야기로 읽습니다.</em></p><p>아날로그·디지털 언어 학습을 중심으로<br>어휘와 동화책까지 연결하는 사업.</p><div class="v-coverage"><span>한글·영어</span><span>한국에서 아시아로</span></div></div>${scene}</div><details class="v-evidence"><summary>플랫폼 구성과 투자 검토 근거</summary>${priorVision}</details>`);
 body('background',scene+`<div class="v-takeaway">화면이 글자와 소리를 안내하고,<b>아이는 실물 블록을 조합하고 손으로 쓰며 연습합니다.</b></div><p class="v-caption">AI 사용 장면 콘셉트입니다. 제품 외형·화면·연동 사양은 확정 전이며 실물 사진이나 성능 검증이 아닙니다.</p>`);
 const oldExperience=get('experience')[5];
 body('experience',`<div class="v-sequence">${step('01 · 글자와 소리','조합하고 읽기','화면의 발음을 듣고, 블록을 조합하고 손으로 씁니다.').replace('</article>','<div style="font-size:42px;font-weight:800;color:#2daeb0;margin:38px 0 24px;white-space:nowrap">ㅂ + ㅏ = 바</div><p>글자 모양과 소리의 연결</p></article>')}<span class="v-arrow">→</span><article class="v-node"><span class="v-label">02 · 어휘</span><h3>낱말과 뜻 연결하기</h3>${img('word-kr-h1-u07-0.webp','실제 바다 어휘 그림','learning-word').replace('<img ', '<img style="width:100%;height:170px;object-fit:contain;margin:15px 0" ')}<div style="font-size:30px;font-weight:800;text-align:center">바다</div><p>배운 글자로 낱말을 읽고, 그림·소리로 뜻을 익힙니다.</p></article><span class="v-arrow">→</span><article class="v-node"><span class="v-label">03 · 문장과 이야기 이해</span><h3>읽고 생각하기</h3><div style="margin:30px 0;padding:22px 16px;border-radius:12px;background:#eef7f4"><p style="font-size:24px;color:#173c37;font-weight:700">아이가 바다에서<br>조개를 찾았어요.</p><p style="margin-top:22px;color:#299795;font-weight:700">어디에서 찾았을까요?<br>무엇을 찾았을까요?</p></div><p>낱말을 문장 속에서 만나고, 질문에 답하며 내용을 이해합니다.</p></article></div><div class="v-takeaway">글자와 소리의 연결을 익힌 뒤,<b>낱말의 뜻 → 문장 읽기 → 이야기 이해로 넓힙니다.</b></div><p class="v-caption">바다 그림은 실제 어휘 자산입니다. 문장·질문은 흐름 설명용 예시이며 특정 동화책의 본문이나 연결 완료 사례가 아닙니다. 학습 효과는 별도 검증합니다.</p><details class="v-evidence"><summary>현재 디지털 콘텐츠와 제공 조건</summary>${oldExperience}</details>`);

 get('foundation')[5]=get('foundation')[5].replace('STORY LIBRARY','READING EXPANSION').replace('이야기·파닉스','글자·소리 학습').replace('그림·소리·문맥','디지털 안내 + 블록·쓰기').replace('낱말과 활동','연결된 어휘').replace('부모의 기록','동화책 읽기').replace('수집된 활동 근거','문장과 이야기 이해');
 get('growth')[5]=get('growth')[5].replace('같은 이야기 체험','글자·소리 학습 체험').replace('한글 ㅂ · 영어 cat · 거인의 정원','한글 자모 · 영어 글자와 소리').replace('새 콘텐츠와 다음 놀이','연결된 어휘 · 다음 동화책');
 get('business')[5]=get('business')[5].replace('직접 조합하고 만드는 언어 놀이','배운 글자와 소리로 낱말 조합').replace('읽은 글자와 낱말을 손으로 쓰기','배운 글자와 낱말을 손으로 쓰기').replace('구매 전 체험 → 구매 후 새로운 놀이와 지속 사용','언어 학습 과정 → 어휘 연습 → 동화책 읽기');
 get('validation')[5]=get('validation')[5].replace('이야기→블록·쓰기','글자·소리→어휘→읽기');
 body('decision',`<div class="v-closing"><span class="v-label">TANGOBOOK</span><h3>언어 학습을 중심으로.<br>손으로 연습하고, 이야기로 읽습니다.</h3><div><span>아날로그 + 디지털 학습</span><i>→</i><span>어휘</span><i>→</i><span>읽기·문해력</span></div><p>블록·쓰기 제품을 판매하고, 풍부한 동화책 콘텐츠로 구매 후 배움을 이어갑니다.</p></div><details class="v-evidence"><summary>투자 검토 상세</summary>${priorDecision}</details>`);
 const terms=s=>s.replaceAll('파닉스와','언어 학습과').replaceAll('파닉스를','언어 학습을').replaceAll('파닉스는','언어 학습은').replaceAll('파닉스가','언어 학습이').replaceAll('파닉스로','언어 학습으로').replaceAll('파닉스','언어 학습').replaceAll('PHONICS','LANGUAGE LEARNING').replaceAll('Phonics','Language learning');
 slides.forEach(s=>{for(const i of [2,3,4,5])s[i]=terms(s[i]);});
 // 투자자 본문은 한 장에 한 질문. 운영 설명과 계산식은 부록으로 이동.
 const shortTitles={vision:'화면으로 배우고, 손으로 익히는 언어 학습.', 'education-market':'아이의 첫 배움에 이미 큰 지출이 있습니다.',media:'화면은 반응하고, 손은 직접 조합합니다.',background:'탱고북은 두 경험을 하나로 연결합니다.',experience:'글자에서 낱말로, 낱말에서 이야기 이해로.',foundation:'한글·영어 학습 과정과 풍부한 동화책.',business:'매출의 중심은 블록·쓰기 제품 판매입니다.',advantage:'실물 교구를 만들고, 콘텐츠를 운영해 온 경험.',growth:'학습 체험으로 고객을 만나고, 한국에서 첫 판매.',validation:'다음 증거는 실제 구매와 제품당 이익입니다.',team:'투자금은 제품 완성과 첫 판매에 씁니다.'};
 for(const [id,title]of Object.entries(shortTitles))get(id)[3]=title;
 get('vision')[4]='언어 학습용 블록·쓰기 제품 판매 + 연결된 디지털 학습·동화책 콘텐츠.';
 get('foundation')[5]=get('foundation')[5].replace(/<div class="v-sequence">[\s\S]*?<\/div><details/,'<details');
 get('foundation')[5]=get('foundation')[5].replace('<div class="v-content-labels">','<div class="v-mini-stats" style="margin:12px 0"><span><b>1,215판본</b>등록 동화</span><span><b>362판본</b>공개 동화</span></div><p class="v-caption">2026.10.05 집계 · 같은 이야기의 다른 그림체 포함 · 최신 공개 상태 재확인 필요</p><div class="v-content-labels">');
 get('growth')[5]+=`<div class="v-takeaway">한국의 한글·영어 학습 가정에서 <b>체험 → 구매 → 재사용을 먼저 확인하고, 아시아로 확장합니다.</b></div>`;
 get('growth')[4]='검색·영상 → 글자·소리 체험 → 블록·쓰기 제품 구매 → 어휘·동화책으로 재사용.';
 get('validation')[4]='현재 문서에는 판매 실적이 제시되지 않았습니다. 가격·원가·구매·재사용의 증거를 확보합니다.';
 get('validation')[5]+=`<div class="v-takeaway">확정할 투자 판단 지표: <b>실판매가 · 제조/배송/AS 원가 · 실제 구매율 · 구매 후 재사용</b></div>`;
 get('team')[4]='제품 사양·양산 견적·인증·배송·AS를 준비하고, 첫 고객의 구매와 재사용을 확인합니다.';
 // 기능(그림/발음/반응)을 아이의 가치(재미/도전/스스로 이어가기)로 설명한다.
 const motivation=`<div class="v-word-chain"><span>미션을 보고 듣기</span><i>→</i><span>손으로 조작 · 반응 확인</span><i>→</i><span>다시 도전 · 다음 활동 선택</span></div><div class="v-takeaway">손으로 익히고, <b>게임처럼 즐기며 스스로 이어가는 언어 학습을 유도합니다.</b></div>`;
 get('vision')[3]='손으로 익히고, 게임처럼 즐기는 언어 학습.';
 get('vision')[5]=get('vision')[5].replace('보고 듣고,<br>조합하고 쓰고,<br><em>이야기로 읽습니다.</em>','손으로 익히고,<br>게임처럼 즐기며,<br><em>스스로 이어갑니다.</em>').replace('아날로그·디지털 언어 학습을 중심으로<br>어휘와 동화책까지 연결하는 사업.','블록·쓰기 경험에 게임의 재미를 더해<br>스스로 배움을 이어가도록 설계합니다.');
 get('media')[3]='손으로 익히는 경험에, 게임의 재미를 더합니다.';
 get('media')[4]='아날로그는 직접 조합·쓰기, 디지털은 흥미·도전·반복과 자기주도 학습 유도.';
 get('media')[5]=get('media')[5].replace('이야기·소리·반응으로 이어가기','게임처럼 즐기며 스스로 이어가기').replace('즉각 반응 · 새 콘텐츠 공급 · 활동 근거 기록','게임 요소로 흥미·도전·반복 유도 · 스스로 다음 활동 선택').replace('매체별 강점을 연결해,','그림·발음·즉각 반응으로 게임의 재미를 더해,').replace('아이의 놀이와 부모의 학습 기대를 함께 충족합니다.','아이가 스스로 학습을 시작하고 이어가도록 유도합니다.');
 get('background')[4]='디지털의 미션·반응으로 도전을 유도하고, 실물 블록·쓰기로 직접 연습합니다.';
 body('background',scene+motivation+`<p class="v-caption">자기주도 학습을 유도하는 설계 방향입니다. AI 사용 장면 콘셉트이며 제품별 연동·반응 범위와 실제 학습 효과는 별도 확인합니다.</p>`);
 get('experience')[5]=get('experience')[5].replace('화면의 발음을 듣고, 블록을 조합하고 손으로 씁니다.','그림·소리 미션을 보고, 블록 조합·쓰기에 도전합니다.').replace('글자 모양과 소리의 연결','반응을 확인하고 다시 도전하기');
 get('business')[5]=get('business')[5].replace('언어 학습 과정 → 어휘 연습 → 동화책 읽기','게임처럼 배우기 → 스스로 반복하기 → 어휘·동화책으로 이어가기');
 get('validation')[5]=get('validation')[5].replace('가족 사용 관찰','스스로 시작·재도전·다음 선택 관찰');
 const purchaseReasons=`<div class="v-sequence">${step('부모가 원하는 것','시켜야 하는 공부에서, 다시 하고 싶은 놀이로','미션·반응·재도전으로 아이가 스스로 학습을 이어가도록 설계합니다.')}${step('제품을 고를 이유','화면의 재미를, 손으로 하는 연습까지','디지털 안내와 게임의 재미를 블록 조합·직접 쓰기 경험에 연결합니다.')}${step('오래 쓸 이유','글자를 배운 뒤에도, 다음 배움이 있습니다.','연결된 어휘와 동화책이 같은 교구로 연습할 새 소재를 제공합니다.')}</div>`;
 get('vision')[4]='부모에게는 손으로 익히는 연습, 아이에게는 다시 도전하고 싶은 재미. 언어 학습용 블록·쓰기 제품을 판매합니다.';
 get('vision')[5]=get('vision')[5].replace('블록·쓰기 경험에 게임의 재미를 더해<br>스스로 배움을 이어가도록 설계합니다.','아이에게는 다시 하고 싶은 놀이.<br>부모에게는 손으로 배우고 오래 쓸 교구.');
 get('media')[3]='부모는 배움을 원하고, 아이는 재미를 원합니다.';
 get('media')[4]='손으로 연습하고, 게임처럼 도전하며, 배운 뒤에도 계속 활용하는 교구.';
 const oldMedia=get('media')[5];
 body('media',purchaseReasons+`<div class="v-service-strip"><b>아날로그</b><span>직접 조합·쓰기</span><b>＋ 디지털</b><span>흥미·반응·재도전·다음 선택</span></div><details class="v-evidence"><summary>매체별 예시와 장단점</summary>${oldMedia}</details><p class="v-caption">구매 이유에 대한 가치 제안입니다. 구매 반응과 자기주도 학습 효과는 실제 가족 사용으로 확인합니다.</p>`);
 const priorAdvantage=get('advantage')[5];
 get('advantage')[3]='교구와 콘텐츠, 두 축을 이미 만들어 온 팀입니다.';
 get('advantage')[4]='실물 제품 경험과 학습 과정·동화책·제작 기반을 함께 갖췄습니다.';
 body('advantage',`<div class="v-sequence">${step('01 · 제품 경험','실물 블록과 디지털 반응을 연결한 이력','플레이탱고·교원 협업 제품 경험. 교원 공식 발표에서 자모 블록·음성·앱 애니메이션 구조를 확인할 수 있습니다.')}${step('02 · 학습 자산','글자에서 이야기까지 이어갈 콘텐츠','한글·영어 학습 과정, 어휘 그림과 다양한 동화책. 교구를 반복 사용할 학습 소재를 갖췄습니다.')}${step('03 · 제작 기반','새로운 소재를 계속 더하는 운영 구조','저작·편집·검수 도구와 제작 기록을 바탕으로 콘텐츠를 추가하고 품질 문제를 수정합니다.')}</div><div class="v-takeaway">제품 개발 경험에 <b>학습 과정·동화책·제작 기반을 더해, 교구와 콘텐츠를 함께 운영합니다.</b></div><a class="v-source" href="https://www.kyowon.co.kr/Media/News_detail?iscont=&nttId=442&searchword=" target="_blank" rel="noopener">교원 공식 협업 제품 발표 · 2020.10.29 ↗</a><p class="v-caption">과거 제품 경험과 현재 자산의 근거입니다. 경쟁사 대비 우위·탱고북 판매 실적·현재 하드웨어 연동 완성을 입증하는 자료는 아닙니다.</p><details class="v-evidence"><summary>이력·자산·차별화 검토 근거</summary>${priorAdvantage}</details>`);
 get('business')[4]='교구를 판매하고, 연결된 학습·어휘·동화책으로 구매 후에도 계속 쓸 이유를 제공합니다.';
 get('business')[5]+=`<div class="v-takeaway">교구의 가치를 한 번의 학습으로 끝내지 않고,<b>새로운 어휘와 이야기로 활용을 넓힙니다.</b></div>`;
 const order=['vision','education-market','media','background','advantage','experience','foundation','business','growth','validation','team'];
 const moved=slides.filter(s=>!order.includes(s[0]));
 const appendix=`<h3>운영·확장·재무 검토 자료</h3>${moved.map(s=>`<details class="v-evidence"><summary>${s[3]}</summary>${s[5]}</details>`).join('')}`;
 const reordered=order.map(get);slides.splice(0,slides.length,...reordered);
 return {appendix,updateTeam(team){
  team=terms(team);
  team=team.replace(/<h1>[\s\S]*?<\/h1>/,'<h1>손으로 익히고, 게임처럼 즐기며,<br>스스로 이어가는 언어 학습.</h1>');
  const headings={platform:'언어 학습 → 연결된 어휘 → 동화책 읽기',books:'언어 학습 다음을 준비하는 풍부한 동화책 콘텐츠',architecture:'배운 글자와 소리를, 어휘와 이야기 이해로',journey:'보고 듣고, 조합하고 쓰고, 이야기로 읽기',decisions:'첫 체험은 언어 학습으로 시작합니다.'};
  for(const [id,title]of Object.entries(headings)){const pattern=new RegExp('(<section[^>]*id="'+id+'"[^>]*>[\\s\\S]*?<h2[^>]*>)[\\s\\S]*?(<\\/h2>)');team=team.replace(pattern,(_,a,b)=>a+title+b);}
  team=team.replace(/(<section[^>]*id="platform"[^>]*>[\s\S]*?<\/h2>)/,`$1<div class="viz">${journey}<div class="v-takeaway">중심은 <b>아날로그·디지털 언어 학습</b>입니다. 글자와 소리를 익힌 뒤 연결된 어휘와 다양한 동화책으로 읽기·문해력을 확장합니다.</div><p class="v-caption">학습 설계 방향. 모든 연결의 구현 완료나 학습 효과 검증을 뜻하지 않습니다.</p></div>`);
  team=team.replace(/(<section[^>]*id="decisions"[^>]*>)([\s\S]*?)(<\/section>)/,(_,open,prior,close)=>open+`<h2 class="section-h2">첫 체험은 언어 학습으로 시작합니다.</h2><div class="viz">${journey}<div class="v-takeaway">첫 제작 묶음은 <b>화면 안내와 블록·쓰기 시연 → 연결된 어휘 체험 → 다음 동화책 소개</b>입니다.</div><p>아이가 글자와 소리를 보고 들은 뒤 직접 조합하고 쓰는지, 부모가 제품의 구매 이유를 이해하는지 확인합니다. 이후 어휘와 책을 다시 찾는지 관찰합니다. 가격·공개 범위·연동 사양은 검증 후 확정합니다.</p><details class="v-evidence"><summary>기존 이야기 체험안 · 후속 읽기 콘텐츠 참고</summary>${prior}</details></div>`+close);
  team=team.replaceAll('탱고북은 한 이야기 안에 읽기·낱말·놀이·기록을 연결합니다.','탱고북은 언어 학습에서 어휘·동화책 읽기·기록까지 연결합니다.').replaceAll('이야기와 놀이로 스스로 배우는 플랫폼','언어 학습과 동화책 읽기를 연결하는 플랫폼');
  team=team.replace('<h3>탱고북은 두 방식의 장점을 결합합니다.</h3>','<h3>탱고북은 두 방식의 장점을 결합합니다.</h3><div class="viz">'+motivation+'<p class="v-caption">미션·반응·재도전·다음 활동 선택으로 자기주도 학습을 유도하는 설계입니다. 실제 연동 범위와 효과는 별도 검증합니다.</p></div>').replaceAll('즉각 반응 · 새 콘텐츠 공급 · 활동 근거 기록','게임 요소로 흥미·도전·반복 유도 · 스스로 다음 활동 선택').replace('아이가 글자와 소리를 보고 들은 뒤 직접 조합하고 쓰는지,','아이가 미션을 보고 직접 조합·쓰기하고, 반응 뒤 다시 도전하거나 스스로 다음 활동을 고르는지,');
  team=team.replace(/(<section[^>]*id="principle"[^>]*>[\s\S]*?<\/h2>)/,`$1<div class="viz">${purchaseReasons}</div>`).replace(/(<section[^>]*id="heritage"[^>]*>[\s\S]*?<\/h2>)/,'$1<div class="v-takeaway">우리의 실행 근거는 <b>실물 교구 개발 경험 + 언어 학습·동화책 자산 + 콘텐츠 제작·검수 기반</b>입니다. 이 세 축을 제품의 구매 이유로 연결합니다.</div>');
  return team;
 }};
};
