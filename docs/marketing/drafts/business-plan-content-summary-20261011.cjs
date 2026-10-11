// Part 3의 자산 규모 요약. 상세 학습 경험은 Part 2에서 설명한다.
module.exports=({img,inventory})=>{
 const asset=f=>'../investor-20261010/'+f;
 const html=`<div class="td-asset-summary">
 <article><span class="v-label">단계별 교육과정</span><h3>한글·영어 파닉스</h3><div class="td-asset-number td-course-complete">전 과정</div><div class="td-asset-letters">${img(asset('phonics-covers/ko-1-chapter-v3.webp'),'한글 교육과정 문자 예시')}${img(asset('phonics-covers/en-1-chapter-v3.webp'),'영어 교육과정 문자 예시')}</div><div class="td-course-paths"><div><b>한글</b><span>기본 글자 → 받침<br>→ 쌍자음 → 복잡한 모음</span></div><div><b>영어</b><span>알파벳 → 단모음·장모음<br>→ 자음·모음 조합</span></div></div><p>글자·소리의 기초부터 낱말 읽기까지</p></article>
 <article><span class="v-label">5개 분야의 이야기</span><h3>동화책</h3><div class="td-asset-number">1,000+<small>권</small></div><div class="td-asset-books">${img('cover-1789350946382.webp','세계 명작 거인의 정원 표지')}${img('series-changjak-coco-01.webp','창작동화 코코네 빵집 골목 본문')}</div><div class="td-asset-categories">${Object.entries(inventory.counts).map(([k,v])=>`<span>${k}<b>${v}권</b></span>`).join('')}</div><p class="td-asset-cadence">매달 <strong>100+권</strong> 신간 발행</p></article>
 <article><span class="v-label">다양한 유형의 독후활동 게임</span><h3>독후활동 게임</h3><div class="td-asset-number">10+<small>가지</small></div><div class="td-asset-activity">${img(asset('giant-reading-activity-actual.png'),'거인의 정원 숨은그림 찾기 실제 화면')}</div><div class="td-asset-types"><span>듣고 그림 찾기</span><span>낱말·장면 연결</span><span>숨은그림 찾기</span><span>쪽 순서 맞추기</span></div><p>대표 게임 예시 · 책의 내용으로 이해·어휘·순서 복습</p></article>
 </div><p class="td-note">동화책 분야별 수량은 2026.10.05 집계 · 번역 언어 수를 곱하지 않은 그림체별 판본 수입니다. 독후활동 제공 범위는 책·언어별로 다릅니다.</p>`;
 const css=`
 .td-asset-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
 .td-asset-summary>article{min-width:0;padding:24px;border-radius:12px;background:white;border:1px solid var(--doc-color-line)}
 .td-asset-summary h3{font-size:26px;margin:12px 0 4px}
 .td-asset-number{font-size:60px;font-weight:700;line-height:1.2;margin:12px 0 22px;color:var(--doc-color-teal)}
 .td-course-complete{font-size:44px;min-height:72px;display:flex;align-items:center}
 .td-course-paths{display:grid;gap:12px;margin-top:20px;font-size:14px;line-height:1.6}.td-course-paths>div{display:grid;grid-template-columns:38px 1fr;gap:8px}.td-course-paths b{color:var(--doc-color-teal)}
 .td-asset-number small{font-size:17px;margin-left:8px;font-weight:400}
 .td-asset-letters,.td-asset-books{height:210px;display:flex;gap:12px;align-items:center}
 .td-asset-summary .td-asset-letters img,.td-asset-summary .td-asset-books img{width:calc(50% - 6px);height:190px!important;object-fit:cover;border-radius:8px}
 .td-asset-summary .td-asset-letters img{object-fit:contain}
 .td-asset-activity{height:210px;background:var(--doc-color-wash);border-radius:8px;padding:8px}
 .td-asset-summary .td-asset-activity img{width:100%;height:100%!important;object-fit:contain}
 .td-asset-breakdown,.td-asset-types,.td-asset-categories{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin-top:20px;font-size:15px}
 .td-asset-breakdown{font-size:21px}.td-asset-breakdown span,.td-asset-categories span{display:flex;justify-content:space-between;gap:8px}
 .td-asset-categories span:last-child{grid-column:1/-1}.td-asset-types span{padding:5px 0;border-bottom:1px solid var(--doc-color-line)}
 .td-asset-summary p{font-size:13px;color:var(--doc-color-muted);margin:18px 0 0}
 .td-asset-summary .td-asset-cadence{font-size:20px;color:var(--doc-color-teal);font-weight:700}
 @media(max-width:699px){.td-asset-summary{grid-template-columns:1fr}}
`;
 return {html,css};
};
