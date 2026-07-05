/*
 * comic-continuity-check.mjs — 「타임 티코」 회차 콘티의 연속성 기계검증.
 * "읽어서 판단"이 아니라 상태 변수(배터리·부품 게이지)를 표로 뽑아 규칙 위반을 자동 검출.
 * 사용: node comic-continuity-check.mjs [ep01 ep02 ...]   (인자 없으면 ep01~ep12 전부)
 *
 * 검사 항목
 *  1) 배터리 곡선: 출발 앵커(100%/만충) 존재 · 단조 비증가 · 급락(>40%p) 경고
 *  2) 부품 게이지: 단조 비감소
 *  3) 위험 회상어 자동 플래그(어제/어젯밤/그저께/지난밤 + 메타 "N화") — 사람이 원인장면 있는지 확인용
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

// HTML 을 쪽별 {pno, text} 로 분해
function parsePages(html) {
  const pages = [];
  const re = /<div class="page">\s*<div class="pno">([\s\S]*?)<\/div>([\s\S]*?)(?=<div class="page">|<footer|<div class="divider")/g;
  let m;
  while ((m = re.exec(html))) {
    const pno = (m[1].match(/\d+/) || [])[0];
    if (!pno) continue;
    pages.push({ pno: parseInt(pno, 10), text: stripTags(m[2]) });
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

  // ── 1) 배터리 % 곡선 ──────────────────────────────
  // 배터리는 %(또는 만충/충전) 로 표기, 부품은 칸 으로 표기 → 게이지 N% 는 배터리로 간주.
  const batt = []; // {pno, pct}
  let anchorPnoWord = null; // 만충/충전 완료 등 말로 된 앵커 첫 등장 쪽
  for (const p of pages) {
    if (anchorPnoWord === null && /(만충|충전\s*완료|꽉\s*채워|충전\s*케이블[^<]{0,20}100)/.test(p.text)) {
      anchorPnoWord = p.pno;
    }
    // 배터리는 %(숫자) 로만 표기 — 배터리/게이지 인접 N% 를 순서대로 수집.
    // ('절반' 등 한글 수치는 "반짝/반쪽" 오탐이 커서 제외 → 그 회차는 급락 WARN 으로만 뜰 수 있음)
    const re = /(?:배터리|게이지)[^%<]{0,18}?(\d{1,3})\s*%/g;
    let mm;
    while ((mm = re.exec(p.text))) {
      const pct = parseInt(mm[1], 10);
      if (pct >= 0 && pct <= 100) batt.push({ pno: p.pno, pct });
    }
  }
  if (batt.length) {
    const firstBatt = batt[0];
    const anchored = firstBatt.pct === 100 || (anchorPnoWord !== null && anchorPnoWord <= firstBatt.pno);
    if (!anchored) {
      fails.push(`배터리 출발 앵커 없음 — 첫 배터리 언급이 ${firstBatt.pno}쪽 ${firstBatt.pct}% (앞에 100%/만충 없음)`);
    }
    for (let i = 1; i < batt.length; i++) {
      const a = batt[i - 1], b = batt[i];
      if (b.pct > a.pct) fails.push(`배터리 역행 — ${a.pno}쪽 ${a.pct}% → ${b.pno}쪽 ${b.pct}%`);
      else if (a.pct - b.pct > 45) warns.push(`배터리 급락(>45%p) — ${a.pno}쪽 ${a.pct}% → ${b.pno}쪽 ${b.pct}% (중간 눈금 권장)`);
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

  if (fails.length) anyFail = true;
  const status = fails.length ? '❌ FAIL' : warns.length ? '⚠️  WARN' : '✅ PASS';
  console.log(`\n■ ${doc}  ${status}  (쪽 ${pages.length} · 배터리표기 ${batt.length} · 부품 ${parts.length})`);
  fails.forEach((x) => console.log(`   ❌ ${x}`));
  warns.forEach((x) => console.log(`   ⚠️  ${x}`));
  if (twoEv.length) console.log(`   🎬 두-사건 후보 ${twoEv.length}건(한 쪽 한 이벤트 확인): ` + twoEv.join(' | '));
  if (flags.length) console.log(`   🔎 회상어 ${flags.length}건: ` + flags.slice(0, 6).join(' | ') + (flags.length > 6 ? ' …' : ''));
}

console.log(`\n${anyFail ? '❌ 일부 회차 FAIL — 위 배터리 앵커/역행 수정 필요' : '✅ 전 회차 배터리/게이지 규칙 통과 (🔎 회상어 플래그는 사람이 확인)'}`);
process.exit(anyFail ? 1 : 0);
