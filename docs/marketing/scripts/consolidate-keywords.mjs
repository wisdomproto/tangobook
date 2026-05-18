#!/usr/bin/env node
// 모든 데이터 소스를 통합해 메인 키워드 / 골든 키워드로 재정리.
// 입력:
//   - data/naver-analyzed.json (기존 4,024개 Naver 카테고리 키워드 분석)
//   - data/naver-content-raw.json (선택: 신규 콘텐츠 시드 Naver 결과 — 있으면 합침)
//   - data/dataforseo-kr.json (신규 콘텐츠 시드 Google Ads KR)
//   - data/dataforseo-en.json (신규 콘텐츠 시드 Google Ads US)
// 출력:
//   - data/consolidated-keywords.json
//   - data/consolidated-summary.md (사람이 읽기 좋은 요약)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCategoryKR, findCategoryEN, KR_SEEDS, KR_SEEDS_BY_CATEGORY, EN_SEEDS_BY_CATEGORY } from './content-seeds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

function readJSON(name) {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// 다의어 노이즈: 같은 표기가 명확히 다른 상업적 검색의도로 점령된 키워드 — 통합에서 제외.
const EXCLUDE_KR = new Set(['알라딘', '알리바바']);

const naverAnalyzed = readJSON('naver-analyzed.json');           // 기존 카테고리 키워드
const naverContent = readJSON('naver-content-raw.json');          // 신규 콘텐츠 (선택)
const dataforseoKR = readJSON('dataforseo-kr.json');              // Google Ads KR
const dataforseoEN = readJSON('dataforseo-en.json');              // Google Ads US

// ─── 정규화 ────────────────────────────────────────────────────────
// 통일된 형태: { keyword, source, market, totalVolume, competitionRaw, competitionLevel, cpc, category, intentRelevance }
//   competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH'

function normalizeNaverComp(raw) {
  if (raw === '낮음' || raw === 'LOW' || raw === 'low') return 'LOW';
  if (raw === '중간' || raw === 'MEDIUM' || raw === 'medium') return 'MEDIUM';
  if (raw === '높음' || raw === 'HIGH' || raw === 'high') return 'HIGH';
  return raw ?? 'UNKNOWN';
}

function fromNaverItem(it, srcLabel) {
  return {
    keyword: it.keyword,
    source: srcLabel,
    market: 'KR',
    totalVolume: it.totalVolume ?? 0,
    pcVolume: it.pcVolume ?? 0,
    mobileVolume: it.mobileVolume ?? 0,
    competitionRaw: it.competition,
    competitionLevel: normalizeNaverComp(it.competition),
    cpc: null,
    category: it.category ?? findCategoryKR(it.keyword) ?? '_uncategorized',
  };
}

function fromDFSItem(it, market) {
  return {
    keyword: it.keyword,
    source: market === 'KR' ? 'GoogleAds(KR)' : 'GoogleAds(US)',
    market,
    totalVolume: it.searchVolume ?? 0,
    pcVolume: null,
    mobileVolume: null,
    competitionRaw: it.competition,
    competitionLevel: it.competition ?? 'UNKNOWN',
    cpc: it.cpc ?? 0,
    category:
      market === 'KR'
        ? findCategoryKR(it.keyword) ?? '_uncategorized'
        : findCategoryEN(it.keyword) ?? '_uncategorized',
  };
}

// ─── 데이터 수집 ────────────────────────────────────────────────────
const krRows = [];
const enRows = [];

if (naverAnalyzed?.goldKeywords) {
  for (const it of naverAnalyzed.goldKeywords) {
    if (EXCLUDE_KR.has(it.keyword)) continue;
    krRows.push(fromNaverItem(it, 'Naver(category-gold)'));
  }
}

// Naver content: 시드 정확 매칭만 메인에 사용 (related 발견은 보너스 파일로 분리)
const seedSetNoSpace = new Set(KR_SEEDS.map((s) => s.replace(/\s+/g, '')));
const naverSeedMatches = [];
const naverDiscoveredBonus = [];
if (naverContent?.keywords) {
  for (const it of naverContent.keywords) {
    if (EXCLUDE_KR.has(it.keyword)) continue;
    if (seedSetNoSpace.has((it.keyword || '').replace(/\s+/g, ''))) {
      naverSeedMatches.push(it);
      krRows.push(fromNaverItem(it, 'Naver(content)'));
    } else {
      naverDiscoveredBonus.push(it);
    }
  }
}
if (dataforseoKR?.keywords) {
  // 사전에 raw에서 제외 — 아래 일반 push 루프 막기 위해 dataforseoKR 객체를 필터링한 사본으로 교체
  dataforseoKR.keywords = dataforseoKR.keywords.filter((it) => !EXCLUDE_KR.has(it.keyword));
}
if (dataforseoKR?.keywords) {
  for (const it of dataforseoKR.keywords) krRows.push(fromDFSItem(it, 'KR'));
}
if (dataforseoEN?.keywords) {
  for (const it of dataforseoEN.keywords) enRows.push(fromDFSItem(it, 'US'));
}

// ─── 교차검증: 한국어 키워드를 Naver 와 Google 둘 다 가지면 병합 ───
// merge by keyword (정규화: 공백 제거 + lowercase)
function normKey(k) {
  return (k || '').replace(/\s+/g, '').toLowerCase();
}

const krMerged = new Map(); // key: normKey, value: merged row
for (const r of krRows) {
  const k = normKey(r.keyword);
  const existing = krMerged.get(k);
  if (!existing) {
    krMerged.set(k, {
      keyword: r.keyword,
      market: 'KR',
      category: r.category,
      naverVolume: null,
      googleVolume: null,
      naverComp: null,
      googleComp: null,
      googleCpc: null,
      sources: [],
    });
  }
  const m = krMerged.get(k);
  m.sources.push(r.source);
  if (r.category && r.category !== '_uncategorized') m.category = r.category;
  if (r.source.startsWith('Naver')) {
    if (m.naverVolume == null || r.totalVolume > m.naverVolume) {
      m.naverVolume = r.totalVolume;
      m.naverComp = r.competitionLevel;
    }
  } else if (r.source.startsWith('GoogleAds')) {
    m.googleVolume = r.totalVolume;
    m.googleComp = r.competitionLevel;
    m.googleCpc = r.cpc;
  }
}

const krRecords = [...krMerged.values()];

// EN: just from dataforseo
const enRecords = enRows.map((r) => ({
  keyword: r.keyword,
  market: 'US',
  category: r.category,
  googleVolume: r.totalVolume,
  googleComp: r.competitionLevel,
  googleCpc: r.cpc,
  sources: [r.source],
}));

// ─── Main/Golden 분류 ─────────────────────────────────────────────
// Main = volume top X across category
// Golden = high volume × LOW competition
//   KR Naver: volume >= 1000, competition = '낮음'/LOW
//   KR Google: volume >= 5000, competition = LOW
//   EN Google: volume >= 50000, competition = LOW

function pickBestVolume(rec) {
  // Prefer Naver number when available (네이버 검색은 한국 학부모 행동 더 정확하게 반영하는 경향)
  if (rec.market === 'KR' && rec.naverVolume != null) return { volume: rec.naverVolume, by: 'Naver' };
  if (rec.googleVolume != null) return { volume: rec.googleVolume, by: 'Google' };
  return { volume: 0, by: 'NA' };
}

function isGoldenKR(rec) {
  if (rec.naverVolume != null && rec.naverVolume >= 1000 && rec.naverComp === 'LOW') return true;
  if (rec.googleVolume != null && rec.googleVolume >= 5000 && rec.googleComp === 'LOW') return true;
  return false;
}
function isGoldenEN(rec) {
  return rec.googleVolume != null && rec.googleVolume >= 50000 && rec.googleComp === 'LOW';
}

// Sort by best volume desc
krRecords.sort((a, b) => pickBestVolume(b).volume - pickBestVolume(a).volume);
enRecords.sort((a, b) => (b.googleVolume ?? 0) - (a.googleVolume ?? 0));

// ─── 출력 JSON ────────────────────────────────────────────────────
const consolidated = {
  meta: {
    generatedAt: new Date().toISOString(),
    sources: {
      naverCategoryGold: naverAnalyzed?.goldKeywords?.length ?? 0,
      naverContent: naverContent?.keywords?.length ?? 0,
      googleAdsKR: dataforseoKR?.keywords?.length ?? 0,
      googleAdsEN: dataforseoEN?.keywords?.length ?? 0,
    },
    notes: [
      'KR: Naver 우선, 없을 때 Google Ads(KR) 값 사용. Naver/Google 모두 있는 키워드는 양쪽 모두 표기 — 교차검증.',
      'EN: Google Ads(US) 단일 소스. Naver 데이터 없음.',
      'Golden 기준 — KR: Naver vol≥1k & LOW, 또는 Google vol≥5k & LOW. EN: Google vol≥50k & LOW.',
      'Google Ads 데이터는 광고 매칭형이라 검색의도가 분산된 다의어(eagle, bear 등)는 볼륨이 과대평가될 수 있음.',
    ],
  },
  KR: {
    total: krRecords.length,
    main: krRecords.slice(0, 50),
    golden: krRecords.filter(isGoldenKR),
    byCategory: groupByCategory(krRecords, 'KR'),
  },
  EN: {
    total: enRecords.length,
    main: enRecords.slice(0, 50),
    golden: enRecords.filter(isGoldenEN),
    byCategory: groupByCategory(enRecords, 'EN'),
  },
};

function groupByCategory(records, market) {
  const out = {};
  const catLabels = market === 'KR' ? Object.keys(KR_SEEDS_BY_CATEGORY) : Object.keys(EN_SEEDS_BY_CATEGORY);
  for (const cat of [...catLabels, '_uncategorized']) {
    const items = records.filter((r) => r.category === cat);
    if (items.length === 0) continue;
    out[cat] = {
      count: items.length,
      top5: items.slice(0, 5),
    };
  }
  return out;
}

fs.writeFileSync(path.join(DATA_DIR, 'consolidated-keywords.json'), JSON.stringify(consolidated, null, 2));

// 별도: Naver 발견 보너스 키워드 (시드와 매칭 안 되지만 Naver가 related 로 가져온 것)
// 광고/SEO 마이닝 후속 작업용 — 검색의도 관련성 수동 필터 권장
if (naverDiscoveredBonus.length > 0) {
  const sorted = [...naverDiscoveredBonus].sort((a, b) => (b.totalVolume ?? 0) - (a.totalVolume ?? 0));
  fs.writeFileSync(
    path.join(DATA_DIR, 'naver-discovered-bonus.json'),
    JSON.stringify(
      {
        meta: {
          note: 'Naver API 가 시드 외에 발견한 related 키워드. 검색의도 직접 검증 필요.',
          count: sorted.length,
          generatedAt: new Date().toISOString(),
        },
        keywords: sorted,
      },
      null,
      2,
    ),
  );
}

// 교차검증: Naver+Google 양쪽 데이터가 모두 있는 키워드만 추출
const crossValidated = krRecords
  .filter((r) => r.naverVolume != null && r.googleVolume != null)
  .sort((a, b) => (b.naverVolume ?? 0) - (a.naverVolume ?? 0));

// ─── Markdown 요약 ─────────────────────────────────────────────────
function fmtVol(v) {
  if (v == null) return '-';
  return v.toLocaleString();
}
function rowKR(r) {
  const best = pickBestVolume(r);
  return `| ${r.keyword} | ${r.category} | ${fmtVol(r.naverVolume)} | ${r.naverComp ?? '-'} | ${fmtVol(r.googleVolume)} | ${r.googleComp ?? '-'} | ${r.googleCpc != null ? r.googleCpc.toFixed(2) : '-'} | ${best.by} |`;
}
function rowEN(r) {
  return `| ${r.keyword} | ${r.category} | ${fmtVol(r.googleVolume)} | ${r.googleComp ?? '-'} | $${(r.googleCpc ?? 0).toFixed(2)} |`;
}

const md = [];
md.push('# 탱고북 키워드 통합 분석 (Main + Golden)');
md.push(`\n*생성일: ${new Date().toISOString().slice(0, 10)}*\n`);
md.push(`**소스:** Naver 카테고리 골든 ${consolidated.meta.sources.naverCategoryGold}개 + Naver 콘텐츠 시드매칭 ${naverSeedMatches.length}개 (+ Naver 발견 보너스 ${naverDiscoveredBonus.length}개 별도) + Google Ads KR ${consolidated.meta.sources.googleAdsKR}개 + Google Ads US ${consolidated.meta.sources.googleAdsEN}개\n`);
md.push(`**교차검증 가능 (Naver+Google 양쪽 데이터 보유):** ${crossValidated.length}개\n`);
md.push('**주의:** Google Ads 데이터는 광고 매칭형이라 다의어(eagle, bear, 날씨 등)는 검색의도 분산으로 볼륨이 과대평가될 수 있음. 광고/SEO 결정 전에 검색결과 직접 확인 권장.\n');

if (crossValidated.length > 0) {
  md.push('\n### 🔬 교차검증 TOP 30 (Naver vs Google, 한국 시장)\n');
  md.push('| 키워드 | 카테고리 | Naver | Naver경쟁 | Google | Google경쟁 | Naver/Google 비율 |');
  md.push('|---|---|---:|---|---:|---|---:|');
  for (const r of crossValidated.slice(0, 30)) {
    const ratio = r.googleVolume > 0 ? (r.naverVolume / r.googleVolume).toFixed(2) : '∞';
    md.push(`| ${r.keyword} | ${r.category} | ${fmtVol(r.naverVolume)} | ${r.naverComp ?? '-'} | ${fmtVol(r.googleVolume)} | ${r.googleComp ?? '-'} | ${ratio}× |`);
  }
}

md.push('\n## 🇰🇷 한국 시장\n');
md.push(`전체 ${krRecords.length}개 키워드, 골든 ${consolidated.KR.golden.length}개\n`);
md.push('\n### 🏆 골든 키워드 (KR)\n');
md.push('| 키워드 | 카테고리 | Naver | Naver경쟁 | Google | Google경쟁 | CPC | 우선 |');
md.push('|---|---|---:|---|---:|---|---:|---|');
for (const r of consolidated.KR.golden.slice(0, 50)) md.push(rowKR(r));

md.push('\n### 📊 메인 키워드 TOP 30 (KR, 볼륨 기준)\n');
md.push('| 키워드 | 카테고리 | Naver | Naver경쟁 | Google | Google경쟁 | CPC | 우선 |');
md.push('|---|---|---:|---|---:|---|---:|---|');
for (const r of consolidated.KR.main.slice(0, 30)) md.push(rowKR(r));

md.push('\n### 📁 카테고리별 KR TOP 5\n');
for (const [cat, info] of Object.entries(consolidated.KR.byCategory)) {
  md.push(`\n**${cat}** (${info.count}개)`);
  md.push('| 키워드 | Naver | Google | CPC |');
  md.push('|---|---:|---:|---:|');
  for (const r of info.top5) {
    md.push(`| ${r.keyword} | ${fmtVol(r.naverVolume)} | ${fmtVol(r.googleVolume)} | ${r.googleCpc != null ? r.googleCpc.toFixed(2) : '-'} |`);
  }
}

md.push('\n\n## 🇺🇸 미국 시장 (글로벌)\n');
md.push(`전체 ${enRecords.length}개 키워드, 골든 ${consolidated.EN.golden.length}개\n`);
md.push('\n### 🏆 골든 키워드 (EN)\n');
md.push('| Keyword | Category | Google Vol | Comp | CPC |');
md.push('|---|---|---:|---|---:|');
for (const r of consolidated.EN.golden.slice(0, 50)) md.push(rowEN(r));

md.push('\n### 📊 메인 키워드 TOP 30 (EN, 볼륨 기준)\n');
md.push('| Keyword | Category | Google Vol | Comp | CPC |');
md.push('|---|---|---:|---|---:|');
for (const r of consolidated.EN.main.slice(0, 30)) md.push(rowEN(r));

md.push('\n### 📁 카테고리별 EN TOP 5\n');
for (const [cat, info] of Object.entries(consolidated.EN.byCategory)) {
  md.push(`\n**${cat}** (${info.count}개)`);
  md.push('| Keyword | Vol | Comp | CPC |');
  md.push('|---|---:|---|---:|');
  for (const r of info.top5) {
    md.push(`| ${r.keyword} | ${fmtVol(r.googleVolume)} | ${r.googleComp ?? '-'} | $${(r.googleCpc ?? 0).toFixed(2)} |`);
  }
}

fs.writeFileSync(path.join(DATA_DIR, 'consolidated-summary.md'), md.join('\n'));

console.log('========================================');
console.log('통합 분석 완료');
console.log('========================================');
console.log(`KR 키워드: ${krRecords.length}개 (골든 ${consolidated.KR.golden.length}, 메인 TOP50)`);
console.log(`EN 키워드: ${enRecords.length}개 (골든 ${consolidated.EN.golden.length}, 메인 TOP50)`);
console.log('\n출력:');
console.log('  - data/consolidated-keywords.json');
console.log('  - data/consolidated-summary.md');
