module.exports=({img})=>({
html:`<div class="td-sales-summary-flow">
<article><span class="v-label">제품·콘텐츠 공급</span><h3>탱고북</h3>${img('../investor-20261010/hardware-kit-studio-v3.png','탱고 블록과 학습 앱 제품 구성')}<p>교구 + 프리미엄 콘텐츠</p></article>
<span class="td-sales-summary-arrow" aria-hidden="true">→</span>
<article class="td-sales-summary-dealer"><span class="v-label">주력 판매 채널</span><h3>유통사</h3><div class="td-sales-summary-channel"><b>인플루언서<br>공동구매</b><span>기존 전문 거래처 보유</span></div><p>초도 공급 · 재주문</p></article>
<span class="td-sales-summary-arrow" aria-hidden="true">→</span>
<article><span class="v-label">소비자 판매</span><h3>구매 고객</h3>${img('../investor-20261010/hardware-feedback-use-v3.png','블록과 앱을 함께 사용하는 학습 장면 예시')}<p>학습 경험 · 후기 · 추천</p></article>
</div>
<div class="td-sales-summary-support"><div><span class="v-label">탱고북의 판매 지원</span><b>한글 중심 오가닉 마케팅</b></div><p>네이버 · Google · YouTube · Instagram<br><strong>검색·시연·무료 체험 → 유통사 판매 지원</strong><br><span>AI로 홍보 콘텐츠 생성 · 검수 후 자동 발행</span></p></div>
<div class="td-sales-summary-footer"><p><b>예상 판매량 = 유통사 공급량</b><br><span>거래처별 초도 공급 + 재주문</span></p><a class="td-sales-detail" href="#marketing" data-open-tab="marketing">자세히 보기 <span aria-hidden="true">↗</span></a></div>`,
css:`
.td-sales-summary-flow{display:grid;grid-template-columns:minmax(0,1fr) 28px minmax(0,1fr) 28px minmax(0,1fr);gap:12px;align-items:stretch;margin:26px 0}
.td-sales-summary-flow article{border:1px solid var(--doc-color-line);border-radius:12px;background:white;padding:20px;min-width:0}
.td-sales-summary-flow h3{font-size:26px;margin:10px 0 18px}.td-sales-summary-flow img{display:block;width:100%;height:150px;object-fit:cover;border-radius:8px}.td-sales-summary-flow article>p{font-size:15px;margin:18px 0 0}
.td-sales-summary-arrow{align-self:center;font-size:30px;color:var(--doc-color-teal)}.td-sales-summary-dealer{border-top:4px solid var(--doc-color-teal)!important;padding-top:17px!important}
.td-sales-summary-channel{height:150px;display:flex;flex-direction:column;justify-content:center;padding:16px;background:var(--doc-color-wash);border-radius:8px;gap:12px}.td-sales-summary-channel b{font-size:25px;line-height:1.4}.td-sales-summary-channel span{font-size:13px;color:var(--doc-color-muted)}
.td-sales-summary-support{display:flex;justify-content:space-between;align-items:center;gap:24px;background:var(--doc-color-wash);padding:22px 26px;border-left:4px solid var(--doc-color-teal)}.td-sales-summary-support b{display:block;font-size:21px;margin-top:8px}.td-sales-summary-support p{font-size:14px;line-height:1.8;margin:0}.td-sales-summary-support strong{font-weight:400;color:var(--doc-color-teal)}
.td-sales-summary-footer{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:22px}.td-sales-summary-footer p{font-size:16px;margin:0}.td-sales-summary-footer p span{font-size:13px;color:var(--doc-color-muted)}a.td-sales-detail{background:var(--doc-color-ink);color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:16px;white-space:nowrap}a.td-sales-detail:focus-visible{outline:3px solid var(--doc-color-teal);outline-offset:4px}
@media(max-width:900px){.td-sales-summary-flow{gap:8px;grid-template-columns:minmax(0,1fr) 18px minmax(0,1fr) 18px minmax(0,1fr)}.td-sales-summary-flow article{padding:14px}.td-sales-summary-dealer{padding-top:11px!important}.td-sales-summary-flow h3{font-size:23px}.td-sales-summary-channel{padding:12px}.td-sales-summary-channel b{font-size:22px}.td-sales-summary-arrow{font-size:24px}.td-sales-summary-flow article>p{font-size:13px}}
@media(max-width:600px){.td-sales-summary-flow{grid-template-columns:1fr;margin:20px 0}.td-sales-summary-arrow{justify-self:center;transform:rotate(90deg)}.td-sales-summary-flow img{height:180px}.td-sales-summary-support{flex-direction:column;align-items:start;gap:14px;padding:20px}.td-sales-summary-footer{flex-wrap:wrap}.td-sales-summary-channel{height:auto;min-height:130px}}
@media print{.td-sales-detail{display:none}.td-sales-summary-flow,.td-sales-summary-support{break-inside:avoid}}
`
});
