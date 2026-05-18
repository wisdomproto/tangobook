#!/usr/bin/env node
// (A) 골든 키워드 노이즈 감사 + (C) Naver 발견 보너스 마이닝.
// 입력: data/consolidated-keywords.json, data/naver-discovered-bonus.json
// 출력: data/audit-report.md (사람이 검토할 의사결정 자료)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCategoryKR, KR_SEEDS } from './content-seeds.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

const consolidated = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'consolidated-keywords.json'), 'utf-8'));
const bonus = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'naver-discovered-bonus.json'), 'utf-8'));

// ============================================================
// (A) 노이즈 감사 — KR 골든 키워드
// ============================================================
// 휴리스틱:
//  - HIGH 경쟁 (Naver or Google) → 상업적 의도 강함
//  - 짧은 단어 (≤3자) → 다의어 가능성 ↑
//  - 일반 명사 (펫/탈것 등) → 상업 광고 점령 가능
//  - 위인/명절/꽃이름 등 구체적 엔티티 → 노이즈 위험 낮음

// 신뢰 유지 카테고리: 검색 의도가 학습/콘텐츠로 명확
const SAFE_CATEGORIES = new Set([
  'H_위인',           // 세종대왕, 이순신 — 학부모 교육 의도
  'D_곤충',           // 곤충 이름은 도감/관찰 의도
  'I_명절_계절',      // 명절은 콘텐츠/이미지 의도 강함
  'A_명작동화',       // 캐릭터 = 동화 의도 강함 (단 디즈니 영화 혼재 가능)
]);

// 카테고리는 안전하지만 단어 자체가 일반 상업명사인 경우
const COMMERCIAL_NOUN_PATTERN =
  /^(강아지|고양이|토끼|햄스터|거북이|자동차|버스|기차|비행기|배|꽃|장미|튤립|민들레|해바라기|일|잠|영어|숫자|알파벳|치아|뼈|소화|바다|날씨|곰|상어|돌고래|판다|코끼리|사자|호랑이|기린|북극곰|펭귄|늑대|여우|사슴|다람쥐|원숭이|고릴라|침팬지|독수리|부엉이|앵무새|공작|개미|나비|벌|거미|매미|메뚜기|거짓말|편식)$/;

function analyzeKeyword(rec) {
  const k = rec.keyword;
  const reasons = [];
  let score = 0; // 노이즈 의심 점수 (높을수록 의심)

  // Safe category → 거의 통과
  if (SAFE_CATEGORIES.has(rec.category)) {
    return { decision: 'KEEP', score: 0, reasons: [`안전 카테고리(${rec.category})`], variants: [] };
  }

  // HIGH 경쟁 표시
  if (rec.naverComp === 'HIGH') {
    score += 3;
    reasons.push('Naver 경쟁 HIGH (상업 광고 점령 신호)');
  }
  if (rec.googleComp === 'HIGH') {
    score += 2;
    reasons.push('Google 경쟁 HIGH');
  }
  // 일반 상업 명사
  if (COMMERCIAL_NOUN_PATTERN.test(k)) {
    score += 3;
    reasons.push('일반 상업 명사 (펫푸드/자동차/제품광고 등 의도 혼재)');
  }
  // 매우 짧은 단어
  if (k.length <= 2) {
    score += 1;
    reasons.push('짧은 단어 (다의어 가능)');
  }
  // 매우 큰 검색량 (>200k) + 짧은 일반명사 → 거의 확실히 다의어
  const bigVol = Math.max(rec.naverVolume ?? 0, rec.googleVolume ?? 0);
  if (bigVol > 200_000 && COMMERCIAL_NOUN_PATTERN.test(k)) {
    score += 3;
    reasons.push(`초대형 검색량(${bigVol.toLocaleString()}) — 키즈 외 의미 우세`);
  }

  // 변형 시드 자동 생성 (제외 대신 정제 재조사)
  const variants = COMMERCIAL_NOUN_PATTERN.test(k)
    ? [`${k} 그림책`, `${k} 동화`, `${k} 책`, `${k} 만화`].filter((v) => !KR_SEEDS.includes(v))
    : [];

  let decision;
  if (score >= 5) decision = 'REPLACE_WITH_VARIANT'; // 강한 노이즈 — 변형 사용 권장
  else if (score >= 3) decision = 'VERIFY_SERP';     // 약한 의심 — SERP 확인 권장
  else decision = 'KEEP';

  return { decision, score, reasons, variants };
}

const krGoldRecords = consolidated.KR.golden || [];
const auditResults = krGoldRecords.map((r) => ({ rec: r, ...analyzeKeyword(r) }));

const replaceList = auditResults.filter((a) => a.decision === 'REPLACE_WITH_VARIANT');
const verifyList = auditResults.filter((a) => a.decision === 'VERIFY_SERP');
const keepList = auditResults.filter((a) => a.decision === 'KEEP');

// ============================================================
// (C) 발견 보너스 마이닝 — 키즈 인텐트 자동 필터
// ============================================================
// 포함 시그널 (키즈 인텐트 마커)
const KIDS_SIGNALS =
  /(동화|그림책|만화|캐릭터|동요|노래|유아|어린이|아기|아이|초등|색칠|놀이|학습지|어휘|독서|읽기|쓰기|숫자|알파벳|한글|파닉스|영어|책추천|책|이야기|도감|관찰|키즈|4세|5세|6세|7세|8세|9세|10세|초1|초2|초3|동물|곤충|공룡|위인|꽃|식물|탈것|우주|행성|별자리)/;

// 제외 패턴 (확실히 노이즈)
const NOISE_PATTERNS = [
  /주식|채권|연봉|채용|호텔|항공권|예매|예약|가격|할인|쿠폰|모텔|투어|숙소|맛집|카페|식당|배달|중고|아파트|부동산|전세|월세|이사|병원|치과|약국/,
  /축제|행사|콘서트|뮤지컬|연예|영화|드라마|배우|가수|아이돌|넷플릭스|디즈니플러스|넷마블/,
  /현대차|기아|아반떼|쏘나타|그랜저|제네시스|렉서스|벤츠|BMW|아우디|폭스바겐|타타대우|볼보|포드/,
  /(맛집|놀거리|가볼만한곳|여행|관광|민박|펜션|글램핑|캠핑장)/,
  /음식점|레스토랑|메뉴|레시피|요리법/,
  /운세|사주|타로|점|꿈해몽|연예운|토정|신점/,
  /(주가|코스피|코스닥|배당|상장|투자|증권)/,
  /KTX|SRT|기차표|버스표|항공/,
  /(전기차|중고차|렌트카|법인차|차값|중고차매매)/,
  /(보험|카드|대출|적금|예금|보험료|연금)/,
  /(게임|코인|비트코인|가상자산|nft)/i,
  /(부동산|매매|분양|청약|입주)/,
  /(자녀학원|학원비|학원원장|학원장)/, // 학원 운영자 의도 (학부모 학습 의도 아님)
  /(스승의날|어버이날|어린이날선물|어린이날행사|운동회)/, // 명절 자체보다 이벤트 트래픽
  /(부천대|장안대|한경대|대구대|영남대|순천대|동국대|연세대|고려대|서강대|성균관대)/, // 대학교
];

function passesKidsFilter(item) {
  const k = item.keyword || '';
  if (k.length < 2 || k.length > 20) return false;
  if (item.competition !== '낮음') return false;
  if ((item.totalVolume ?? 0) < 2000) return false;
  for (const p of NOISE_PATTERNS) if (p.test(k)) return false;
  // 카테고리 자동분류 매칭 OR 명시적 키즈 시그널 (둘 중 하나)
  const cat = categorizeBonus(k);
  const hasKidsSignal = KIDS_SIGNALS.test(k);
  return cat !== '_uncategorized' || hasKidsSignal;
}

const filteredBonus = (bonus.keywords || []).filter(passesKidsFilter);
filteredBonus.sort((a, b) => (b.totalVolume ?? 0) - (a.totalVolume ?? 0));

// 카테고리 자동 분류 시도
function categorizeBonus(kw) {
  if (/공룡|티라노|브라키오|트리|스테고|벨로키|랍토르|랍토|프테라/.test(kw)) return 'B_공룡';
  if (/동물|사자|호랑이|코끼리|기린|판다|곰|펭귄|강아지|고양이|토끼|햄스터|거북|늑대|여우|사슴|다람쥐|코알라|캥거루|원숭이|고릴라|침팬|상어|고래|돌고래|문어|독수리|부엉이|앵무|공작/.test(kw))
    return 'C_동물';
  if (/곤충|나비|개미|벌레|풍뎅이|무당|잠자리|매미|거미|메뚜기|귀뚜라미|반딧|벌(?!꿀)/.test(kw)) return 'D_곤충';
  if (/자동차|기차|비행기|로켓|소방차|구급차|경찰차|포크레인|굴착기|덤프|버스|지하철|잠수함|헬리|트럭/.test(kw)) return 'E_탈것';
  if (/우주|태양|행성|달|별|블랙홀|화성|목성|토성|화산|지진|무지개|구름|날씨/.test(kw)) return 'F_우주_자연';
  if (/소방관|경찰관|의사|간호사|요리사|우주비행|수의사|농부|선생님|직업/.test(kw)) return 'G_직업';
  if (/세종|이순신|안중근|유관순|신사임당|헬렌|에디슨|라이트|마더|간디|슈바이처|뉴턴|아인슈타인|위인|장영실|허준/.test(kw))
    return 'H_위인';
  if (/추석|설날|단오|동지|크리스마스|할로윈|어린이날|어버이날|스승의날|성탄|연휴|명절/.test(kw)) return 'I_명절_계절';
  if (/꽃|장미|튤립|민들레|해바라기|채소|과일|나무|식물|허브/.test(kw)) return 'J_식물_먹거리';
  if (/감정|화|슬픔|두려움|마음|배려|용기|친구|형제|동생/.test(kw)) return 'K_신체_감정';
  if (/알파벳|숫자|색깔|도형|한글|파닉스|영어|읽기|쓰기|어휘/.test(kw)) return 'L_기초학습';
  if (/명작|전래|동화|그림책|민화/.test(kw)) return 'A_명작동화';
  return '_uncategorized';
}

const bonusByCategory = {};
for (const item of filteredBonus) {
  const cat = categorizeBonus(item.keyword);
  if (!bonusByCategory[cat]) bonusByCategory[cat] = [];
  bonusByCategory[cat].push(item);
}

// ============================================================
// 출력 마크다운 보고서
// ============================================================
const md = [];
md.push('# 노이즈 감사(A) + 발견 보너스 마이닝(C) 보고서\n');
md.push(`*생성일: ${new Date().toISOString().slice(0, 10)}*\n`);

// (A)
md.push('## A. KR 골든 키워드 노이즈 감사\n');
md.push(`전체 ${krGoldRecords.length}개 → REPLACE 권장 ${replaceList.length}, VERIFY 권장 ${verifyList.length}, KEEP ${keepList.length}\n`);

md.push('\n### 🚨 REPLACE_WITH_VARIANT — 즉시 변형 시드로 교체 권장 (${count}개)\n'.replace('${count}', replaceList.length));
md.push('Naver/Google HIGH 경쟁 + 일반 상업 명사 + 초대형 검색량 = 키즈 외 의도 우세. 같은 단어 raw 로는 광고/SEO 비효율. 변형 시드로 재조사 필요.\n');
md.push('| 키워드 | Naver | Google | 점수 | 사유 | 변형 시드 제안 |');
md.push('|---|---:|---:|---:|---|---|');
for (const a of replaceList) {
  md.push(
    `| ${a.rec.keyword} | ${(a.rec.naverVolume ?? 0).toLocaleString()} (${a.rec.naverComp ?? '-'}) | ${(a.rec.googleVolume ?? 0).toLocaleString()} (${a.rec.googleComp ?? '-'}) | ${a.score} | ${a.reasons.join('; ')} | ${a.variants.join(', ') || '-'} |`,
  );
}

md.push(`\n### ⚠️ VERIFY_SERP — SERP 직접 확인 후 결정 (${verifyList.length}개)\n`);
md.push('| 키워드 | Naver | Google | 점수 | 사유 |');
md.push('|---|---:|---:|---:|---|');
for (const a of verifyList) {
  md.push(
    `| ${a.rec.keyword} | ${(a.rec.naverVolume ?? 0).toLocaleString()} (${a.rec.naverComp ?? '-'}) | ${(a.rec.googleVolume ?? 0).toLocaleString()} (${a.rec.googleComp ?? '-'}) | ${a.score} | ${a.reasons.join('; ')} |`,
  );
}

md.push(`\n### ✅ KEEP — 검색 의도 명확 (${keepList.length}개, 상위 20 일부)\n`);
md.push('| 키워드 | 카테고리 | Naver | Google |');
md.push('|---|---|---:|---:|');
for (const a of keepList.slice(0, 20)) {
  md.push(
    `| ${a.rec.keyword} | ${a.rec.category} | ${(a.rec.naverVolume ?? 0).toLocaleString()} | ${(a.rec.googleVolume ?? 0).toLocaleString()} |`,
  );
}

// (C)
md.push('\n\n## C. Naver 발견 보너스 마이닝\n');
md.push(`원본 ${(bonus.keywords || []).length}개 → 키즈 인텐트 필터 통과 ${filteredBonus.length}개\n`);
md.push('\n필터 조건: 경쟁 낮음 AND vol ≥ 2,000 AND (키즈 시그널 매칭) AND (노이즈 패턴 제외)\n');

md.push('\n### 🎯 TOP 50 신규 추천 시드 (키즈 인텐트 자동 검출)\n');
md.push('| 키워드 | 추정 카테고리 | PC | 모바일 | 총 |');
md.push('|---|---|---:|---:|---:|');
for (const item of filteredBonus.slice(0, 50)) {
  const cat = categorizeBonus(item.keyword);
  md.push(
    `| ${item.keyword} | ${cat} | ${item.pcVolume.toLocaleString()} | ${item.mobileVolume.toLocaleString()} | ${item.totalVolume.toLocaleString()} |`,
  );
}

md.push('\n### 📁 카테고리별 발견 보너스 추천 시드\n');
for (const [cat, items] of Object.entries(bonusByCategory)) {
  md.push(`\n**${cat}** (${items.length}개)`);
  md.push('| 키워드 | 총 |');
  md.push('|---|---:|');
  for (const it of items.slice(0, 10)) md.push(`| ${it.keyword} | ${it.totalVolume.toLocaleString()} |`);
}

md.push('\n\n## 📌 권장 액션\n');
md.push('1. **REPLACE_WITH_VARIANT 목록의 원본 단어는 EXCLUDE_KR 에 추가** — consolidate 에서 제외');
md.push('2. **변형 시드 (X 그림책 / X 동화)를 content-seeds.mjs 에 추가** — 키즈 정제 재조사');
md.push('3. **VERIFY 목록은 사람이 SERP 직접 확인 후** 결정 (수동 작업)');
md.push('4. **마이닝 TOP 50 시드 후보 중 검토 후 추가** — 카테고리 기존 시드와 중복 없는 것 우선');
md.push('5. 위 변경 후 `dataforseo + naver-content + consolidate + generate-seo-html` 재실행');

const outPath = path.join(DATA_DIR, 'audit-report.md');
fs.writeFileSync(outPath, md.join('\n'));
console.log(`✅ Saved → ${path.relative(process.cwd(), outPath)}`);
console.log(`\n요약:`);
console.log(`  (A) REPLACE: ${replaceList.length}, VERIFY: ${verifyList.length}, KEEP: ${keepList.length}`);
console.log(`  (C) 필터 통과: ${filteredBonus.length} (원본 ${(bonus.keywords || []).length}개 중)`);
