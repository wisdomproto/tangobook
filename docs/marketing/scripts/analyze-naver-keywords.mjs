#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const RAW_PATH = path.join(DATA_DIR, 'naver-keywords-raw.json');
const OUT_PATH = path.join(DATA_DIR, 'naver-analyzed.json');

const data = JSON.parse(fs.readFileSync(RAW_PATH, 'utf-8'));

// 관련 키워드 필터 - 우리 제품 도메인에 해당하는 키워드만 추출
const RELEVANT_PATTERNS = [
  // 영어 학습
  /영어/, /파닉스/, /phonics/i, /english/i, /알파벳/, /^abc/i,
  // 한글 학습
  /한글/, /가나다/,
  // 동화/도서/그림책
  /동화/, /그림책/, /이야기책/, /창작동화/, /명작동화/, /전래/, /오디오북/, /읽기/,
  // 유아/어린이 학습
  /유아.*학습/, /어린이.*학습/, /학습지/, /홈스쿨/, /엄마표/, /자기주도/, /문해력/, /독서/, /언어.*발달/,
  // 연령/대상
  /4세/, /5세/, /6세/, /7세/, /8세/, /유치원/, /어린이집/, /초등.*[1-2]/, /유아.*교/,
  // 키즈 콘텐츠/앱
  /키즈.*앱/, /어린이.*앱/, /유아.*앱/, /^키즈/, /^어린이/, /^유아/,
  // 경쟁사 브랜드
  /호두/, /핑크퐁/, /리딩게이트/, /리딩앤/, /야미야미/, /똑똑한.*하루/, /윙크/, /리딩에그/, /abcmouse/i,
  /라이브러리/, /다섯/, /토마토/, /빨간펜/, /구몬/, /눈높이/, /웅진/, /천재교육/,
  // 키워드 기타
  /사이트워드/, /sight.*word/i, /읽기.*독립/, /기초.*어휘/, /파닉스.*교재/,
];

// 명백히 무관한 키워드 제외 패턴
const EXCLUDE_PATTERNS = [
  /번역기/, /타자연습/, /국어사전/, /영어사전/, /해석기/, /번역\s*$/, /^번역/,
  /뮤지컬/, /안경점/, /베이비페어/, /수능/, /^수학/, /수학학원/, /구구단/,
  /웹소설/, /논문/, /자격증/, /토익/, /토플/, /수능/, /고등/, /대학/, /입시/, /인강/,
  /^신생아/, /출산/, /임신/, /아기체육관/, /^아기상어/, /돌잔치/, /돌선물/, /백일/,
  /산후/, /산모/, /태교/, /육아용품/, /유모차/, /기저귀/, /분유/, /이유식/, /^젖/,
  /성인/, /^어른/, /직장인/, /대학생/, /고등학생/, /^중[0-9]/, /^고[0-9]/, /시험/,
  /게임\s*추천/, /방송/, /드라마/, /^영화/,
];

function isRelevant(kw) {
  if (EXCLUDE_PATTERNS.some((p) => p.test(kw))) return false;
  return RELEVANT_PATTERNS.some((p) => p.test(kw));
}

// 점수: 검색량 × 경쟁계수
// 낮음=1.0, 중간=0.7, 높음=0.4
const COMP_WEIGHT = { 낮음: 1.0, 중간: 0.7, 높음: 0.4, '-': 0.5 };

function opportunityScore(item) {
  const w = COMP_WEIGHT[item.competition] ?? 0.5;
  return Math.round(item.totalVolume * w);
}

const filtered = data.filter((it) => isRelevant(it.keyword));
console.log(`전체 ${data.length}개 → 관련 키워드 ${filtered.length}개 필터링`);

filtered.forEach((it) => (it.score = opportunityScore(it)));
filtered.sort((a, b) => b.totalVolume - a.totalVolume);

// 카테고리 분류
function categorize(kw) {
  if (/파닉스|phonics/i.test(kw)) return 'A_파닉스';
  if (/한글/.test(kw)) return 'C_한글학습';
  if (/(유아|어린이|키즈|5세|6세|7세|8세|유치원).*영어|영어.*(유아|어린이|키즈|학습지|앱|놀이|동화)/.test(kw)) return 'B_유아영어';
  if (/영어/.test(kw) && !/학원|학습지\s*$/.test(kw)) return 'B_유아영어';
  if (/동화|그림책|이야기책|오디오북/.test(kw)) return 'D_동화책';
  if (/호두|핑크퐁|리딩게이트|리딩앤|야미야미|똑똑한.*하루|윙크|리딩에그|abcmouse/i.test(kw)) return 'F_경쟁사';
  if (/홈스쿨|엄마표|자기주도|문해력|독서|학습지/.test(kw)) return 'E_육아학습';
  if (/4세|5세|6세|7세|8세|유치원|어린이집|읽기.*독립/.test(kw)) return 'G_연령별';
  return 'H_기타';
}

filtered.forEach((it) => (it.category = categorize(it.keyword)));

// 골드 키워드: 총검색량 1000+ AND 경쟁 낮음~중간
const gold = filtered
  .filter((it) => it.totalVolume >= 1000 && (it.competition === '낮음' || it.competition === '중간'))
  .sort((a, b) => b.score - a.score)
  .slice(0, 30);

// 카테고리별 TOP
const byCategory = {};
for (const it of filtered) {
  if (!byCategory[it.category]) byCategory[it.category] = [];
  byCategory[it.category].push(it);
}
for (const k of Object.keys(byCategory)) {
  byCategory[k].sort((a, b) => b.totalVolume - a.totalVolume);
  byCategory[k] = byCategory[k].slice(0, 25);
}

const summary = {
  totalAnalyzed: data.length,
  relevantCount: filtered.length,
  goldKeywords: gold,
  byCategory,
};

fs.writeFileSync(OUT_PATH, JSON.stringify(summary, null, 2), 'utf-8');

// 콘솔에 골드 키워드 출력
console.log('\n========================================');
console.log('🏆 GOLD KEYWORDS (검색량 1,000+ × 경쟁 낮음~중간) TOP 30');
console.log('========================================');
console.log('순위 | 키워드 | PC | 모바일 | 총검색 | 경쟁 | 기회점수');
gold.forEach((it, i) => {
  console.log(`${i + 1}. ${it.keyword} | ${it.pcVolume} | ${it.mobileVolume} | ${it.totalVolume} | ${it.competition} | ${it.score}`);
});

// 카테고리별 출력
const catNames = {
  A_파닉스: '파닉스',
  B_유아영어: '유아 영어',
  C_한글학습: '한글 학습',
  D_동화책: '동화책/그림책',
  E_육아학습: '육아/홈스쿨링',
  F_경쟁사: '경쟁사 브랜드',
  G_연령별: '연령별',
  H_기타: '기타',
};

for (const cat of ['A_파닉스', 'B_유아영어', 'C_한글학습', 'D_동화책', 'E_육아학습', 'F_경쟁사', 'G_연령별']) {
  const list = byCategory[cat] || [];
  if (list.length === 0) continue;
  console.log(`\n--- ${catNames[cat]} TOP ${Math.min(15, list.length)} ---`);
  list.slice(0, 15).forEach((it) => {
    console.log(`${it.keyword.padEnd(25)} | ${String(it.totalVolume).padStart(7)} | ${it.competition}`);
  });
}

console.log(`\n✅ 분석 결과 저장: ${path.relative(process.cwd(), OUT_PATH)}`);
