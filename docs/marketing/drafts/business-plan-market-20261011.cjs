// 국내는 유아 사교육비 시험조사의 단순 연간 환산, 해외는 세계 시장 전망.
const source=(url,label)=>`<a class="v-source" href="${url}" target="_blank" rel="noopener">${label} ↗</a>`;
const domestic='https://www.kostat.go.kr/boardDownload.es?bid=12306&list_no=443103&seq=1#page=3';
const technavio='https://www.technavio.com/report/early-childhood-education-market-industry-analysis';
const asia='https://www.emergenresearch.com/industry-report/early-childhood-education-market';
const rows=(items,max)=>items.map(([label,value,display,forecast])=>`<div class="td-chart-row"><span>${label}</span><div class="td-chart-track"><i style="width:${value/max*100}%" class="${forecast?'forecast':''}"></i><b>${display}</b></div></div>`).join('');
module.exports=`<div class="td-market-overview td-market-revised">
<article class="td-market-card td-market-domestic"><div class="td-market-heading"><span class="v-label">KOREA</span><h3>국내 유아 사교육 시장</h3></div>
<div class="td-domestic-scale"><span>연간 환산 추정</span><div><small>약</small><strong>3.3</strong><b>조원</b></div></div>
<div class="td-domestic-message"><h4>저출생 속,<br>한 아이에 집중되는 소비</h4></div>
<footer class="td-domestic-source"><p>6세 미만 · 2024년 7–9월 시험조사의 연간 환산 추정<br>계절 변동 미반영</p>${source(domestic,'시장 규모 · 국가데이터처')}${source('https://repo.kicce.re.kr/bitstream/2019.oak/5923/2/GR2502_2.pdf#page=77','소비 특성 · 육아정책연구소')}</footer></article>
<article class="td-market-card"><div class="td-market-heading"><span class="v-label">GLOBAL · ASIA-PACIFIC</span><h3>세계·아시아 유아교육 시장</h3></div><p class="td-market-measure">세계 시장 규모 · 2025년 추정</p><div class="td-market-number"><strong>3,027.6</strong><span>억 달러</span></div>
<div class="td-market-chart global" role="img" aria-label="세계 시장 2025년 3027.6억 달러, 2030년 5217.1억 달러 전망 계산값. 세계 연평균 성장률 11.5%. 축 0부터 6000억 달러."><h4>세계 연평균 성장률 <em>11.5%</em></h4><p>2025–2030년 · 억 달러</p>${rows([['2025',3027.6,'3,027.6'],['2030',5217.1,'5,217.1',true]],6000)}<div class="td-chart-axis"><span>0</span><span>3,000</span><span>6,000</span></div></div>${source(technavio,'Technavio · 세계 시장 전망')}
<div class="td-asia-focus"><span class="v-label">아시아·태평양 성장 배경</span><h4>도시화 · 중산층 확대 · 유아교육 수요</h4><p>중국·인도·동남아의 취학 전 교육 확대와 이중언어·디지털 학습 수요</p>${source(asia,'Emergen Research · 아시아·태평양 분석')}</div></article></div>
<details class="v-evidence"><summary>통계 범위와 산출 기준</summary><p>국내: 국가데이터처 「한국의 사회동향 2025」 271~272쪽에서 인용한 교육부·통계청 「2024년 유아 사교육비 시험조사」(2025.3.13 발표). 6세 미만 유아의 2024년 7~9월 사교육비 총액 8,154억원 × 4 = 3조 2,616억원, 약 3.3조원. 3개월 지출 수준이 연중 동일하다는 가정의 자체 환산값이며 공식 연간 통계가 아닙니다. 시험조사는 국가승인통계가 아니며 계절 변동을 반영하지 않습니다. 전체 육아·교육·보육 시장이나 탱고북 교구의 직접 판매 가능 시장과 구분합니다. 소비 특성: KICCE 소비실태조사 2025 하권 55~56쪽의 자녀 수별 양육비 경향을 요약했습니다. 저출생은 장기 배경이며 매년 출생아 수 감소나 교육비·시장 총액의 지속 증가를 의미하지 않습니다. 세계: 교육기관·가정 프로그램을 포함한 시장 추정이며 2030년 값은 2025년 3,027.6억 달러 + 보고서 증가분 2,189.5억 달러입니다. 아시아는 별도 보고서의 지역 성장 요인 분석이며 세계 성장률을 아시아 성장률로 적용하지 않습니다. 국내 사교육 지출과 세계 유아교육 시장은 범위가 달라 직접 비교하거나 합산하지 않습니다.</p></details>`;
