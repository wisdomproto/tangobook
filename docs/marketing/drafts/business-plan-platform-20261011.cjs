// 전체 구성 → 개별 제품 경험. 기존 제품·콘텐츠 자산을 재사용한다.
module.exports = ({ img }) => {
 const asset = f => '../investor-20261010/' + f;
 const node = (title, desc, file, alt, extra = '') => `<article class="td-ecosystem-node">${img(file, alt)}<h4>${title}</h4><p>${desc}</p>${extra}</article>`;
 const overview = `<div class="td-overview-value"><b>부모의 설명·준비 부담 감소</b><span>학습 순서와 피드백을 앱이 안내하는 구조</span></div><div class="td-ecosystem">
   <div class="td-ecosystem-hub td-app-hub"><h3>탱고북 학습 앱</h3><figure>${img(asset('app-overview-v3.webp'),'한글·영어 학습, 동화책 라이브러리, 학습 게임과 교구 연결을 보여주는 탱고북 앱 디자인 시안')}<figcaption>학습 안내 · 콘텐츠 이용 · 학습 현황 관리 <small> / 앱 디자인 시안</small></figcaption></figure></div>
   <div class="td-ecosystem-branches">
     <div class="td-ecosystem-group"><h3>아날로그 콘텐츠</h3><div class="td-ecosystem-items analog">
       ${node('탱고 블록', '한글·영어 글자 조합', asset('hardware-kit-studio-v3.png'), '탱고북 실물 블록과 인식판')}
       ${node('탱고노트', '종이 필기 · 학습지 인식', asset('tangonote-product-v5.webp'), '종이를 올려 쓰고 태블릿으로 데이터를 보내는 탱고노트')}
     </div></div>
     <div class="td-ecosystem-group"><h3>디지털 콘텐츠</h3><div class="td-ecosystem-items digital">
       ${node('파닉스', '한글·영어 전 과정', asset('phonics-covers/ko-1-chapter-v3.webp'), '한글 자음·모음 학습 예시')}
       ${node('동화책', '1,000+권 · 매달 신간', 'cover-1789350946382.webp', '보유 동화책 거인의 정원 표지')}
       ${node('독후활동', '10+가지 학습 게임', asset('giant-reading-activity-actual.png'), '거인의 정원 디지털 독후활동 화면')}
     </div></div>
   </div>
 </div><div class="td-overview-loop" aria-label="앱 안내에서 활동과 통합 학습 기록으로 이어지는 흐름"><div><span>01 · 앱 안내</span><b>보고 듣고 시작</b></div><i aria-hidden="true">→</i><div><span>02 · 학습 활동</span><b>블록 · 쓰기 · 읽기 · 게임</b></div><i aria-hidden="true">→</i><div><span>03 · 앱 기록</span><b>학습 현황 · 다음 학습</b></div></div>`;
 const speaker = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 8q5 4 0 8M19 4q9 8 0 16"/></svg>';
 const wordPicture = () => img(asset('phonics-gagu-word.webp'), '가구: 의자와 서랍장 그림');
 const learnScreen = `<div class="td-lesson-screen"><div class="td-lesson-screenbar"><b>TangoBook</b><span>한글 · ㄱ</span></div><div class="td-learn-word">${wordPicture()}<div><span class="td-letter-focus">ㄱ</span><strong>가구</strong><span class="td-sound-label">${speaker} 발음 듣기</span></div></div><div class="td-screen-progress"><i></i><i></i><i></i><i></i></div></div>`;
 const gameScreen = `<div class="td-lesson-screen td-review-screen"><div class="td-lesson-screenbar"><b>TangoBook</b><span>낱말 복습</span></div><div class="td-game-prompt">${speaker}<b>듣고 낱말 찾기</b></div>${wordPicture()}<div class="td-word-choices"><span class="correct">가구 <i>✓</i></span><span>구가</span></div><div class="td-game-result">정답! 동화 읽기로 →</div></div>`;
 const step = (n, mode, title, visual, caption) => `<figure class="td-story-step"><figcaption><span class="td-story-step-meta"><b>0${n}</b>${mode}</span><h3>${title}</h3></figcaption><div class="td-story-step-scene">${visual}</div><p>${caption}</p></figure>`;
 const guidedPhoto = (file, alt, message) => `<div class="td-action-photo">${img(asset(file),alt)}<div class="td-app-feedback"><span>앱 안내</span><b>${message}</b></div></div>`;
 const experience = `<span id="background" class="td-anchor-alias" aria-hidden="true"></span>
 <div class="td-lesson-storyboard">
 ${step(1,'앱','보고 듣기',learnScreen,'‘ㄱ’의 모양·소리를 익히고 ‘가구’ 읽기')}
 ${step(2,'실물 블록 + 앱','블록으로 만들기',guidedPhoto('hardware-feedback-use-v3.png','앱 안내에 따라 가구를 실물 블록으로 만드는 장면','✓ 가구 완성!<br>이제 써 볼까요?'),'‘가구’를 조합하고 앱의 안내에 따라 연습')}
 ${step(3,'탱고노트 + 앱','종이에 쓰기',guidedPhoto('tangonote-product-v5.webp','노트판 위 종이에 가구를 쓰고 앱에서 확인하는 제품 구성 예시','쓴 내용 확인<br>다음은 복습 게임 →'),'같은 낱말을 종이에 쓰고 앱에서 확인')}
 ${step(4,'앱 게임','게임으로 복습',gameScreen,'소리를 듣고 배운 낱말 고르기')}
 </div>
 <div class="td-reading-report"><article class="td-reading-bridge"><div class="td-story-step-meta"><b>05</b>동화책 + 앱</div><h3>동화 속 가구 만나기</h3><div class="td-story-reader">${img(asset('goldilocks-chair-scene.webp'),'금발 머리 소녀와 곰 세 마리 5쪽: 소녀와 거실의 의자들')}<div><span class="v-label">금발 머리 소녀와 곰 세 마리</span><p>거실에는 의자와 탁자 등 여러 <b>가구</b>가 있었어요.</p><small>▶ 이야기 듣기</small></div></div><p class="td-reading-caption">배운 낱말 ‘가구’를 문장 속에서 다시 읽기</p></article>
 <aside class="td-compact-report" aria-label="학습 리포트 구성 예시"><div class="td-report-bar"><b>학습 리포트</b><span>예시</span></div><p class="td-report-summary">앱·교구 활동을 한눈에</p><div class="td-report-focus"><span>학습한 글자·낱말</span><strong>ㄱ <i>·</i> 가구</strong></div><div class="td-report-rows">${[['글자 익히기','완료'],['블록 조합','완료'],['쓰기 연습','완료'],['복습 게임','완료'],['동화 읽기','완료']].map(([label,state])=>`<div class="${state==='완료'?'done':'retry'}"><span>${label}</span><i></i><b>${state==='완료'?'✓': '↻'} ${state}</b></div>`).join('')}</div><div class="td-report-next"><span>다음 학습</span><b>다음 글자 학습으로 →</b></div></aside></div>
 <p class="td-note">동화 문장·화면은 학습 흐름 예시입니다. 교구·동화의 통합 학습 기록은 연동 개발·검증 중입니다.</p>
 <details class="v-evidence"><summary>교구 연동·학습 기록 개발 범위</summary><p>탱고노트는 노트판 위 종이에 펜으로 쓰고, 필기 데이터와 학습지 정보를 블루투스로 앱에 전달하는 제품 구성입니다. 통합 학습 기록·반응은 개발 방향이며 실기기 연동과 아동 사용성은 검증 중입니다.</p></details>`;
 const split=experience.indexOf('<div class="td-reading-report">');
 const learning=experience.slice(0,split).replace('정답! 다음 문제로 →','정답! 동화 읽기로 →')+'<p class="td-note">학습 흐름 예시 · 탱고노트는 2027년 3분기 출시 계획이며, 교구·앱 안내·기록 연동은 개발·검증 중입니다.</p>';
 const reading=experience.slice(split);
 return { overview, experience:learning, reading };
};
