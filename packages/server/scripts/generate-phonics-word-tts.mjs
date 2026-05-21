#!/usr/bin/env node
/**
 * 모든 phonics 책 (영어 5권 + 한글 4권 = 71 unit) 의 학습카드 단어 TTS 자동 생성.
 *
 * 작업:
 *   1. 각 phonics 책 fetch
 *   2. wordFamilies[i].words[j] 중 ttsUrl 비어있는 항목 추출
 *   3. TTS 텍스트 = `${cleanBlend} ${cleanBlend} ${word}` (영어) 또는 `${blend} ${blend} ${korean ?? word}` (한글)
 *      blend 가 'Aa' 같이 같은 영문자만으로 구성된 경우 단일 소문자 (`a`) 로 압축 — phonics-library 매칭
 *   4. /api/phonics-library/concat 호출 → audioUrl 수신
 *   5. 책의 wordFamilies[i].words[j].ttsUrl 채워서 /api/storybooks PUT
 *
 * 사용:
 *   node scripts/generate-phonics-word-tts.mjs              # dry-run (변경 없음, 단어 N개 출력)
 *   node scripts/generate-phonics-word-tts.mjs --apply      # 실 적용
 *   node scripts/generate-phonics-word-tts.mjs --apply --only en-b1-u01,en-b1-u02
 *   node scripts/generate-phonics-word-tts.mjs --apply --concurrency 5
 */
const API_BASE = process.env.API_BASE || 'http://localhost:3500';

const APPLY = process.argv.includes('--apply');
const onlyArg = process.argv.find((a) => a.startsWith('--only='))
  ?? (process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null);
const onlyIds = onlyArg ? onlyArg.split(',').map((s) => s.trim()).filter(Boolean) : null;
const concurrencyArg = process.argv.find((a) => a.startsWith('--concurrency='))
  ?? (process.argv.includes('--concurrency') ? process.argv[process.argv.indexOf('--concurrency') + 1] : null);
const CONCURRENCY = Math.max(1, Math.min(10, Number(concurrencyArg?.replace('--concurrency=', '') ?? 3)));

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}  · concurrency: ${CONCURRENCY}  · API: ${API_BASE}`);
if (onlyIds) console.log(`only: ${onlyIds.join(', ')}`);
console.log();

/**
 * AlphabetCardTab.letterSoundForBlend 와 동일 로직.
 * 'Aa' / 'BB' / 'aa' 같이 같은 영문자만으로 구성된 경우 → 단일 소문자.
 * 그 외 ('an', '가', '/a/') → 원본.
 */
function letterSoundForBlend(blend) {
  if (/^[A-Za-z]+$/.test(blend)) {
    const lower = blend.toLowerCase();
    const unique = Array.from(new Set(lower));
    if (unique.length === 1) return unique[0];
  }
  return blend;
}

async function fetchJson(url, init) {
  const r = await fetch(url, init);
  const text = await r.text();
  if (!r.ok) {
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch {}
    throw new Error(`${r.status} ${r.statusText}: ${msg}`);
  }
  return JSON.parse(text);
}

async function listPhonicsBooks() {
  const j = await fetchJson(`${API_BASE}/api/storybooks`);
  const list = j.data ?? j;
  return list
    .filter((b) => b.type === 'phonics')
    .filter((b) => !onlyIds || onlyIds.includes(b.id))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function getBook(id) {
  const j = await fetchJson(`${API_BASE}/api/storybooks/${id}`);
  return j.data ?? j;
}

async function putBook(sb) {
  await fetchJson(`${API_BASE}/api/storybooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storybook: sb }),
  });
}

async function concatTts({ text, storybookId, identifier, language }) {
  const j = await fetchJson(`${API_BASE}/api/phonics-library/concat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, storybookId, identifier, language }),
  });
  return j.data.audioUrl;
}

/** 한 책의 누락된 TTS 작업 목록 추출 */
function listTasks(sb) {
  const lesson = sb.phonicsLesson;
  if (!lesson) return [];
  const isKorean = sb.phonicsConfig?.language === 'korean';
  const tasks = [];
  for (let wfIdx = 0; wfIdx < (lesson.wordFamilies ?? []).length; wfIdx++) {
    const wf = lesson.wordFamilies[wfIdx];
    const blendRaw = (lesson.blending?.[wfIdx]?.blend ?? wf.blend ?? '').replace(/\//g, '');
    const blend = letterSoundForBlend(blendRaw);
    for (let wIdx = 0; wIdx < (wf.words ?? []).length; wIdx++) {
      const w = wf.words[wIdx];
      if (w.ttsUrl) continue;
      const display = isKorean ? (w.korean ?? w.word) : w.word;
      if (!display) continue;
      const text = blend ? `${blend} ${blend} ${display}` : display;
      tasks.push({
        wfIdx,
        wIdx,
        word: w.word,
        text,
        identifier: `wf-${wfIdx}-${wIdx}`,
        language: isKorean ? 'korean' : 'english',
      });
    }
  }
  return tasks;
}

/** concurrency 제한 task runner */
async function runWithConcurrency(items, worker, n) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: n }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        results[i] = { ok: true, value: await worker(items[i], i) };
      } catch (e) {
        results[i] = { ok: false, error: e };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

// === 메인 ===
const books = await listPhonicsBooks();
console.log(`phonics 책 ${books.length}권 발견\n`);

let grandTotal = 0;
let grandOk = 0;
let grandFail = 0;

for (const summary of books) {
  const sb = await getBook(summary.id);
  const tasks = listTasks(sb);
  if (tasks.length === 0) {
    console.log(`[${sb.id}] (스킵 — 누락 없음)`);
    continue;
  }
  console.log(`[${sb.id}] ${sb.title}`);
  console.log(`  누락: ${tasks.length}건`);
  if (!APPLY) {
    for (const t of tasks.slice(0, 3)) {
      console.log(`    "${t.text}"  (${t.identifier})`);
    }
    if (tasks.length > 3) console.log(`    ... +${tasks.length - 3}건`);
    grandTotal += tasks.length;
    continue;
  }

  // APPLY: 동시 concat 호출
  const results = await runWithConcurrency(
    tasks,
    async (t) => {
      const url = await concatTts({
        text: t.text,
        storybookId: sb.id,
        identifier: t.identifier,
        language: t.language,
      });
      return url;
    },
    CONCURRENCY
  );

  let okCount = 0;
  let failCount = 0;
  const fails = [];
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const r = results[i];
    if (r.ok) {
      sb.phonicsLesson.wordFamilies[t.wfIdx].words[t.wIdx].ttsUrl = r.value;
      okCount++;
    } else {
      failCount++;
      fails.push({ t, err: r.error.message });
    }
  }

  if (okCount > 0) {
    sb.updatedAt = new Date().toISOString();
    try {
      await putBook(sb);
      console.log(`  ✓ TTS ${okCount}개 생성 + 저장`);
    } catch (e) {
      console.error(`  ✗ 저장 실패: ${e.message}`);
      failCount += okCount;
      okCount = 0;
    }
  }
  if (failCount > 0) {
    console.log(`  ✗ ${failCount}건 실패:`);
    for (const f of fails.slice(0, 5)) {
      console.log(`    "${f.t.text}" (${f.t.identifier}) — ${f.err}`);
    }
    if (fails.length > 5) console.log(`    ... +${fails.length - 5}건`);
  }
  grandTotal += tasks.length;
  grandOk += okCount;
  grandFail += failCount;
  console.log();
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (APPLY) {
  console.log(`완료: ${grandOk}/${grandTotal} 생성, ${grandFail} 실패`);
} else {
  console.log(`DRY-RUN 종료. 총 ${grandTotal}건 누락. 실 적용은 \`--apply\` 플래그.`);
}
