const {plan}=require('./business-plan-sales-20261011.cjs');
const css=require('./business-plan-simulation-style-20261011.cjs')+`
#simulation-panel select{font:inherit;padding:10px;border:1px solid var(--doc-color-line);border-radius:6px;background:white;color:var(--doc-color-ink)}
#simulation-panel .sim-product-fields{padding:20px;background:var(--doc-color-wash);margin:22px 0}
#simulation-panel .sim-product-fields h3{margin:0}.sim-product-fields .sim-fields{margin-bottom:0!important}
#simulation-panel input:disabled{background:#eee;color:#999}
`;
const input=(id,label,value,max=10000000,step=1,optional=false)=>`<label>${label}<input id="sim-${id}" type="number" min="0" max="${max}" step="${step}" ${optional?'placeholder="미반영"':'required'} value="${value}"></label>`;
const html=`<div id="simulation-panel" role="tabpanel" aria-labelledby="simulation-tab" hidden>
<span class="v-label">SALES SIMULATION · 2027–2028</span><h1>유통사 공급·매출 시뮬레이션</h1>
<p class="sim-intro">블록·탱고노트의 유통사 공급량과 공급 조건을 계산합니다. 소개서 마일스톤의 매출 전망에는 블록 패키지만 반영하며, 탱고노트 판매는 제외합니다.</p>
<div class="sim-toolbar"><label>계산 연도<select id="sim-year"><option value="2027">2027년</option><option value="2028">2028년</option></select></label><button id="sim-reset" type="button">전체 초기값 복원</button></div>
<p class="sim-unit" id="sim-plan-status" aria-live="polite"></p>
<div class="sim-product-fields"><h3>블록 + 프리미엄 12개월</h3><div class="sim-fields">${input('price','세트 정가 (원)',139000)}${input('cost','교구 원가 / 세트 (원)',10000)}${input('platform','12개월 플랫폼 비용 / 세트 (원)',10000)}</div></div>
<div class="sim-product-fields"><h3>탱고노트 단품</h3><div class="sim-fields">${input('notePrice','소비자가 (원)',100000)}${input('noteCost','원가 / 대 (원)',20000)}${input('notePlatform','추가 플랫폼 비용 / 대 (원)',0)}</div><p class="sim-note">2027년 3분기 출시 · 구독 포함 여부 미정. 플랫폼 비용은 우선 0원으로 두며, 원가 2만원과 별도입니다.</p></div>
<div class="sim-fields">${input('krRate','한국 공급률 (%)',50,100,0.1)}${input('worldRate','해외 공급률 (%)',50,100,0.1)}</div>
<p class="sim-unit" id="sim-unit-prices"></p>
<div class="sim-toolbar"><label>일괄 적용 상품<select id="sim-fill-product"><option value="block">블록 세트</option><option value="note">탱고노트</option></select></label>${input('fill-kr','한국 월 공급 대수',1000,1000000)}${input('fill-world','해외 월 공급 대수',0,1000000)}<button type="button" class="sim-primary" id="sim-apply">선택 연도에 적용</button></div>
<p class="sim-note">일괄 적용은 선택 상품의 판매 가능 월을 덮어씁니다. 2027년은 한국만, 탱고노트는 7월부터 입력합니다. 2028년 해외는 태국·베트남·인도네시아 합계입니다. 입력은 이 브라우저에 저장됩니다.</p>
<div id="sim-error" class="sim-error" role="alert" hidden></div>
<div class="sim-metrics" aria-live="polite"><div class="sim-metric"><span>선택 연도 공급액</span><strong id="sim-annual-supply"></strong></div><div class="sim-metric"><span>매출원가 가정</span><strong id="sim-annual-cost"></strong><span id="sim-cost-detail"></span></div><div class="sim-metric"><span>예상 매출총이익</span><strong id="sim-annual-balance"></strong><span id="sim-margin"></span></div></div>
<div class="table-wrap"><table class="sim-table sim-region"><caption>지역별 연간 합계 · 금액: 만원</caption><thead><tr><th>지역</th><th>블록 세트</th><th>탱고노트</th><th>공급액</th><th>교구 원가</th><th>플랫폼 비용</th><th>예상 매출총이익</th></tr></thead><tbody id="sim-regions"></tbody></table></div>
<div class="sim-months"><h3>월별 유통사 공급량</h3><p class="sim-unit">블록·노트는 유통사 공급 대수 · 금액: 만원</p><div class="table-wrap"><table class="sim-table"><thead><tr><th>월</th><th>한국 블록</th><th>한국 노트</th><th>해외 블록</th><th>해외 노트</th><th>공급액</th><th>교구 원가</th><th>플랫폼 비용</th><th>예상 매출총이익</th></tr></thead><tbody id="sim-months"></tbody><tfoot id="sim-totals"></tfoot></table></div></div>
<details class="sim-details"><summary>추가 비용과 12개월 서비스 부담</summary><p class="sim-note">공란은 미반영입니다. 이미 원가·플랫폼 비용에 포함된 항목을 다시 넣지 않습니다. 추가 서비스비는 블록 패키지의 예상 이용권에만 적용합니다. 서비스 부담은 공급 월부터 이용을 시작한다고 가정하며, 실제 소비자 등록 시점과 다를 수 있습니다.</p><div class="sim-fields">${input('krExtra','한국 추가 비용 / 대 (원)','',10000000,1,true)}${input('worldExtra','해외 추가 비용 / 대 (원)','',10000000,1,true)}${input('service','추가 서비스비 / 이용권·월 (원)','',10000000,1,true)}${input('fixed','월 고정비 (원)','',100000000000,1,true)}</div><p id="sim-service-summary" class="sim-note"></p><div class="table-wrap"><table class="sim-table sim-region"><caption>선택 연도 서비스 제공 · 금액: 만원</caption><thead><tr><th>월</th><th>활성 이용권</th><th>추가 서비스비</th><th>기타 추가 비용</th></tr></thead><tbody id="sim-service-months"></tbody></table></div></details>
<p class="sim-note">공급액 = 각 상품 정가 × 지역 공급률 × 유통사 공급 대수. 해외도 동일 원화 가격입니다. 블록에 포함된 12개월 구독료를 별도 매출로 더하지 않습니다. 매출총이익은 공급액에서 교구 원가·플랫폼 비용을 차감한 관리용 가정이며 순이익과 다릅니다. VAT·배송·통관·반품·인건비·회계상 수익 인식은 별도입니다.</p>
<p class="sim-note">2027년 블록 유통사 공급 목표는 10,500대입니다. 자사몰 주문과 유통사의 소비자 판매량은 합산하지 않습니다. 탱고노트와 2028년 공급량은 미정이므로 초기값 0입니다. 2028년 신규 블록의 별도 가격·구독 갱신 매출은 미반영입니다.</p></div>`;
module.exports={css,html,js:'('+require('./business-plan-simulation-runtime-20261011.cjs').toString()+')('+JSON.stringify(plan)+');'};
