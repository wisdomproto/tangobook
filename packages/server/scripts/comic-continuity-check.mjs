/*
 * comic-continuity-check.mjs — 「타임 티코」 회차 콘티의 연속성 기계검증.
 * "읽어서 판단"이 아니라 상태 변수(배터리·부품 게이지)를 표로 뽑아 규칙 위반을 자동 검출.
 * 사용: node comic-continuity-check.mjs [ep01 ep02 ...]   (인자 없으면 ep01~ep12 전부)
 *
 * 검사 항목
 *  1) 배터리 곡선: 출발 앵커(100%/만충) 존재 · 단조 비증가 · 급락(>40%p) 경고
 *  2) 부품 게이지: 단조 비감소
 *  3) 위험 회상어 자동 플래그(어제/어젯밤/그저께/지난밤 + 메타 "N화") — 사람이 원인장면 있는지 확인용
 *  4) 두-사건 후보 휴리스틱(🎬, 한 쪽=한 이벤트 확인용)
 *  5) 키워드 과반복 렌즈(🔁, 2026-07-07 — 결론 1회 원칙 보조: 같은 핵심어 5쪽+ 등장 시 반복 후보)
 * 종료코드: 위반(FAIL) 있으면 1, 경고/플래그만이면 0.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', '..', 'client', 'public');

const args = process.argv.slice(2);
const docs = args.length
  ? args.map((a) => (a.startsWith('learning-comic-') ? a : `learning-comic-${a}`))
  : Array.from({ length: 12 }, (_, i) => `learning-comic-ep${String(i + 1).padStart(2, '0')}`);

const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/\s+/g, ' ').trim();

// HTML 을 쪽별 {pno, text, narr} 로 분해
//  text = 쪽 전체(장면 지시 포함, 배터리/게이지/회상어 검사용)
//  narr = 독자용 페이지 텍스트(<div class="text"> — 나레이션·대사)만. 키워드 과반복 렌즈는 이것만 본다
//         (SCENE 라벨 컷/장소/인물/소품/톤 이 매 쪽 반복돼 노이즈가 되는 것을 방지).
function parsePages(html) {
  const pages = [];
  const re = /<div class="page">\s*<div class="pno">([\s\S]*?)<\/div>([\s\S]*?)(?=<div class="page">|<footer|<div class="divider")/g;
  let m;
  while ((m = re.exec(html))) {
    const pno = (m[1].match(/\d+/) || [])[0];
    if (!pno) continue;
    const body = m[2];
    const narrM = body.match(/<div class="text">([\s\S]*?)<\/div>\s*(?=<\/div>|<div class="page">|$)/);
    pages.push({ pno: parseInt(pno, 10), text: stripTags(body), narr: narrM ? stripTags(narrM[1]) : '' });
  }
  return pages;
}

let anyFail = false;

for (const doc of docs) {
  const file = path.join(PUBLIC, `${doc}.html`);
  let html;
  try {
    html = await fs.readFile(file, 'utf-8');
  } catch {
    console.log(`\n■ ${doc}: (파일 없음, 건너뜀)`);
    continue;
  }
  const pages = parsePages(html);
  const fails = [];
  const warns = [];
  const flags = [];

  // ── 1) 배터리 검사 폐기(2026-07-05) — 배터리·제한시간 설정 자체를 제거함.
  //    잔재 감시: 배터리 언급이 남아 있으면 FAIL(제거 누락 탐지).
  for (const p of pages) {
    if (/배터리/.test(p.text) || /해\s*뜨기\s*전/.test(p.text)) {
      fails.push(`${p.pno}쪽: 배터리/제한시간 잔재 — "${(p.text.match(/[^ ]*배터리[^ ]*|해\s*뜨기\s*전[^ ]*/) || [''])[0]}" (룰2 개정으로 삭제 대상)`);
    }
  }

  // ── 2) 부품 게이지 칸 (단조 비감소) — "12칸 중 N칸" 의 N(채워진 수)만 ──
  const parts = [];
  for (const p of pages) {
    const re = /12\s*칸\s*중\s*(\d{1,2})\s*칸/g;
    let mm;
    while ((mm = re.exec(p.text))) parts.push({ pno: p.pno, n: parseInt(mm[1], 10) });
  }
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].n < parts[i - 1].n) {
      warns.push(`부품 게이지 감소 — ${parts[i - 1].pno}쪽 ${parts[i - 1].n}칸 → ${parts[i].pno}쪽 ${parts[i].n}칸`);
    }
  }

  // ── 3) 위험 회상어 자동 플래그(사람 확인용) ──────────────
  const RISK = ['어젯밤', '어제', '그저께', '지난밤', '지난번'];
  for (const p of pages) {
    for (const w of RISK) {
      if (p.text.includes(w)) flags.push(`${p.pno}쪽: "${w}" — 원인 장면이 앞쪽에 실제 있는지 확인`);
    }
    const meta = p.text.match(/\d+\s*화/g);
    if (meta) flags.push(`${p.pno}쪽: 메타 표기 ${meta.join(',')} — 대사에 "N화" 직접 노출 확인`);
  }

  // ── 4) "한 쪽=한 이벤트" 두-사건 후보 휴리스틱(사람 확인용) ──────────────
  //  의미 판단이라 자동 확정 불가 → 신호어로 후보만 뽑음. 지식카드 2단·피날레 몽타주(≤2)는 정상일 수 있음.
  const twoEv = [];
  for (const p of pages) {
    const hits = [];
    ['경위 설명', '3분할', '3요소', '3단'].forEach((k) => { if (p.text.includes(k)) hits.push(k); });
    if (/차례로[^.]{0,25}(지나|스쳐|떠오|흘러|바뀌)/.test(p.text)) hits.push('차례로~(시간경과)');
    // 배경의 '무리/행렬'이 별도 행동을 하고 전경에 다른 사건이 있으면 후보
    if (/배경[^전]{0,60}?(행렬|무리|떼|사람들|군중)[^전]{0,40}?(끼어|들어오|나르|지나|몰려)/.test(p.text) && /전경/.test(p.text)) hits.push('배경무리+전경사건');
    if (hits.length) twoEv.push(`${p.pno}쪽: ${hits.join('/')}`);
  }

  // ── 5) 키워드 과반복 렌즈(2026-07-07, 결론 1회 원칙 보조) ──────────────
  //  같은 핵심어가 여러 쪽에 반복 등장하면 "결론 반복 = 늘어짐" 후보. 자동 확정 불가(핵심어는
  //  정상 반복도 있음) → 사람 확인용 🔁 플래그. 캐릭터명·기능어는 제외, 조사 대충 stem.
  const STOP = new Set([
    '나레이션', '보리', '노아', '티코', '박사', '봉수', '할아버지', '티코피디아', '아이들', '얘들',
    '우리', '서로', '모두', '다들', '여기', '저기', '거기', '이것', '그것', '저것', '무엇', '누구', '어디', '언제',
    '이제', '지금', '오늘', '아까', '방금', '다시', '먼저', '아직', '벌써', '이미', '드디어', '마침내', '갑자기',
    '천천히', '얼른', '조금', '정말', '진짜', '너무', '가장', '함께', '같이', '계속', '자꾸',
    '그리고', '그러나', '하지만', '그런데', '그래서', '그러자', '그러면', '그러니까',
    '있어', '없어', '거야', '그래', '맞아', '좋아', '이야', '뭐야', '해야', '봐야', '되지', '이제야',
    '순간', '모습', '생각', '소리', '사람', '사람들', '시작', '하나', '이야기', '그때', '이때', '표정', '얼굴', '마음', '눈앞',
  ]);
  const PARTICLES = ['으로서', '으로써', '에서는', '에게서', '이라도', '에서', '에게', '한테', '까지', '부터', '조차', '마저', '밖에', '으로', '로서', '로써', '처럼', '만큼', '보다', '든지', '이나', '이랑', '이란', '께서', '라도', '란', '은', '는', '이', '가', '을', '를', '에', '의', '도', '로', '과', '와', '랑', '께', '들', '나'];
  const stem = (w) => {
    for (const p of PARTICLES) {
      if (w.length > p.length + 1 && w.endsWith(p)) return w.slice(0, -p.length);
    }
    return w;
  };
  const wordPages = new Map(); // stem -> Set(pno)
  for (const p of pages) {
    const seen = new Set();
    for (const raw of p.narr.match(/[가-힣]{2,}/g) || []) {
      const s = stem(raw);
      if (s.length < 2 || STOP.has(s) || STOP.has(raw)) continue;
      seen.add(s);
    }
    for (const s of seen) {
      if (!wordPages.has(s)) wordPages.set(s, new Set());
      wordPages.get(s).add(p.pno);
    }
  }
  const REPEAT_MIN = 5; // 5쪽 이상 등장 = 과반복 후보(핵심어라도 같은 결론 반복이면 압축 검토)
  const repeats = [...wordPages.entries()]
    .map(([w, set]) => ({ w, n: set.size, pnos: [...set].sort((a, b) => a - b) }))
    .filter((r) => r.n >= REPEAT_MIN)
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);

  if (fails.length) anyFail = true;
  const status = fails.length ? '❌ FAIL' : warns.length ? '⚠️  WARN' : '✅ PASS';
  console.log(`\n■ ${doc}  ${status}  (쪽 ${pages.length} · 부품게이지 ${parts.length})`);
  fails.forEach((x) => console.log(`   ❌ ${x}`));
  warns.forEach((x) => console.log(`   ⚠️  ${x}`));
  if (twoEv.length) console.log(`   🎬 두-사건 후보 ${twoEv.length}건(한 쪽 한 이벤트 확인): ` + twoEv.join(' | '));
  if (repeats.length) console.log(`   🔁 키워드 과반복 ${repeats.length}건(결론 반복 확인): ` + repeats.map((r) => `${r.w}(${r.n}쪽:${r.pnos.join(',')})`).join(' | '));
  if (flags.length) console.log(`   🔎 회상어 ${flags.length}건: ` + flags.slice(0, 6).join(' | ') + (flags.length > 6 ? ' …' : ''));
}

console.log(`\n${anyFail ? '❌ 일부 회차 FAIL — 위 배터리/제한시간 잔재 제거 필요' : '✅ 전 회차 배터리 잔재 0·부품게이지 정상 (🔎/🎬 플래그는 사람이 확인)'}`);
process.exit(anyFail ? 1 : 0);
