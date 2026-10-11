const html=`<div class="td-milestone-totals" id="milestone-totals"></div><div class="td-milestone-graph"><div class="td-milestone-legend"><b>출시 일정 · 분기별 예상 매출</b><span><i></i> 한국 <i></i> 해외 3개국</span></div><div id="milestone-chart" role="img" aria-label="출시 일정과 연결된 분기별 공급 매출 및 유통사 공급량"></div></div><p class="td-note" id="milestone-status"></p><details class="v-evidence"><summary>계산 기준·미정 판매 계획</summary><p>유통사 공급량 기준이며 자사몰 주문·소비자 판매량은 합산하지 않습니다. 매출 시뮬레이션의 상품별 수량·정가·공급률과 연동됩니다. 2028년 출시 분기·판매량과 신규 블록 가격은 미정입니다. 금액은 공급액 기준의 계획이며 실적이 아닙니다. 탱고노트는 2027년 3분기 출시, 소비자가 10만원 기준입니다.</p></details>`;
const css=`
.td-milestone-graph{padding:20px 18px 0;background:white;border:1px solid var(--doc-color-line);border-radius:12px}
.td-milestone-legend{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:15px}
.td-milestone-legend span{font-size:12px}.td-milestone-legend i{display:inline-block;width:10px;height:10px;background:#238f88;margin:0 4px 0 12px}.td-milestone-legend i:last-child{background:#ef8756}
#milestone-chart svg{width:100%;height:auto;display:block}
.td-milestone-totals{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:24px 0}
.td-milestone-totals>div{padding:14px 20px;background:var(--doc-color-wash);border-left:4px solid #238f88}.td-milestone-totals>div:last-child{border-color:#ef8756}
.td-milestone-totals span,.td-milestone-totals small{display:block;font-size:12px;color:var(--doc-color-muted)}.td-milestone-totals strong{display:block;font-size:32px;margin:4px 0}
@media(max-width:699px){.td-milestone-totals{grid-template-columns:1fr;gap:10px}.td-milestone-totals strong{font-size:26px}.td-milestone-graph{padding:12px 4px 0}.td-milestone-legend{padding:0 8px;flex-wrap:wrap}#milestone-chart{overflow:auto}#milestone-chart svg{min-width:780px}}
`;module.exports={html,css};