// 사용자 확정 판매 계획. 투자자 본문과 시뮬레이션 초기값이 같은 전제를 사용한다.
const plan={year:2027,price:139000,cost:10000,platform:10000,krRate:50,worldRate:50,months:Array.from({length:12},(_,i)=>({kr:i<3?500:1000,world:0})),overseasYear:2028,countries:['태국','베트남','인도네시아']};
const quantity=plan.months.reduce((n,m)=>n+m.kr,0);
const supply=quantity*plan.price*plan.krRate/100;
const grossProfit=supply-quantity*(plan.cost+plan.platform);
const fmt=n=>n.toLocaleString('ko-KR');
const css=`
.td-commercial{display:grid;grid-template-columns:1.2fr 1fr;gap:24px;margin:24px 0}
.td-commercial>div{padding:24px;background:var(--doc-color-wash)}
.td-commercial h3{font-size:var(--doc-type-heading);margin:12px 0}
.td-commercial strong{display:block;font-size:var(--doc-type-metric);line-height:1.25;letter-spacing:-.04em}
.td-commercial small{font-size:var(--doc-type-body)}
.td-commercial .td-price-line{margin:14px 0;display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid var(--doc-color-line);padding-bottom:12px}
.td-sales-layout{display:grid;grid-template-columns:1.3fr 1fr;gap:32px;margin:24px 0}
.td-quarter{display:grid;grid-template-columns:110px 1fr 80px;gap:16px;align-items:center;margin:18px 0;font-variant-numeric:tabular-nums}
.td-quarter small{display:block;color:var(--doc-color-muted);font-size:14px}
.td-quarter-track{height:24px;background:var(--doc-color-wash)}
.td-quarter-track i{display:block;height:100%;background:var(--doc-color-teal)}
.td-quarter>b{text-align:right;white-space:nowrap}
.td-plan-total{background:var(--doc-color-wash);padding:24px}
.td-plan-total strong{display:block;font-size:var(--doc-type-metric);line-height:1.3;letter-spacing:-.04em}
.td-plan-total p{border-top:1px solid var(--doc-color-line);padding-top:16px}
.td-plan-total p b{font-size:var(--doc-type-heading)}
.td-expansion{border-top:2px solid var(--doc-color-teal);padding:20px 0;margin-top:24px;display:flex;gap:32px;align-items:start}
.td-expansion h3{white-space:nowrap}.td-expansion p{margin:0}
@media(max-width:699px){.td-commercial,.td-sales-layout{grid-template-columns:1fr}.td-commercial strong,.td-plan-total strong{font-size:var(--doc-type-presentTitle)}.td-quarter{grid-template-columns:86px 1fr 72px;gap:8px}.td-expansion{display:block}}
`;
const growth=`<div class="td-commercial"><div><span class="v-label">메인 상품</span><h3>한글·영어 통합 블록<br>＋ 프리미엄 12개월</h3><strong>${fmt(plan.price)}<small>원</small></strong><p>90개 블록 · 인식판 · 반사경 · 거치대<br>한글·영어 파닉스 전 과정 · 동화책 독후활동</p><div class="td-package-scope"><b>탱고노트 별도 구성</b><span>이 패키지에는 포함되지 않으며, 소비자가 100,000원 · 원가 20,000원 · 2027년 3분기 출시 계획입니다.</span></div></div><div><span class="v-label">유통 공급 구조</span><div class="td-price-line"><span>정가 대비 공급률</span><b>50%</b></div><div class="td-price-line"><span>당사 세트당 공급가</span><b>69,500원</b></div><div class="td-price-line"><span>교구 원가 가정</span><b>10,000원</b></div><div class="td-price-line"><span>플랫폼 운영비 / 세트</span><b>${fmt(plan.platform)}원</b></div><div class="td-unit-profit"><span>세트당 예상 매출총이익</span><b>49,500원</b></div></div></div><div class="td-grid three"><article class="td-card"><span class="v-label">무료 진입</span><h3>무료 학습·읽기</h3><p>한글 1권 · 영어 1·2권 무료<br>동화책 읽기는 누구나 무료</p></article><article class="td-card"><span class="v-label">교구 구매 가치</span><h3>손으로 만드는 학습</h3><p>앱의 문제를 실물 블록으로 풀고, 조합 결과에 화면·소리로 반응하는 학습 경험입니다.</p></article><article class="td-card"><span class="v-label">디지털 단독</span><h3>월 9,900원 구독</h3><p>교구 없이도 나머지 파닉스 과정과 동화책 독후활동을 이용할 수 있습니다.</p><p class="td-note">학습 리포트·맞춤 추천은 프리미엄 확장 기능으로 개발 예정</p></article></div><details class="v-evidence"><summary>원가·매출총이익 산출 기준</summary><p>공급가·원가는 사업계획 기준입니다. 세트당 교구 원가 10,000원과 12개월 플랫폼 운영비 10,000원을 반영한 예상 매출총이익은 49,500원입니다. 배송·반품·인건비·세금 등 미반영 비용이 있어 순이익과 구분합니다. 포함된 구독료는 별도 매출로 중복 계산하지 않습니다.</p></details>`;
const validation=require('./business-plan-milestone-20261011.cjs').html;
const teamSummary=`<div class="team-intro td-team-summary"><p><b>최신 판매 계획 · 2026.10.11 확정</b></p><p>주력 판매는 유통사 공급·재주문이며, 예상 판매량은 유통사 공급량입니다. 오가닉 마케팅은 유통사의 소비자 판매를 지원하고, 자사몰은 공식 정가·제품 정보를 제시하는 보조 채널입니다. 자사몰 주문과 소비자 판매량은 예상 공급량에 합산하지 않습니다. 메인 상품은 한글·영어 통합 블록+프리미엄12개월, 정가139,000원·유통 공급률50%·공급가69,500원입니다. 탱고노트는 이 패키지에 포함되지 않는 별도 구성이며 소비자가100,000원·원가20,000원, 2027년3분기 출시 계획입니다. 2027년1월 한국 판매 개시,1분기 월500대·2분기부터 월1,000대로 연간 유통사 공급10,500대, 공급액729,750,000원을 계획합니다. 교구 원가와 플랫폼 운영비를 각각 대당10,000원씩 가정하여 예상 매출총이익은519,750,000원입니다. 플랫폼 비용은12개월 전체 이용분을 판매당 한 번 반영하며 추가비용·인건비·세금 등은 별도입니다. 2027년 해외 판매는 없으며, 2028년부터 태국·베트남·인도네시아3개국 판매를 계획합니다. 2028년 국내·해외 판매량과 국가별 개시 월은 미정입니다. 아래 이전 전략·예산 수치와 충돌하면 이 확정 계획을 우선합니다.</p></div>`;
module.exports={plan,css:css+require('./business-plan-milestone-20261011.cjs').css,growth,validation,teamSummary};
