#!/usr/bin/env node
/**
 * 탱고북 마케팅 전략을 ContentFlow에서 임포트 가능한 단일 HTML 템플릿으로 합성한다.
 *
 * 출력 형식:
 *  - <meta name="title"> / <meta name="description"> — templates API가 메타 추출
 *  - <script>에 const kwData=[...]; const topics=[...]; — parser가 우선 사용
 *  - .cycle-item 마크업 — 카테고리 표시 + parser 폴백
 *  - 사용자가 직접 열어도 보기 좋은 시각화
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const RAW_PATH = path.join(DATA_DIR, 'naver-keywords-raw.json');

// ContentFlow 앱의 strategy-templates 폴더
const OUT_PATH = path.resolve(
  __dirname, '..', '..', '..', '..', 'contentflow1', 'contentflow', 'public', 'strategy-templates', 'tangobook-strategy.html'
);

const all = JSON.parse(fs.readFileSync(RAW_PATH, 'utf-8'));

// === 1) 키워드 데이터 ===
// 우리 도메인 관련 키워드 + 검색량 50 이상 + 영어/한글/파닉스/동화/육아 패턴 매칭

const RELEVANT = [
  /파닉스/, /phonics/i, /영어발음/, /영어단어/, /영어공부/, /영어유치원/, /영어도서관/, /영어스펠링/, /영어소문자/, /영어낱말/, /화상영어/, /어린이.*영어/, /유아.*영어/, /엄마표.*영어/, /읽기/, /^영어$/, /오늘의영어/, /왕초보영어/, /초등영어/, /여행영어/, /^abc/i, /알파벳/,
  /한글/, /가나다/,
  /동화/, /그림책/, /오디오북/, /구연동화/, /명작/, /전래/,
  /[4-8]세/, /유치원$/, /어린이집/, /읽기.*독립/, /[4-8]세.*책추천/, /[4-8]세.*전집/, /[4-8]세.*선물/, /[4-8]세.*어린이날/, /[4-8]세.*한글/, /[4-8]세.*영어/,
  /홈스쿨/, /엄마표/, /자기주도/, /문해력/, /독서/, /^학습지/, /유아학습지/, /한글학습지/, /초등학습지/, /^책나무/,
  /리딩게이트/, /^윙크/, /^핑크퐁/, /리딩앤/, /야미야미/, /똑똑한.*하루/, /리딩에그/, /호두잉글리시/, /튼튼영어/, /눈높이/, /빨간펜/, /구몬/, /웅진/, /천재교육/, /슈퍼파닉스/, /스마트파닉스/,
  /AI.*동화/i, /AI.*storybook/i,
];
const EXCLUDE = [
  /번역기/, /타자/, /국어사전/, /영어사전$/, /해석기/, /수능/, /^수학/, /구구단/, /웹소설/, /논문/, /토익/, /토플/, /^신생아/, /출산/, /임신/, /돌잔치/, /백일/, /산후/, /^성인/, /직장인/, /대학생/, /고등학생/, /^중[0-9]/, /이유식/, /^젖/, /기저귀/, /분유/, /^임상/, /^영어회화/, /^영작/, /비즈니스영어/, /수학학원/, /국어학원$/, /^영어학원/, /방송/, /드라마/, /^영화/, /성악/, /발성/,
];
function isRelevant(kw) {
  if (EXCLUDE.some((p) => p.test(kw))) return false;
  return RELEVANT.some((p) => p.test(kw));
}

const COMP_MAP = { 낮음: '낮음', 중간: '중간', 높음: '높음' };

// 카테고리 코드 매핑
function categorize(kw) {
  if (/리딩게이트|^윙크|^핑크퐁|리딩앤|야미야미|똑똑한.*하루|리딩에그|호두잉글리시|튼튼영어|눈높이|구몬|빨간펜|웅진|천재교육|슈퍼파닉스|스마트파닉스/.test(kw)) return 'F';
  if (/파닉스|phonics/i.test(kw)) return 'C';
  if (/한글/.test(kw)) return 'B';
  if (/동화|그림책|오디오북|구연|명작|전래/.test(kw)) return 'D';
  if (/[4-8]세.*(책추천|전집|선물|어린이날|한글|영어)|읽기.*독립/.test(kw)) return 'B';
  if (/홈스쿨|엄마표|자기주도|문해력|독서|학습지/.test(kw)) return 'E';
  if (/영어/.test(kw)) return 'A';
  return 'E';
}

// 골드 판정: 우리가 분석한 골드 + 추가 의도 명확 키워드
const HAND_GOLD = new Set([
  '영어발음', '영어스펠링', '영어소문자', '오늘의영어단어', '여행영어',
  '한글사전', '한글낱말카드', '한글벽보', '한글카드', '한글떼기',
  '5세책추천', '6세책추천', '4세책추천', '5세한글공부', '6세한글공부',
  '동화책추천', '그림책추천', '동화책만들기', '문해력',
  '윙크가격', '윙크무료체험', '리딩게이트가격', '리딩에그', '호두잉글리시',
  '키즈유튜브', '튼튼영어베이비리그',
]);

function isGolden(kw, totalSearch, comp) {
  if (HAND_GOLD.has(kw)) return true;
  if (totalSearch >= 1000 && (comp === '낮음' || comp === '중간')) return true;
  return false;
}

// 필터 → kwData 변환 → 검색량 정렬 → 상위 80개
const filtered = all
  .filter((it) => it.totalVolume >= 50 && isRelevant(it.keyword))
  .sort((a, b) => b.totalVolume - a.totalVolume)
  .slice(0, 100);

const kwData = filtered.map((it) => {
  const cat = categorize(it.keyword);
  const gold = isGolden(it.keyword, it.totalVolume, it.competition);
  const tag = gold ? `${cat} gold` : cat;
  return [it.keyword, it.pcVolume, it.mobileVolume, it.totalVolume, COMP_MAP[it.competition] || '중간', tag];
});

console.log(`키워드 ${kwData.length}개 (골드 ${kwData.filter((r) => r[5].includes('gold')).length}개)`);

// === 2) 토픽 데이터 (콘텐츠 기획) ===
// [ID, 카테고리, 제목, 앵글, 키워드, 출처]
const topics = [
  // A: 유아 영어
  ['A01', 'A', '5세 영어 시작, 무엇부터 해야 할까? AI 동화책으로 시작하는 법', '학부모의 첫 영어 고민 해소 + 탱고북 USP 자연 노출', '5세영어,영어시작,유아영어', 'naver'],
  ['A02', 'A', '"영어발음" 어떻게 가르치죠? 4~7세 발음 교정 5단계', '영어발음(7,590/월·낮음) 골드 키워드 직접 공략', '영어발음,파닉스발음,유아영어', 'gold'],
  ['A03', 'A', '아이 영어 알파벳 — 소문자가 왜 더 중요한가', '영어소문자(1,000/월·낮음) — 알파벳 학습 진입 콘텐츠', '영어소문자,알파벳,파닉스', 'gold'],
  ['A04', 'A', '영어 스펠링 — 파닉스 다음 단계, 게임으로 익히는 법', '영어스펠링(1,440/월·낮음) — 파닉스 연계 학습', '영어스펠링,파닉스,영어공부', 'gold'],
  ['A05', 'A', '오늘의 영어 단어 시리즈: 매일 1단어 챌린지', '재방문 자산 콘텐츠 — 오늘의영어단어(2,510/월·낮음)', '오늘의영어단어,영어단어,영어공부', 'gold'],
  ['A06', 'A', '가족 여행 영어 — 아이가 따라할 수 있는 50문장', '여행영어(3,100/월·낮음) — 시즌성 콘텐츠', '여행영어,가족여행,영어회화', 'gold'],
  ['A07', 'A', '튼튼영어 베이비리그 대안 — 4세 이후엔 AI 동화책으로', '튼튼영어베이비리그(1,170/월·낮음) — 인접 카테고리 흡수', '튼튼영어베이비리그,유아영어,AI동화책', 'gold'],

  // B: 한글 + 연령별
  ['B01', 'B', '한글 떼기 완벽 가이드 — 5세부터 시작하는 단계별 로드맵', '한글떼기(1,020/월) 코어 의도 — 학부모 첫 검색', '한글떼기,5세한글공부,유아한글', 'gold'],
  ['B02', 'B', '5세 책 추천 — 학습 효과와 재미 둘 다 잡는 12권', '5세책추천(730/월) — 의도 100% 학부모 구매', '5세책추천,유아책추천,동화책추천', 'gold'],
  ['B03', 'B', '6세 책 추천 — 한글 떼고 영어 시작하는 시기 추천 도서', '6세책추천(710/월) — 학습효율맘 페르소나 타겟', '6세책추천,한글떼기,영어시작', 'gold'],
  ['B04', 'B', '4세 책 추천 — 동화책에 빠지게 만드는 시작점', '4세책추천(260/월) — 깔때기 진입', '4세책추천,유아동화책,그림책', ''],
  ['B05', 'B', '한글 낱말카드 무료 PDF — 12지신 캐릭터로 재밌게', '한글낱말카드(1,600/월·중간) — 리드마그넷', '한글낱말카드,한글카드,한글공부', 'gold'],
  ['B06', 'B', '한글 벽보 무료 다운로드 — 한글 숲 친구들 버전', '한글벽보(980/월·중간) — 리드마그넷', '한글벽보,한글카드,한글공부', 'gold'],
  ['B07', 'B', '5세 한글 공부 — 학습지 vs 앱, 진짜 효과는?', '5세한글공부(1,090/월) — 비교형 콘텐츠', '5세한글공부,한글공부,한글앱', 'gold'],
  ['B08', 'B', '6세 한글 공부 — 받침까지 익히는 시기별 학습법', '6세한글공부(860/월) — 학습효율맘 타겟', '6세한글공부,한글공부,받침', ''],

  // C: 파닉스
  ['C01', 'C', '유아 파닉스 완벽 가이드 2026 — 5세부터 시작하는 5단계', '파닉스(8,120/월) 기둥 콘텐츠 (Pillar)', '파닉스,영어파닉스,파닉스교재', ''],
  ['C02', 'C', '파닉스 vs 사이트워드 — 무엇을 먼저 가르쳐야 할까', '학부모 핵심 질문 정공법 SEO', '파닉스,사이트워드,영어공부', ''],
  ['C03', 'C', '한글 파닉스 — 영어와 동시에 시작할 수 있을까', '한글파닉스(590/월) — 탱고북 USP 직격', '한글파닉스,한글떼기,파닉스', ''],
  ['C04', 'C', '슈퍼파닉스 보유자라면 — 동화책으로 보완재 만드는 법', '슈퍼파닉스한글(4,200/월·중간) — 보완재 포지션', '슈퍼파닉스,슈퍼파닉스한글,파닉스', 'gold'],
  ['C05', 'C', '파닉스 발음 — 아이에게 자주 틀리는 5가지 발음 교정', '파닉스발음(1,140/월) — 정보탐색형', '파닉스발음,영어발음,파닉스', ''],
  ['C06', 'C', '파닉스 앱 추천 — 2026년 학부모가 뽑은 BEST 5', '파닉스앱(데이터 적음) — 비교 리스티클', '파닉스앱,파닉스추천,영어앱', ''],
  ['C07', 'C', '파닉스 교재 vs 앱 — 비용 대비 효과 분석', '파닉스교재(1,970/월) — 비교 콘텐츠', '파닉스교재,파닉스앱,파닉스', ''],
  ['C08', 'C', '초등 영어 파닉스 — 입학 전 꼭 끝내야 할 8단계', '초등영어파닉스(340/월) — 롱테일', '초등영어파닉스,초등영어,파닉스', ''],

  // D: 동화책 / 그림책
  ['D01', 'D', 'AI 동화책 만들기 — 우리 아이가 주인공이 되는 책', '동화책만들기(820/월) — 탱고북 USP 정체성', '동화책만들기,AI동화책,맞춤동화', 'gold'],
  ['D02', 'D', '동화책 추천 — 학습 효과까지 잡는 추천 동화 30선', '동화책추천(820/월) — 학부모 구매 의도', '동화책추천,그림책추천,유아동화책', 'gold'],
  ['D03', 'D', '그림책 추천 — 4~7세 인성·사고력 동시에 키우는 책', '그림책추천(880/월) — 학습효율맘 타겟', '그림책추천,동화책추천,유아그림책', 'gold'],
  ['D04', 'D', '오디오북 추천 — 잠자기 전 우리 아이 영어 노출법', '오디오북(6,840/월) — 인접 시장', '오디오북,오디오북추천,잠자기전동화', ''],
  ['D05', 'D', '전래동화 vs 창작동화 — 어느게 더 좋은가', '전래동화(6,600/월) — 정보탐색형 SEO', '전래동화,창작동화,동화책', ''],
  ['D06', 'D', '세계명작동화 추천 — 우리 아이에게 처음 읽어줄 책', '세계명작동화(1,490/월) — 콘텐츠 매칭', '세계명작동화,동화책추천,그림책', ''],
  ['D07', 'D', '구연동화 — 엄마가 직접 읽어주기 vs AI 음성 비교', '구연동화(1,140/월) — TTS 기능 자연 노출', '구연동화,오디오북,동화책', ''],

  // E: 육아 / 홈스쿨링 / 학습 효율
  ['E01', 'E', '문해력 키우기 — 4세부터 시작하는 9가지 방법', '문해력(8,120/월) — 코어 키워드 SEO', '문해력,문해력키우기,독서교육', 'gold'],
  ['E02', 'E', '엄마표 영어 시작하기 — 100일 플랜 무료 다운로드', '엄마표영어 코어 의도 + 리드마그넷', '엄마표영어,유아영어,영어시작', ''],
  ['E03', 'E', '홈스쿨링 4~7세 — 일주일 시간표 샘플 5종', '홈스쿨링(2,890/월) — 인접 카테고리', '홈스쿨링,자기주도학습,유아학습', ''],
  ['E04', 'E', '자기주도학습, 4~7세부터 가능한가 — AI가 만드는 학습 루틴', '자기주도학습(1,650/월) — USP 매칭', '자기주도학습,홈스쿨링,AI학습', ''],
  ['E05', 'E', '유아 학습지 솔직 후기 — 어떤 게 정말 효과 있나', '유아학습지(1,580/월) — 비교 리스티클', '유아학습지,학습지,한글학습지', ''],

  // F: 경쟁사 비교 / 대안 (트래픽 흡수 최우선)
  ['F01', 'F', '리딩게이트 vs 탱고북 — 가격·효과·차별점 비교', '리딩게이트(41,700/월·중간) 최대 흡수 — 최우선', '리딩게이트,리딩게이트가격,영어앱', 'gold'],
  ['F02', 'F', '윙크 학습지 단점 — 그리고 진짜 효과 있는 대안', '윙크(19,850/월·중간) 흡수 — 학습효율맘', '윙크,윙크학습지,학습지대안', 'gold'],
  ['F03', 'F', '윙크 가격 vs 앱 가격 — 학습지보다 저렴한 솔루션', '윙크가격(1,180/월·중간) — 가격 민감 학부모', '윙크가격,학습지가격,영어앱', 'gold'],
  ['F04', 'F', '윙크 무료 체험 후 — 진짜 결제 전 비교해볼 것 3가지', '윙크무료체험(1,190/월·중간) — 결제 직전 가로채기', '윙크무료체험,학습지비교,영어앱', 'gold'],
  ['F05', 'F', '리딩앤 vs 탱고북 — ORT vs AI 맞춤 동화책', '리딩앤(10,890/월·중간) — ORT 강자 비교', '리딩앤,리딩앤ORT,영어동화', 'gold'],
  ['F06', 'F', '호두잉글리시 vs 탱고북 — 게임형 vs 동화형 어느게 효과적', '호두잉글리시(1,120/월·중간) — 게임형 학습 비교', '호두잉글리시,영어게임,영어앱', 'gold'],
  ['F07', 'F', '리딩에그 한국 대안 — 토종 AI 동화책으로 충분한가', '리딩에그(1,170/월·중간) — 해외 인지 학부모 흡수', '리딩에그,영어앱,리딩에그대안', 'gold'],
  ['F08', 'F', '핑크퐁 다음 단계 — 영상에서 동화책 학습으로', '핑크퐁(17,010/월·높음) — 4세+ 깔때기 진입', '핑크퐁,핑크퐁다음,유아영어', ''],
  ['F09', 'F', '리딩게이트 가격 vs 진짜 효과 — 1년 사용 후기', '리딩게이트가격(800/월·중간) — 가격 민감', '리딩게이트가격,리딩게이트,영어앱', 'gold'],
  ['F10', 'F', '눈높이 영어 vs AI 동화책 — 학습지 시대는 끝났을까', '눈높이영어(1,550/월·중간) — 오프라인 학습지 흡수', '눈높이영어,눈높이,학습지대안', 'gold'],
];

// === 3) HTML 합성 ===
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="title" content="탱고북 마케팅 전략 (2026-05-14) — 네이버 4,024개 키워드 실측">
<meta name="description" content="4~8세 AI 동화책 + 한글/영어 파닉스 학습 플랫폼 탱고북의 마케팅 전략. 네이버 검색광고 API로 4,024개 키워드 실측, 골드 키워드 ${kwData.filter(r => r[5].includes('gold')).length}개 식별, 카테고리 6개 · 토픽 ${topics.length}개">
<title>탱고북 마케팅 전략 2026 — 데이터 기반 6개월 플랜</title>
<style>
  :root { --primary: #1a5f7a; --accent: #e76f51; --gold: #f59e0b; --bg: #fffbf5; --border: #e5dbc7; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Pretendard', 'Segoe UI', 'Noto Sans KR', sans-serif; background: var(--bg); color: #1f2937; line-height: 1.65; font-size: 14px; padding: 32px 20px; max-width: 1200px; margin: 0 auto; }
  h1 { font-size: 32px; color: var(--primary); margin-bottom: 8px; font-weight: 800; }
  h2 { font-size: 22px; color: var(--primary); margin: 36px 0 14px; padding-bottom: 8px; border-bottom: 3px solid var(--accent); font-weight: 700; }
  h3 { font-size: 17px; color: #134252; margin: 20px 0 10px; font-weight: 700; }
  .lead { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 20px 0; }
  .stat { background: white; border: 1px solid var(--border); border-radius: 10px; padding: 14px; text-align: center; }
  .stat-value { font-size: 24px; font-weight: 800; color: var(--primary); }
  .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; margin: 12px 0 24px; font-size: 13px; }
  thead { background: var(--primary); color: white; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #f1ede2; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  tbody tr:nth-child(even) { background: #fbf8f0; }
  .comp-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }
  .comp-low { background: #d1fae5; color: #065f46; }
  .comp-medium { background: #fef3c7; color: #78350f; }
  .comp-high { background: #fee2e2; color: #7f1d1d; }
  .s-gold { background: linear-gradient(90deg, #fef3c7, transparent 50%); }
  .s-gold td:first-child::before { content: '🏆 '; }
  .sbadge { display: inline-block; padding: 1px 8px; border-radius: 10px; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; margin-right: 4px; }
  .cycle-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin: 16px 0; }
  .cycle-item { background: white; border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
  .cycle-letter { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; background: var(--accent); color: white; font-weight: 800; font-size: 14px; margin-bottom: 6px; }
  .cycle-name { font-weight: 700; color: var(--primary); margin-bottom: 4px; font-size: 14px; }
  .cycle-desc { font-size: 12px; color: #6b7280; line-height: 1.5; }
  .kw-tag { display: inline-block; padding: 1px 7px; background: #f3f4f6; border-radius: 8px; font-size: 11px; margin-right: 3px; }
  .cat-pill { display: inline-block; padding: 2px 8px; background: var(--primary); color: white; border-radius: 10px; font-size: 11px; font-weight: 700; }
</style>
</head>
<body>

<h1>탱고북 마케팅 전략 2026</h1>
<p class="lead">네이버 검색광고 API로 4,024개 키워드 실측 · Similarweb/Ahrefs 글로벌 데이터 · 6개월 데이터 기반 플랜 · 발간 2026-05-14</p>

<div class="stat-grid">
  <div class="stat"><div class="stat-label">실측 키워드</div><div class="stat-value">${all.length.toLocaleString()}</div></div>
  <div class="stat"><div class="stat-label">필터된 관련</div><div class="stat-value">${kwData.length}</div></div>
  <div class="stat"><div class="stat-label">골드 키워드</div><div class="stat-value">${kwData.filter(r => r[5].includes('gold')).length}</div></div>
  <div class="stat"><div class="stat-label">콘텐츠 토픽</div><div class="stat-value">${topics.length}</div></div>
</div>

<h2>🔁 콘텐츠 카테고리 (6개 축)</h2>
<div class="cycle-grid">
  <div class="cycle-item"><span class="cycle-letter">A</span><div class="cycle-name">유아 영어</div><div class="cycle-desc">영어발음·스펠링·알파벳 — 작은 단위 학습 키워드 (낮음 경쟁)</div></div>
  <div class="cycle-item"><span class="cycle-letter">B</span><div class="cycle-name">한글 + 연령별</div><div class="cycle-desc">한글떼기·연령별 책추천·낱말카드 리드마그넷</div></div>
  <div class="cycle-item"><span class="cycle-letter">C</span><div class="cycle-name">파닉스 허브</div><div class="cycle-desc">파닉스 기둥 콘텐츠 · vs사이트워드 · 한글파닉스 차별</div></div>
  <div class="cycle-item"><span class="cycle-letter">D</span><div class="cycle-name">동화책/그림책</div><div class="cycle-desc">AI 동화책 만들기 USP · 학습 효과 동화책 추천</div></div>
  <div class="cycle-item"><span class="cycle-letter">E</span><div class="cycle-name">육아/홈스쿨링</div><div class="cycle-desc">문해력·엄마표영어·자기주도학습 — 신뢰 콘텐츠</div></div>
  <div class="cycle-item"><span class="cycle-letter">F</span><div class="cycle-name">경쟁사 비교/대안</div><div class="cycle-desc">리딩게이트·윙크·호두·리딩앤·리딩에그 트래픽 흡수</div></div>
</div>

<h2>🏆 키워드 분석 — 네이버 실측 ${kwData.length}개</h2>
<p class="lead">검색량 50+ 관련 키워드. 골드 = (검색량 1,000+ × 경쟁 낮음~중간) 또는 의도 명확. PC + 모바일 합산.</p>
<table class="kw-table">
  <thead><tr><th>키워드</th><th class="num">총 검색</th><th class="num">PC</th><th>경쟁</th><th>카테고리</th></tr></thead>
  <tbody>
${kwData.map((r) => {
  const [kw, pc, mo, total, comp, tag] = r;
  const gold = tag.includes('gold');
  const compClass = comp === '높음' ? 'comp-high' : comp === '낮음' ? 'comp-low' : 'comp-medium';
  const cat = tag.replace(/\s*gold\s*/, '').trim() || 'E';
  return `    <tr data-cat="${gold ? 'gold' : cat}" class="${gold ? 's-gold' : ''}"><td>${kw}</td><td class="num">${total.toLocaleString()}</td><td class="num">${pc.toLocaleString()}</td><td><span class="comp-badge ${compClass}">${comp}</span></td><td><span class="sbadge">${cat}</span></td></tr>`;
}).join('\n')}
  </tbody>
</table>

<h2>📝 콘텐츠 토픽 — ${topics.length}개 기획안</h2>
<table class="topic-table">
  <thead><tr><th>ID</th><th>카테고리</th><th>제목</th><th>키워드</th></tr></thead>
  <tbody>
${topics.map((t) => {
  const [id, cat, title, , kwStr, source] = t;
  const kws = kwStr.split(',').map((k) => k.trim()).filter(Boolean);
  const isGold = source === 'gold';
  return `    <tr class="${isGold ? 's-gold' : ''}"><td>${id}</td><td><span class="cat-pill">${cat}</span></td><td>${title}</td><td>${kws.map((k) => `<span class="kw-tag">${k}</span>`).join(' ')}</td></tr>`;
}).join('\n')}
  </tbody>
</table>

<h2>📊 6개월 KPI 목표</h2>
<table>
  <thead><tr><th>지표</th><th>1개월</th><th>3개월</th><th>6개월</th></tr></thead>
  <tbody>
    <tr><td>가입자 (누적)</td><td class="num">500</td><td class="num">2,500</td><td class="num">5,000+</td></tr>
    <tr><td>가입 CAC</td><td class="num">≤10,000원</td><td class="num">≤7,000원</td><td class="num">≤5,000원</td></tr>
    <tr><td>7일 리텐션</td><td class="num">30%</td><td class="num">35%</td><td class="num">40%+</td></tr>
    <tr><td>유료 전환율</td><td class="num">2%</td><td class="num">3.5%</td><td class="num">5%+</td></tr>
    <tr><td>MRR</td><td class="num">100만</td><td class="num">500만</td><td class="num">1,500만+</td></tr>
    <tr><td>B2B 도입 기관</td><td class="num">2곳</td><td class="num">8곳</td><td class="num">20곳</td></tr>
  </tbody>
</table>

<!-- ContentFlow 파서용 데이터 -->
<script>
// [키워드, PC검색, 모바일검색, 총검색, 경쟁도, 카테고리/태그(gold 포함 시 골드)]
const kwData = ${JSON.stringify(kwData)};

// [ID, 카테고리코드, 제목, 앵글, 키워드(쉼표구분), 출처]
const topics = ${JSON.stringify(topics)};
</script>

</body>
</html>`;

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, html, 'utf-8');
console.log(`✅ 저장: ${OUT_PATH}`);
console.log(`   - 키워드 ${kwData.length}개 (골드 ${kwData.filter(r => r[5].includes('gold')).length}개)`);
console.log(`   - 토픽 ${topics.length}개`);
console.log(`   - 카테고리 6개 (A B C D E F)`);
