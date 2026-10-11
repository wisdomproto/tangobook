// 2026-10-10 사용자 확정 순서. 투자자 본편은 여기서 새로 작성한다.
// 이전 모듈은 내부 팀 자료/부록 변환용으로 보존하며 본편 문장을 상속하지 않는다.
module.exports=({slides,img})=>{
 const sales=require('./business-plan-sales-20261011.cjs');
 const content=require('./business-plan-content-20261011.cjs')({img});
 const assets=require('./business-plan-content-summary-20261011.cjs')({img,inventory:content.inventory});
 const expansion=require('./business-plan-expansion-20261011.cjs')({img});
 const ecosystem=require('./business-plan-ecosystem-20261011.cjs')({img});
 const platform=require('./business-plan-platform-20261011.cjs')({img});
 const salesSummary=require('./business-plan-sales-summary-20261011.cjs')({img});
 const marketingTools=require('./business-plan-marketing-tools-20261011.cjs')({img});
 const readability=require('./business-plan-readability-20261011.cjs')({img});
 const products=require('./business-plan-products-20261011.cjs')({img});
 const refinement=require('./business-plan-visual-refinement-20261011.cjs')({img,counts:content.inventory.counts});
 const asset=f=>'../investor-20261010/'+f;
 const figure=(file,alt,caption,cls='')=>`<figure class="td-figure ${cls}">${img(file,alt)}<figcaption>${caption}</figcaption></figure>`;
 const note=text=>`<p class="td-note">${text}</p>`;
 const takeaway=text=>`<div class="v-takeaway">${text}</div>`;
 const card=(label,title,text)=>`<article class="td-card"><span class="v-label">${label}</span><h3>${title}</h3><p>${text}</p></article>`;
 const actual=figure(asset('digital-tablet-child-v1.webp'),'아이가 태블릿 화면을 터치하며 글자를 배우는 학습 장면','태블릿 터치 학습 · 사용 장면 예시');
 const analogBlock=figure(asset('analog-blocks-standalone-v2.png'),'화면이나 인식판 없이 책상 위에서 자모를 조합하는 독립 블록 예시','디지털 연결 없는 블록 조합 예시');
 const writing=figure(asset('furniture-writing-use-v1.png'),'종이에 가구를 따라 쓰는 손의 활동 예시','같은 낱말을 손으로 따라 쓰기 · 활동 예시');
 const market=require('./business-plan-market-20261011.cjs');
 const next=[
 ['education-market','','시장 배경','유아 교육 시장','',market],
 ['media','','교육 콘텐츠','아날로그·디지털 유아교육','유아 교육은 크게 아날로그 콘텐츠와 디지털 콘텐츠로 나뉩니다.',
  `<div class="td-media-comparison"><article><h3>아날로그 콘텐츠</h3><div class="td-media-visual td-mini-duo">${analogBlock}${writing}</div><div class="td-media-point benefit"><b>장점</b><p>손으로 글자를 조합하고<br>종이에 직접 쓰는 경험</p></div><div class="td-media-point limitation"><b>단점</b><p>교구 자체의 안내·피드백 부족<br>부모·교사의 설명과 진행에 의존</p></div></article><article><h3>디지털 콘텐츠</h3><div class="td-media-visual">${actual}</div><div class="td-media-point benefit"><b>장점</b><p>게임의 안내·피드백·보상으로<br>스스로 다음 활동에 도전</p></div><div class="td-media-point limitation"><b>단점</b><p>화면 터치 중심의 활동<br>실물 조합·종이 쓰기 경험 부족</p></div></article></div>${takeaway('<b>결합 방향</b> · 실물 조작과 쓰기 + 디지털 안내·피드백·게임')}`],
 ['platform-overview','','제작·운영 기반','플랫폼 운영 구조','AI로 제작한 콘텐츠를 축적하고, 학습 서비스와 마케팅에 함께 활용합니다.',readability.map],
 ['vision','','서비스 구성','탱고북 개요','탱고북은 앱으로 글자와 소리를 익히고, 실물 블록을 조합하고, 종이에 쓰며 배우는 유아 언어 학습 플랫폼입니다.',refinement.overview],
 ['business','','학습 과정 · 교구 연동','아날로그·디지털 통합 학습','한글 ‘ㄱ’ 단원 · 같은 낱말 ‘가구’로 이어지는 학습 과정',platform.experience],
 ['reading-report','','학습 과정 · 읽기 확장','동화 연결과 학습 리포트','배운 낱말을 동화 속에서 만나고, 앱·교구 활동을 한곳에서 확인합니다.',platform.reading],
 ['foundation','','보유 자산','보유 콘텐츠 규모','파닉스 교육과정과 동화책, 책에 연결된 독후활동을 확보하고 있습니다.',refinement.assets],
 ['advantage','','교구 연동','교구 연동 기술','탱고 블록은 카메라로 조합을 인식하고, 탱고노트는 필기·학습지 정보를 블루투스로 전송하는 구성입니다.',
  `<div class="td-device-connections"><article><span class="td-product-status">블록 조합 인식 구현</span><h3>탱고 블록</h3><figure>${img(asset('hardware-kit-studio-v3.png'),'실물 블록·인식판·태블릿 카메라 반사경')}</figure><ol><li><b>블록 조합</b><span>자음·모음·알파벳</span></li><li><b>카메라 인식</b><span>태블릿 카메라 + 반사경</span></li><li><b>앱 반응</b><span>만든 글자 확인</span></li></ol></article><article><span class="td-product-status planned">2027년 3분기 출시 계획</span><h3>탱고노트</h3><figure>${img(asset('tangonote-product-v5.webp'),'평평한 노트판·테두리 안쪽에 숨겨진 왼쪽 종이 삽입 홈·종이·펜·태블릿')}</figure><ol><li><b>종이에 필기</b><span>노트판 위 학습지</span></li><li><b>블루투스 전송</b><span>필기 데이터·학습지 정보</span></li><li><b>앱 반응</b><span>학습지에 맞는 안내</span></li></ol></article></div><div class="td-connection-result"><b>앱·교구 통합 연동</b><span>학습 안내 · 활동 기록 · 부모 리포트</span></div><p class="td-status-line">개발·검증 중 · 교구와 앱의 학습 안내·통합 기록 연동</p><details class="v-evidence"><summary>구현 기반과 연동 검증 범위</summary><p>탱고 블록은 공통 블록 인식기와 앱 카메라 연결을 구현 기반으로 합니다. 탱고노트의 종이 필기·학습지 식별·블루투스 전송은 2026.10.11 사용자 설명에 따른 제품 구성입니다. 2024 탱고노트 제안서는 종이·실제 펜촉·EMR 기반의 참고 자료입니다. 이번 이미지는 제품 구성 예시이며 양산 치수·내부 센서 설계·실기기 성능이나 통합 학습 기록의 검증 완료를 뜻하지 않습니다.</p></details>`],
 ['ai-authoring','','콘텐츠 제작','AI 콘텐츠 저작도구','원고·삽화·음성 제작과 번역을 자동화하고, 편집자의 검수로 품질을 관리합니다.',refinement.authoring],
 ['growth','','상품','상품 구성','주력 상품은 블록 세트와 프리미엄 12개월 이용권입니다. 종이 쓰기 교구인 탱고노트는 별도 구매 상품입니다.',products.products],
 ['revenue-model','','비즈니스·수익 모델','수익 구조','교구의 유통 공급 매출과 디지털 프리미엄 구독으로 수익을 만듭니다.',products.economics],
 ['sales-strategy','','판매 전략','유통사 중심 판매 전략','기존 공동구매 전문 유통사에 제품을 공급하고, 브랜드 마케팅으로 유통사의 판매와 재주문을 지원합니다.',salesSummary.html],
 ['expansion-platform','','확장 계획','언어·교구 확장','한글·영어에서 아시아 언어로, 글자 블록에서 수·창의·논리 놀이로 확장합니다.',expansion.platform],
 ['validation','','마일스톤','판매 계획 및 마일스톤','한국 유통사 공급을 시작으로 태국·베트남·인도네시아로 확대합니다. 예상 판매량은 유통사 공급 기준입니다.',sales.validation],
 ['team','','투자 유치','투자 유치 계획','확보한 교구 개발 경험과 디지털 콘텐츠를 판매와 반복 사용으로 연결합니다.',
  `<div class="td-investment"><article><span class="v-label">확보한 기반</span><h3>교구 개발 경험<br>＋ 디지털 콘텐츠 기반</h3><ul><li>과거 플레이탱고의 한글·영어 교구 경험</li><li>교원 협업 제품 이력</li><li>현재 언어 학습·동화책·독후활동과 제작 도구</li></ul></article><article><span class="v-label">투자로 완성할 사업</span><h3>판매 가능한 교구<br>＋ 지속 활용할 학습 경험</h3><ul><li>제품 사양·실물 연동·사용성 완성</li><li>양산·인증·품질·공급·AS 준비</li><li>첫 구매·반복 사용·판매 수익성 검증</li></ul></article></div>${takeaway('<b>투자금 활용 방향</b> · 제품 완성, 양산 준비, 초기 판매 검증')}${note('투자 금액·집행 비율·팀 구성은 추가 정보 확인 후 확정합니다. 2027년 판매 계획은 목표이며 실제 계약·실적과 구분합니다.')}`]
 ];
 next.push(['learning-range','','학습 범위','글자에서 이야기까지','첫 글자부터 동화 읽기와 복습까지, 하나의 앱에서 이용하는 학습 콘텐츠입니다.',ecosystem.scope]);
 next.push(['marketing-tools','','마케팅 도구','AI 마케팅 도구','보유 콘텐츠로 홍보물을 만들고, 검수 후 각 채널에 자동 발행합니다.',refinement.marketing]);
 const order=['education-market','media','vision','learning-range','business','reading-report','platform-overview','ai-authoring','foundation','advantage','marketing-tools','growth','sales-strategy','revenue-model','expansion-platform','validation','team'];
 slides.splice(0,slides.length,...order.map(id=>next.find(s=>s[0]===id)));
 return {css:refinement.css+assets.css+ecosystem.css+sales.css+salesSummary.css+marketingTools.css+readability.css,updateTeam(team){
  const intro=`<div class="team-intro td-team-summary"><p><b>최신 투자자 제안서 기준</b></p><p>시장 → 아날로그·디지털 → 학습 앱·교구·콘텐츠 → 통합 학습 과정 → 동화 연결·학습 리포트 → 플랫폼 전체 구성 → AI 저작도구 → 한글·영어 파닉스 → 동화책 → 디지털 독후활동 → 아날로그 교구 → AI 마케팅 도구 → 상품 구성 → 수익 구조 → 판매 전략 → 언어·교구 확장 → 초등 저학년 콘텐츠 확장 → 마일스톤 → 투자 순서입니다. 탱고노트는 블록 패키지에 포함되지 않는 별도 상품으로, 소비자가10만원·원가2만원·2027년3분기 출시 계획입니다. 주력 상품은 통합 블록+프리미엄12개월 패키지이며, 디지털 콘텐츠는 독립 구독 상품이자 교구 결합 혜택입니다. 탱고노트는 종이 필기·학습지 식별 데이터를 블루투스로 태블릿에 전달하는 구성입니다. 상세 치수·양산 사양은 후속 확정합니다. 통합 학습 장표는 한글 ㄱ 단원을 가구라는 한 낱말로 설명합니다. 앱에서 익히기→블록 조합→쓰기→연관 게임→동화 읽기를 한 흐름으로 구성하며, 아날로그·디지털 학습 현황 통합은 개발 방향입니다. 쓰기 기록은 노트판의 필기 데이터와 학습지 정보를 블루투스로 전달받는 방식입니다. 앱의 기록·피드백 연동은 후속 구현·검증합니다. 앱 개요 화면과 간단한 리포트는 설명용 디자인입니다. 가구 단원에서 금발 머리 소녀와 곰 세 마리의 의자 장면을 활용하고 가구라는 낱말을 직접 넣은 학습 예문을 제시합니다. 실제 동화 원문 인용이나 자동 추천 구현 완료를 뜻하지 않습니다.</p><p>핵심 문제는 디지털과 연결되지 않은 교구가 부모·교사의 설명과 진행에 의존한다는 점입니다. 비교 장표에는 독립 교구를, 해결 장표에는 연동 제품을 보여줍니다. 탱고북은 화면의 안내·반응·다음 미션으로 아이의 자기주도 학습을 유도하고 성인의 진행 부담을 줄이는 것을 목표로 합니다. 이 부담 완화와 아이의 손 활동·자기주도 학습 유도를 교구 구매 가치로 설명합니다. 미션 진행·성취 반응 예시는 학습 경험 설명이며 구현 완료를 뜻하지 않습니다. 글자·낱말 학습에서 이야기 읽기로 범위를 넓히며, 이 제안서는 기존 창작동화가 모두 공개된 상품 구성을 전제로 작성합니다. 운영 데이터의 공개 상태를 변경하는 지시는 아닙니다. 동화책 콘텐츠는 기존2026.10.05 제안 구성 집계1,212권(명작144·전래40·생활63·자연관찰/탐구115·창작850)을 그림체별 판본 기준으로 표시하고, 거인의 정원 실제 화면으로 네 가지 독후활동을 설명합니다. AI 저작도구는 제작 자동화·사람의 검수·콘텐츠 재활용으로 비용을 낮추고 양질의 콘텐츠를 지속 추가하는 기반입니다. 저작도구 그림은 문서용 구성 예시이며 비용 절감률은 아직 실측하지 않았습니다. 확장성은 베트남어·태국어·말레이어 학습 과정, 숫자·연산/창의/보드게임 블록, 다양한 창작동화와 초등 저학년 학습만화(타임 티코·삼국지·그리스 로마신화)를 두 장으로 설명합니다. 추가 블록은 공통 보드+교체 세트+앱 문제/난이도 확장 방향이며 호환성은 후속 검증합니다. 인식 원리는 실물 블록→반사경·카메라→앱 반응으로 설명합니다. 쓰기 제품은 평평한 노트판과 왼쪽 종이 고정 홈으로 구성하며, 사용자의 새 기구 설명을 과거 문서의 상단 클립보다 우선합니다.</p><p>실제 디지털 블록·쓰기 기능과 리포트 구현 자료는 내부 검토용으로 보존합니다. 실물 연동·쓰기 입력·양산 사양·학습 효과·가격은 구현 기반과 확정 상태를 구분합니다.</p></div>`;
  return team.replace('<details class="team-intro">',sales.teamSummary+intro+'<details class="team-intro">');
 }};
};
