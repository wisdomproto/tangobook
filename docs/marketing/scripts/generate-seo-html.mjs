#!/usr/bin/env node
// consolidated-keywords.json 을 읽어서 단일 파일 HTML 로 변환.
// 출력: packages/client/public/seo-strategy.html (저작도구 자료실에서 열람)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.resolve(__dirname, '..', 'data', 'consolidated-keywords.json');
const OUT_PATH = path.resolve(__dirname, '..', '..', '..', 'packages', 'client', 'public', 'seo-strategy.html');

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const CATEGORY_LABELS_KR = {
  'A_명작동화': '명작·전래동화',
  'B_공룡': '공룡',
  'C_동물': '동물',
  'D_곤충': '곤충',
  'E_탈것': '탈것',
  'F_우주_자연': '우주·자연',
  'G_직업': '직업',
  'H_위인': '위인',
  'I_명절_계절': '명절·계절',
  'J_식물_먹거리': '식물·먹거리',
  'K_신체_감정': '신체·감정',
  'L_기초학습': '기초학습',
  'M_페인포인트': '페인포인트 일상',
  '_uncategorized': '기타',
  'A_유아영어': '유아 영어 (기존 카테고리)',
  'B_유아영어': '유아 영어 (기존 카테고리)',
  'C_파닉스': '파닉스 (기존 카테고리)',
  'D_한글학습': '한글 학습 (기존 카테고리)',
  'E_동화책': '동화책 (기존 카테고리)',
  'F_경쟁사': '경쟁사 (기존 카테고리)',
  'G_육아교육': '육아·교육 (기존 카테고리)',
  'H_기타': '기타 (기존 카테고리)',
};
const CATEGORY_LABELS_EN = {
  'A_FairyTales': 'Fairy Tales',
  'B_Dinosaurs': 'Dinosaurs',
  'C_Animals': 'Animals',
  'D_Bugs': 'Bugs/Insects',
  'E_Vehicles': 'Vehicles',
  'F_Space_Nature': 'Space/Nature',
  'G_Jobs': 'Jobs',
  'H_Biographies': 'Biographies',
  'I_Holidays_Seasons': 'Holidays/Seasons',
  'J_Plants_Food': 'Plants/Food',
  'K_Body_Emotions': 'Body/Emotions',
  'L_Foundational': 'Foundational',
  'M_PainPoint': 'Pain-point',
  '_uncategorized': 'Uncategorized',
};

const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const fmt = (n) => (n == null ? '-' : n.toLocaleString());
const compBadge = (c) => {
  if (!c || c === 'UNKNOWN') return '<span class="b b-na">-</span>';
  const cls = c === 'LOW' ? 'low' : c === 'MEDIUM' ? 'mid' : c === 'HIGH' ? 'high' : 'na';
  return `<span class="b b-${cls}">${esc(c)}</span>`;
};
const ratio = (a, b) => (b > 0 ? (a / b).toFixed(2) + '×' : '∞');

// 교차검증: Naver+Google 둘 다 있는 행만
const crossKR = (data.KR.main || [])
  .filter((r) => r.naverVolume != null && r.googleVolume != null)
  .sort((a, b) => (b.naverVolume ?? 0) - (a.naverVolume ?? 0));

// 카테고리별 KR 분류 (메인+골든 합쳐서 카테고리별 TOP 5 정렬)
// data.KR.byCategory 에 이미 있음
const krCategories = data.KR.byCategory || {};
const enCategories = data.EN.byCategory || {};

// 콘텐츠 페이지 매핑 후보 (KR 골든 중 카테고리 유의미한 것 상위 20)
const contentPageCandidates = (data.KR.golden || [])
  .filter((r) => r.category && r.category !== '_uncategorized')
  .slice(0, 25);

// ── 명작 전용: KR/EN 명작 카테고리 모든 키워드 추출 (메인+골든 dedup) ──
function extractCategory(records, cat) {
  const seen = new Set();
  const out = [];
  for (const r of records) {
    if (r.category === cat && !seen.has(r.keyword)) {
      seen.add(r.keyword);
      out.push(r);
    }
  }
  return out;
}
const krAll = [...(data.KR.main || []), ...(data.KR.golden || [])];
const enAll = [...(data.EN.main || []), ...(data.EN.golden || [])];
const krFairy = extractCategory(krAll, 'A_명작동화').sort(
  (a, b) => (b.naverVolume ?? b.googleVolume ?? 0) - (a.naverVolume ?? a.googleVolume ?? 0),
);
const enFairy = extractCategory(enAll, 'A_FairyTales').sort((a, b) => (b.googleVolume ?? 0) - (a.googleVolume ?? 0));

// 명작 서브그룹화 (KR)
function classifyFairyKR(kw) {
  if (/(흥부|콩쥐|해님|호랑이와|별주부|토끼전|심청|효녀|춘향|견우|선녀|도깨비|혹부리|단군|금도끼|청개구리|의좋은|까치와|나무꾼|소가|팥죽)/.test(kw))
    return '한국 전래';
  if (/(이솝|토끼와 거북이|개미와|양치기|두루미|까마귀와|사자와|북풍|황금알)/.test(kw)) return '이솝 우화';
  if (/(어린왕자|곰돌이 푸|앨리스|피터팬|오즈의|정글북|하이디|빨강머리|톰소여|허클|보물섬|15소년|소공녀|소공자|작은 아씨들|비밀의 화원|걸리버|닐스)/.test(kw))
    return '명작 문학';
  if (/(강아지똥|구름빵|내 짝꿍|책 먹는|달님|솔이|백두산|배고픈|괴물들|눈사람|무지개 물고기|갈색곰|굿나잇)/.test(kw)) return '현대 그림책';
  if (/(전집|추천|베스트|모음|세트|동화책 추천|그림책 추천|엄마표)/.test(kw)) return '검색 의도형';
  if (/^\d세|연령|유아|어린이|초등|토들러|preschool/.test(kw)) return '연령 타겟';
  return '서양 클래식';
}
function classifyFairyEN(kw) {
  if (/(tortoise|hare|ant.*grasshopper|cried wolf|fox.*grapes|fox.*crow|lion.*mouse|north wind|golden egg|aesop)/.test(kw)) return 'Aesop fables';
  if (/(little prince|winnie|alice|peter pan|wizard of oz|jungle book|heidi|anne of green|treasure island|tom sawyer|huckleberry|little women|secret garden|gulliver|pippi|pollyanna|black beauty)/.test(kw))
    return 'Literary classics';
  if (/(very hungry|wild things|goodnight moon|brown bear|giving tree|rainbow fish|guess how much|chicka chicka|gruffalo|corduroy|snowy day|harold|madeline|curious george|paddington)/.test(kw))
    return 'Modern picture books';
  if (/(books for \d|preschool|toddler|kindergarten|first graders|best childrens|best picture|read aloud|story books)/.test(kw)) return 'Age / intent';
  return 'Western classic';
}
const krFairyBy = {};
for (const r of krFairy) {
  const g = classifyFairyKR(r.keyword);
  if (!krFairyBy[g]) krFairyBy[g] = [];
  krFairyBy[g].push(r);
}
const enFairyBy = {};
for (const r of enFairy) {
  const g = classifyFairyEN(r.keyword);
  if (!enFairyBy[g]) enFairyBy[g] = [];
  enFairyBy[g].push(r);
}

const totalKR = data.KR.total;
const goldKR = (data.KR.golden || []).length;
const totalEN = data.EN.total;
const goldEN = (data.EN.golden || []).length;
const meta = data.meta;
const generatedAt = (meta.generatedAt || new Date().toISOString()).slice(0, 10);

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>탱고북 SEO 전략 — 콘텐츠 단위 키워드 기반</title>
<style>
  :root {
    --primary: #0f766e;
    --primary-dark: #134e4a;
    --accent: #f59e0b;
    --accent-light: #fbbf24;
    --bg: #fafaf7;
    --bg-soft: #ecfdf5;
    --card: #ffffff;
    --text: #1f2937;
    --text-soft: #6b7280;
    --border: #d1d5db;
    --low: #16a34a;
    --mid: #ca8a04;
    --high: #dc2626;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    font-size: 14px;
  }
  .container { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }

  .hero {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    padding: 48px 32px;
    border-radius: 14px;
    margin-bottom: 36px;
    position: relative;
    overflow: hidden;
  }
  .hero .tag { display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.15); border-radius: 20px; font-size: 11px; font-weight: 600; margin-bottom: 14px; letter-spacing: 0.5px; text-transform: uppercase; }
  .hero h1 { font-size: 32px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.5px; }
  .hero .subtitle { font-size: 15px; opacity: 0.92; max-width: 800px; line-height: 1.6; }
  .hero .meta { margin-top: 20px; display: flex; gap: 20px; flex-wrap: wrap; font-size: 12px; opacity: 0.85; }
  .hero .meta strong { color: var(--accent-light); }

  .toc {
    background: var(--bg-soft);
    border: 1px solid #a7f3d0;
    border-radius: 10px;
    padding: 18px 24px;
    margin-bottom: 40px;
  }
  .toc h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); margin-bottom: 10px; }
  .toc ol { list-style: none; counter-reset: toc; columns: 2; column-gap: 32px; }
  .toc li { counter-increment: toc; padding: 3px 0; font-size: 13px; }
  .toc li::before { content: counter(toc) "."; color: var(--accent); font-weight: 700; margin-right: 6px; }
  .toc a { color: var(--text); text-decoration: none; }
  .toc a:hover { color: var(--primary); text-decoration: underline; }

  section { margin-bottom: 52px; scroll-margin-top: 16px; }
  h2 {
    font-size: 24px;
    font-weight: 800;
    color: var(--primary);
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 3px solid var(--accent);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  h2 .num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--accent); color: white; font-size: 14px; font-weight: 800;
  }
  h3 { font-size: 17px; font-weight: 700; color: var(--primary-dark); margin: 20px 0 10px; }
  h4 { font-size: 14px; font-weight: 700; color: var(--text); margin: 14px 0 6px; }
  p { margin-bottom: 10px; }

  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 16px 0; }
  .stat { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; }
  .stat .label { font-size: 11px; text-transform: uppercase; color: var(--text-soft); letter-spacing: 0.5px; }
  .stat .value { font-size: 22px; font-weight: 800; color: var(--primary); margin: 4px 0; }
  .stat .sub { font-size: 11px; color: var(--text-soft); }

  .tldr {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-left: 5px solid var(--accent);
    padding: 22px 26px;
    border-radius: 10px;
    margin-bottom: 20px;
  }
  .tldr h3 { color: #78350f; margin-top: 0; font-size: 15px; }
  .tldr ul { list-style: none; padding-left: 0; }
  .tldr li { padding: 5px 0; padding-left: 22px; position: relative; font-size: 14px; }
  .tldr li::before { content: '✦'; position: absolute; left: 0; color: var(--accent); font-weight: 800; }

  .callout {
    background: #fff8e1;
    border-left: 4px solid var(--accent);
    padding: 10px 14px;
    border-radius: 4px;
    font-size: 13px;
    margin: 10px 0;
  }
  .callout.warn { background: #fee2e2; border-left-color: var(--high); }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    margin: 12px 0 20px;
    font-size: 13px;
  }
  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  th {
    background: var(--bg-soft);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--primary-dark);
    font-weight: 700;
  }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  th.num { text-align: right; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tbody tr:hover { background: #ecfdf5; }
  td.kw { font-weight: 600; color: var(--primary-dark); }
  td.cat { font-size: 11px; color: var(--text-soft); }

  .b {
    display: inline-block;
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .b-low { background: #dcfce7; color: var(--low); }
  .b-mid { background: #fef3c7; color: var(--mid); }
  .b-high { background: #fee2e2; color: var(--high); }
  .b-na { background: #f3f4f6; color: var(--text-soft); }

  .cat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .cat-card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
  .cat-card h4 { margin: 0 0 8px; color: var(--primary); font-size: 13px; }
  .cat-card .count { font-size: 10px; color: var(--text-soft); text-transform: uppercase; }
  .cat-card ul { list-style: none; padding: 0; margin: 8px 0 0; }
  .cat-card li { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; border-bottom: 1px dashed #f3f4f6; }
  .cat-card li:last-child { border-bottom: 0; }
  .cat-card li .v { color: var(--text-soft); font-variant-numeric: tabular-nums; }

  .mapping-list { list-style: none; padding: 0; }
  .mapping-list li {
    display: grid;
    grid-template-columns: 200px 1fr auto;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px dashed #e5e7eb;
    font-size: 13px;
    align-items: center;
  }
  .mapping-list .kw { font-weight: 700; color: var(--primary); }
  .mapping-list .page { color: var(--text); }
  .mapping-list .num { color: var(--text-soft); font-size: 12px; }

  .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-soft); text-align: center; }

  @media (max-width: 768px) {
    .hero h1 { font-size: 24px; }
    .toc ol { columns: 1; }
    table { font-size: 11px; }
    th, td { padding: 6px 8px; }
    .mapping-list li { grid-template-columns: 1fr; gap: 4px; }
  }
</style>
</head>
<body>
<div class="container">

<!-- HERO -->
<section class="hero">
  <span class="tag">SEO 전략 · 명작 동화 플랫폼</span>
  <h1>탱고북 명작 동화 SEO 전략</h1>
  <p class="subtitle"><strong>"명작 동화책 플랫폼"</strong> 브랜딩 기준 SEO 리서치. 그림 형제·안데르센·페로·이솝·한국전래·명작 문학·현대 그림책 등 <strong>명작 시드 KR ${krFairy.length}개 / EN ${enFairy.length}개</strong>를 Naver·Google Ads 양쪽으로 측정. <em>디즈니 캐릭터 외 명작 문학·현대 그림책이 최대 광맥</em>.</p>
  <div class="meta">
    <span>📅 데이터 갱신 <strong>${esc(generatedAt)}</strong></span>
    <span>📚 명작 KR <strong>${krFairy.length}</strong> 키워드</span>
    <span>📚 명작 EN <strong>${enFairy.length}</strong> 키워드</span>
    <span>🔬 Naver+Google 교차검증 가능</span>
  </div>
</section>

<!-- TOC -->
<nav class="toc">
  <h3>📋 목차 (명작 메인 / 부록은 후반)</h3>
  <ol>
    <li><a href="#tldr">TL;DR — 명작 SEO 결정사항</a></li>
    <li><a href="#fairy-kr">🌟 명작 카테고리 심화 — 한국</a></li>
    <li><a href="#fairy-en">🌟 명작 카테고리 심화 — 영어/글로벌</a></li>
    <li><a href="#fairy-mapping">명작 콘텐츠 페이지 매핑</a></li>
    <li><a href="#fairy-roadmap">명작 SEO 6개월 로드맵</a></li>
    <li><a href="#method">데이터 출처 & 방법론</a></li>
    <li><a href="#cross">Naver vs Google 교차검증 (전체)</a></li>
    <li><a href="#appendix-kr">부록: 한국 기타 카테고리 (사이드)</a></li>
    <li><a href="#appendix-en">부록: 미국 기타 카테고리 (사이드)</a></li>
    <li><a href="#caveats">데이터 해석 주의사항</a></li>
  </ol>
</nav>

<!-- TL;DR -->
<section id="tldr">
  <h2><span class="num">1</span>TL;DR — 명작 동화 플랫폼 SEO 결정사항</h2>
  <div class="tldr">
    <ul>
      <li><strong>탱고북 = 명작 동화책 플랫폼 브랜딩</strong>. 이번 리서치는 명작 카테고리에 집중 (KR 시드 ${krFairy.length}개, EN ${enFairy.length}개).</li>
      <li><strong>명작 문학이 최대 SEO 광맥</strong> — KR: 보물섬 47k, 작은 아씨들 20k, 소공녀 19k, 어린왕자 18k. EN: wizard of oz 450k, curious george 450k, alice 368k, treasure island 165k. 모두 <em>LOW 경쟁</em>. 디즈니 캐릭터보다 훨씬 잡기 쉬움.</li>
      <li><strong>한국 현대 명작 그림책 무경쟁</strong> — 강아지똥 18k Naver LOW, 구름빵 7.6k MEDIUM. 학부모가 "유사 작품 더 보고 싶다" 의도 → 큐레이션 자석.</li>
      <li><strong>이솝 우화 / 인성 동화 카테고리 광맥</strong> — 청개구리, 금도끼은도끼 등 LOW. 인성교육 시즌 자석 콘텐츠.</li>
      <li><strong>디즈니 캐릭터는 Naver HIGH 경쟁</strong> — 백설공주 / 신데렐라 / 라푼젤은 디즈니 광고 점령. 광고 ROI 낮음 — SEO 콘텐츠로 점진 공략.</li>
      <li><strong>Modern picture books 글로벌 진출 카드</strong> — very hungry caterpillar, where the wild things are, goodnight moon, gruffalo 등 모두 LOW. CPC $0.20~1.00.</li>
      <li><strong>Age-targeted 키워드는 구매 의도 직결</strong> — "books for 5 year olds", "5세 그림책" 등은 학부모 직접 구매 의도 → 가입/구독 전환 ↑.</li>
      <li><strong>알라딘·알리바바 제외</strong> — 중고서적·전자상거래로 의도 점령. 단 "알리바바와 40인의 도둑"은 별도 시드.</li>
    </ul>
  </div>

  <div class="stat-grid">
    <div class="stat"><div class="label">KR 골든 키워드</div><div class="value">${goldKR}</div><div class="sub">Naver/Google LOW 경쟁</div></div>
    <div class="stat"><div class="label">EN 골든 키워드</div><div class="value">${goldEN}</div><div class="sub">Google Ads US LOW</div></div>
    <div class="stat"><div class="label">교차검증된 KR</div><div class="value">${crossKR.length}</div><div class="sub">Naver+Google 둘 다 있음</div></div>
    <div class="stat"><div class="label">Naver 발견 보너스</div><div class="value">${(meta.sources?.naverContent ?? 0).toLocaleString()}</div><div class="sub">시드에서 자동 발굴된 related (별도 마이닝 가능)</div></div>
  </div>
</section>

<!-- FAIRY TALE FOCUS — KR -->
<section id="fairy-kr">
  <h2><span class="num">2</span>🌟 명작 동화 심화 — 한국 시장</h2>
  <p>탱고북 브랜딩이 <strong>동화책 플랫폼</strong>이므로 명작 카테고리만 별도 디테일. 시드 ${krFairy.length}개, Naver+Google 데이터로 5개 서브그룹 정리.</p>
  ${Object.entries(krFairyBy)
    .map(
      ([group, items]) => `
  <h3>${esc(group)} <span style="font-size:11px;color:var(--text-soft);font-weight:400;">(${items.length}개)</span></h3>
  <table>
    <thead><tr><th>#</th><th>키워드</th><th class="num">Naver</th><th>Naver경쟁</th><th class="num">Google</th><th>Google경쟁</th><th class="num">CPC</th></tr></thead>
    <tbody>
${items
  .slice(0, 30)
  .map(
    (r, i) => `      <tr>
        <td class="num">${i + 1}</td>
        <td class="kw">${esc(r.keyword)}</td>
        <td class="num">${fmt(r.naverVolume)}</td>
        <td>${compBadge(r.naverComp)}</td>
        <td class="num">${fmt(r.googleVolume)}</td>
        <td>${compBadge(r.googleComp)}</td>
        <td class="num">${r.googleCpc != null ? r.googleCpc.toFixed(2) : '-'}</td>
      </tr>`,
  )
  .join('\n')}
    </tbody>
  </table>`,
    )
    .join('\n')}

  <div class="callout">
    <strong>📌 명작 카테고리 핵심 발견</strong><br>
    1) <strong>명작 문학 카테고리가 SEO 최대 광맥</strong> — 보물섬 47k, 작은 아씨들 20k, 소공녀 19k, 어린왕자 18k 모두 Naver LOW~MEDIUM. 디즈니 캐릭터(백설/신데렐라) 보다 경쟁 약함.<br>
    2) <strong>한국 현대 명작 그림책 LOW 경쟁</strong> — 강아지똥 18k, 구름빵 7.6k Naver LOW. 이 책 검색하는 학부모는 "유사 작품도 보고 싶다"는 의도.<br>
    3) <strong>이솝 우화·인성 동화 무경쟁</strong> — 청개구리 8.8k, 금도끼은도끼 2.5k 모두 LOW. 인성교육 시즌 자석.<br>
    4) <strong>디즈니 캐릭터는 Naver HIGH 경쟁</strong> — 백설공주/신데렐라/라푼젤 등은 디즈니 영화·뮤지컬 광고 점령. 광고 ROI 낮음, SEO 콘텐츠로 점진 공략.
  </div>
</section>

<!-- FAIRY TALE FOCUS — EN -->
<section id="fairy-en">
  <h2><span class="num">3</span>🌟 명작 동화 심화 — 영어/글로벌</h2>
  <p>시드 ${enFairy.length}개, Google Ads US 단일 데이터. 글로벌 진출 시 최대 자석.</p>
  ${Object.entries(enFairyBy)
    .map(
      ([group, items]) => `
  <h3>${esc(group)} <span style="font-size:11px;color:var(--text-soft);font-weight:400;">(${items.length})</span></h3>
  <table>
    <thead><tr><th>#</th><th>Keyword</th><th class="num">Google Vol</th><th>Comp</th><th class="num">CPC ($)</th></tr></thead>
    <tbody>
${items
  .slice(0, 30)
  .map(
    (r, i) => `      <tr>
        <td class="num">${i + 1}</td>
        <td class="kw">${esc(r.keyword)}</td>
        <td class="num">${fmt(r.googleVolume)}</td>
        <td>${compBadge(r.googleComp)}</td>
        <td class="num">${r.googleCpc != null ? r.googleCpc.toFixed(2) : '-'}</td>
      </tr>`,
  )
  .join('\n')}
    </tbody>
  </table>`,
    )
    .join('\n')}

  <div class="callout">
    <strong>📌 영어 명작 핵심 발견</strong><br>
    1) <strong>Literary classics 카테고리가 진짜 광맥</strong> — wizard of oz 450k, curious george 450k, alice 368k, treasure island 165k 모두 LOW.<br>
    2) <strong>Modern picture books 카테고리 LOW 경쟁</strong> — very hungry caterpillar, where the wild things are, goodnight moon 등 베스트셀러도 LOW.<br>
    3) <strong>Age-targeted 키워드는 강한 의도</strong> — "books for 4 year olds" 등은 학부모가 직접 구매하려는 의도 → 가입 전환↑.<br>
    4) <strong>Aesop fables 카테고리 도덕교육 자석</strong> — "tortoise and the hare", "aesop fables for kids" 모두 LOW.
  </div>
</section>

<!-- FAIRY CONTENT MAPPING -->
<section id="fairy-mapping">
  <h2><span class="num">4</span>명작 콘텐츠 페이지 매핑</h2>
  <p>명작 골든 키워드 → 탱고북에서 어떤 페이지/콘텐츠로 잡을 것인가. 검색의도 → 제품 자석 연결.</p>
  <ul class="mapping-list">
${krFairy
  .slice(0, 20)
  .map((r) => {
    const k = r.keyword;
    const group = classifyFairyKR(k);
    let plan = '';
    if (group === '서양 클래식') plan = `"우리 아이가 ${k} 주인공이 되는 동화" AI 인터랙티브 데모 + 12지신 한글숲 버전 리메이크`;
    else if (group === '한국 전래') plan = `한국 전래 시리즈 페이지 — 원작 + 12지신 IP 리메이크 + 부모님 음성 녹음`;
    else if (group === '이솝 우화') plan = `인성·도덕 동화 큐레이션 — "${k}" 의 교훈 + AI 친구 캐릭터 동화`;
    else if (group === '명작 문학') plan = `명작 문학 페이지 — 원작 줄거리 + 챕터별 AI 큐레이션 + 4~8세 적합 버전`;
    else if (group === '현대 그림책') plan = `한국 현대 명작 큐레이션 — "${k}" 유사 작품 추천 + 작가 인터뷰`;
    else if (group === '검색 의도형') plan = `명작 전집/추천 페이지 — 탱고북 명작 라이브러리 인덱스 + 부모 가이드`;
    else if (group === '연령 타겟') plan = `연령별 명작 큐레이션 — "${k}" 추천 명작 10선 + AI 맞춤 동화`;
    return `    <li>
      <span class="kw">${esc(k)}</span>
      <span class="page">${esc(plan)}</span>
      <span class="num">${fmt(r.naverVolume ?? r.googleVolume)} / ${esc(group)}</span>
    </li>`;
  })
  .join('\n')}
  </ul>
</section>

<!-- FAIRY ROADMAP -->
<section id="fairy-roadmap">
  <h2><span class="num">5</span>명작 SEO 6개월 로드맵</h2>
  <h3>M1-M2 · 명작 허브 구축 (한국)</h3>
  <ul>
    <li><strong>"명작 문학" 카테고리 SEO 페이지 15개 우선</strong> — 보물섬·작은아씨들·소공녀·어린왕자·이상한나라의앨리스·피터팬·오즈의마법사·정글북·하이디·빨강머리앤·톰소여·15소년표류기·소공자·비밀의화원·걸리버여행기. 모두 LOW 경쟁.</li>
    <li>각 페이지: 원작 줄거리 + 4~8세 적합 버전 + "AI로 우리 아이가 주인공인 ${'${원작}'} 만들기" 자석</li>
    <li>한국 현대 그림책(강아지똥·구름빵·달님안녕) 큐레이션 페이지 — 학부모 의도 "유사 작품도 보고 싶다" 충족</li>
  </ul>
  <h3>M3-M4 · 한국 전래/이솝 + 글로벌 명작 영어 페이지 (병행)</h3>
  <ul>
    <li>한국 전래동화 시리즈(흥부놀부·콩쥐팥쥐·해님달님·심청전·견우와직녀·청개구리·금도끼은도끼) — 12지신 IP 리메이크 콘텐츠</li>
    <li>이솝 우화 인성 동화 페이지 — 양치기소년·개미와베짱이·여우와두루미·사자와생쥐 (도덕교육 시즌 자석)</li>
    <li>영어: Literary classics 15개 SEO 페이지 (wizard of oz · curious george · alice in wonderland · treasure island · little women 등) — Google US 진출 시작</li>
  </ul>
  <h3>M5-M6 · 디즈니 캐릭터 + Modern Picture Books 글로벌 확장</h3>
  <ul>
    <li>한국: 디즈니 캐릭터(백설/신데렐라/라푼젤) 페이지 — 광고 ROI 낮으므로 SEO만, "디즈니 vs 명작 비교" 콘텐츠로 트래픽 흡수</li>
    <li>영어: Modern picture books 15개 (very hungry caterpillar · where the wild things are · goodnight moon · brown bear · gruffalo 등)</li>
    <li>Age-targeted 페이지: "5세 그림책 추천", "books for 5 year olds" — 학부모 구매의도 직결 → 가입/구독 전환</li>
  </ul>
</section>

<!-- METHOD -->
<section id="method">
  <h2><span class="num">6</span>데이터 출처 & 방법론</h2>
  <h3>🇰🇷 한국 (이중 측정)</h3>
  <p>
    <strong>Naver 검색광고 API <code>/keywordstool</code></strong> — 명작 시드 ${krFairy.length}개 포함 전체 KR 시드로 호출. 시드 정확 매칭 + Naver 자체 related 발견 (보너스 마이닝). PC·모바일 분리 검색량, 경쟁강도(낮음·중간·높음).<br>
    <strong>DataForSEO Google Ads <code>search_volume/live</code></strong> — 같은 시드를 한국 location(2410)/언어 ko 로 호출. 검색량·LOW/MEDIUM/HIGH 경쟁·CPC·12개월 트렌드.<br>
    두 측정값을 키워드 단위로 머지 → Naver vs Google 비교 가능.
  </p>
  <h3>🇺🇸 미국·글로벌</h3>
  <p>DataForSEO Google Ads 동일 엔드포인트, location 2840(US)/언어 en. 명작 시드 ${enFairy.length}개 포함.</p>
  <h3>골든 기준</h3>
  <p>
    <strong>KR:</strong> (Naver vol ≥ 1,000 AND 경쟁 LOW) OR (Google vol ≥ 5,000 AND 경쟁 LOW).<br>
    <strong>EN:</strong> Google vol ≥ 50,000 AND 경쟁 LOW.
  </p>
  <div class="callout">📁 모든 시드 정의 → <code>docs/marketing/scripts/content-seeds.mjs</code> (한 곳에서 관리)</div>
</section>

<!-- CROSS-VALIDATION -->
<section id="cross">
  <h2><span class="num">7</span>Naver vs Google 교차검증 (전체)</h2>
  <p><strong>핵심 인사이트:</strong> Naver 가 경쟁도를 훨씬 빡빡하게 평가. 같은 키워드 Naver=HIGH, Google=LOW 인 경우 다수. 한국 시장 광고 의사결정은 <em>Naver 기준 보수적</em>으로 가는 게 안전.</p>
  <table>
    <thead><tr>
      <th>키워드</th><th>카테고리</th>
      <th class="num">Naver 검색량</th><th>Naver 경쟁</th>
      <th class="num">Google 검색량</th><th>Google 경쟁</th>
      <th class="num">N/G 비율</th>
    </tr></thead>
    <tbody>
${crossKR
  .slice(0, 30)
  .map(
    (r) => `      <tr>
        <td class="kw">${esc(r.keyword)}</td>
        <td class="cat">${esc(CATEGORY_LABELS_KR[r.category] || r.category)}</td>
        <td class="num">${fmt(r.naverVolume)}</td>
        <td>${compBadge(r.naverComp)}</td>
        <td class="num">${fmt(r.googleVolume)}</td>
        <td>${compBadge(r.googleComp)}</td>
        <td class="num">${ratio(r.naverVolume, r.googleVolume)}</td>
      </tr>`,
  )
  .join('\n')}
    </tbody>
  </table>
</section>

<!-- APPENDIX KR -->
<section id="appendix-kr">
  <h2><span class="num">8</span>부록 · 한국 기타 카테고리 (사이드)</h2>
  <p style="font-size:13px;color:var(--text-soft);">명작 외 카테고리 — 공룡·동물·곤충·탈것·우주·직업·위인·명절·식물·기초학습·페인포인트. 메인 전략은 아니지만 부차적 SEO 자석 후보.</p>
  <div class="cat-grid">
${Object.entries(krCategories)
  .filter(([cat]) => cat !== '_uncategorized' && cat !== 'A_명작동화')
  .map(
    ([cat, info]) => `    <div class="cat-card">
      <h4>${esc(CATEGORY_LABELS_KR[cat] || cat)} <span class="count">(${info.count}개)</span></h4>
      <ul>
${info.top5
  .map(
    (r) => `        <li><span>${esc(r.keyword)}</span> <span class="v">${fmt(r.naverVolume ?? r.googleVolume)}</span></li>`,
  )
  .join('\n')}
      </ul>
    </div>`,
  )
  .join('\n')}
  </div>

  <h3 style="margin-top:24px;">기타 카테고리 통합 골든 TOP 25 (참고용)</h3>
  <table>
    <thead><tr><th>#</th><th>키워드</th><th>카테고리</th><th class="num">Naver</th><th class="num">Google</th><th>경쟁(N/G)</th></tr></thead>
    <tbody>
${(data.KR.golden || [])
  .filter((r) => r.category !== 'A_명작동화' && r.category !== '_uncategorized')
  .slice(0, 25)
  .map(
    (r, i) => `      <tr>
        <td class="num">${i + 1}</td>
        <td class="kw">${esc(r.keyword)}</td>
        <td class="cat">${esc(CATEGORY_LABELS_KR[r.category] || r.category)}</td>
        <td class="num">${fmt(r.naverVolume)}</td>
        <td class="num">${fmt(r.googleVolume)}</td>
        <td>${compBadge(r.naverComp)} / ${compBadge(r.googleComp)}</td>
      </tr>`,
  )
  .join('\n')}
    </tbody>
  </table>
</section>

<!-- APPENDIX EN -->
<section id="appendix-en">
  <h2><span class="num">9</span>부록 · 미국 기타 카테고리 (사이드)</h2>
  <p style="font-size:13px;color:var(--text-soft);">Google Ads US, 명작 외 — Dinosaurs·Animals·Bugs·Vehicles·Space·Jobs·Biographies·Holidays 등.</p>
  <div class="cat-grid">
${Object.entries(enCategories)
  .filter(([cat]) => cat !== '_uncategorized' && cat !== 'A_FairyTales')
  .map(
    ([cat, info]) => `    <div class="cat-card">
      <h4>${esc(CATEGORY_LABELS_EN[cat] || cat)} <span class="count">(${info.count})</span></h4>
      <ul>
${info.top5
  .map(
    (r) => `        <li><span>${esc(r.keyword)}</span> <span class="v">${fmt(r.googleVolume)}</span></li>`,
  )
  .join('\n')}
      </ul>
    </div>`,
  )
  .join('\n')}
  </div>

  <h3 style="margin-top:24px;">기타 카테고리 통합 골든 TOP 25 (참고용)</h3>
  <table>
    <thead><tr><th>#</th><th>Keyword</th><th>Category</th><th class="num">Vol</th><th>Comp</th><th class="num">CPC ($)</th></tr></thead>
    <tbody>
${(data.EN.golden || [])
  .filter((r) => r.category !== 'A_FairyTales' && r.category !== '_uncategorized')
  .slice(0, 25)
  .map(
    (r, i) => `      <tr>
        <td class="num">${i + 1}</td>
        <td class="kw">${esc(r.keyword)}</td>
        <td class="cat">${esc(CATEGORY_LABELS_EN[r.category] || r.category)}</td>
        <td class="num">${fmt(r.googleVolume)}</td>
        <td>${compBadge(r.googleComp)}</td>
        <td class="num">${r.googleCpc != null ? r.googleCpc.toFixed(2) : '-'}</td>
      </tr>`,
  )
  .join('\n')}
    </tbody>
  </table>
</section>

<!-- CAVEATS -->
<section id="caveats">
  <h2><span class="num">10</span>데이터 해석 주의사항</h2>
  <div class="callout warn">
    <strong>⚠️ 다의어 과대평가</strong> — eagle 6.12M, bear 4.09M, peacock 4.09M, 날씨 35.7M 같은 키워드는 키즈 외 의미(NFL팀/스카우트/American Eagle 브랜드/Peacock 스트리밍/Apple Cat/일반 날씨 정보)가 섞임. 광고 타겟 전 SERP 확인.
  </div>
  <div class="callout">
    <strong>📌 알라딘·알리바바 제외</strong> — 한국 검색량 압도적이나 의도가 중고서적 사이트(aladin.co.kr) · 전자상거래(alibaba.com)에 점령. 우리 콘텐츠로 잡을 트래픽 아니라서 통합 분석에서 제외 처리.
  </div>
  <div class="callout">
    <strong>🔄 데이터 갱신</strong> — 어린이날·크리스마스·신학기 시즌 광고 결정 전엔 <code>node docs/marketing/scripts/dataforseo-keyword-research.mjs</code> + <code>naver-content-keyword-research.mjs</code> + <code>consolidate-keywords.mjs</code> 재실행 → 본 페이지 재빌드 권장.
  </div>
</section>

<div class="footer">
  생성: ${esc(generatedAt)} · 데이터: Naver 검색광고 API + DataForSEO Google Ads · 시드: 콘텐츠 단위 200+개 13 카테고리 (KR/EN 각각)
</div>

</div>
</body>
</html>
`;

fs.writeFileSync(OUT_PATH, html, 'utf-8');
console.log(`✅ Saved → ${path.relative(process.cwd(), OUT_PATH)}`);
console.log(`Size: ${(html.length / 1024).toFixed(1)} KB`);
