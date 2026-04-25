// v1 storybook의 artStyle 필드를 ART_STYLES.id 정규 ID로 매핑.
//
// 현재 상태: 8 정규 ID 외에 raw prompt가 그대로 박혀 있는 책 다수.
// 목표: book-variants v2 마이그 전 artStyle을 깨끗하게 정리.
//
// 매핑 룰: keyword 기반. 가장 specific한 룰부터 적용.
//
// ART_STYLES.id 8종 + 신규 'paper-craft' 1종 = 총 9종.
// (paper-craft는 cut paper / 3D papercut / paper sculpture 류, 47권이라 별도 ID 가치 있음)
//
// 실행:
//   node scripts/normalize-art-style.mjs              # dry-run, 매핑 결과만 출력
//   node scripts/normalize-art-style.mjs --apply      # 실제 update
//
// 서버(localhost:3500) 필요.

const API = 'http://localhost:3500/api';
const APPLY = process.argv.includes('--apply');
const CONCURRENCY = 6;

// 매핑 룰 — 위에서 아래로, 첫 번째 매칭 적용.
// match: lowercase substring 또는 정규식. all of needles must be present (AND).
const RULES = [
  // === 종이공예 (신규) ===
  { id: 'paper-craft', label: '종이공예', anyOf: ['paper craft', 'paper sculpture', 'paper collage', 'papercut', 'cut paper', 'kraft paper'] },

  // === 실사 ===
  { id: 'photographic', label: '실사', anyOf: ['photographic', 'photo realistic', 'photorealistic', '실사 사진', '네셔널 지오그래픽', '다큐멘터리', 'national geographic', 'nature documentary', 'scientific illustration of', 'field guide style'] },

  // === 유화 ===
  { id: 'oil-painting', label: '유화', anyOf: ['oil paint', 'oil painting', 'renaissance painting', 'botticelli', 'impasto'] },

  // === 애니메이션 (3D/Pixar/디지털 페인팅 포함) ===
  { id: 'animation', label: '애니메이션', anyOf: ['pixar', '3d animation', 'animated film', 'digital painting', 'soft digital painting'] },

  // === 연필 스케치 (colored pencil / crayon) ===
  { id: 'pencil-sketch', label: '연필 스케치', anyOf: ['colored pencil', 'pencils and crayons', 'crayon', 'pencil sketch', 'pencil drawing'] },

  // === 전통 동화책 (한국 전통 / folk art / naive folk) ===
  { id: 'traditional', label: '전통 동화책', anyOf: ['korean folktale', '한국 전통', 'hanbok', 'hanok', 'folk-art', 'folk art', 'naive folk'] },

  // === 모던 일러스트 (editorial / riso / mixed media / hand-drawn editorial) ===
  { id: 'modern-illustration', label: '현대 일러스트', anyOf: ['hand-drawn editorial', 'editorial illustration', 'riso', 'screenprint', 'mixed media illustration', 'graphic illustration', 'bold graphic style', 'modern children'] },

  // === 카툰 (scribble / doodle / playful / childlike with bold outlines / oversized eyes) ===
  { id: 'cartoon', label: '카툰', anyOf: ['cartoon', 'scribble', 'doodle', 'wobbly hand-drawn', 'oversized', 'googly eyes', 'huge oval', 'bold thick black outline', 'wild scribbled', 'naive art'] },

  // === 수채화 (watercolor / gouache / soft wash) ===
  { id: 'watercolor', label: '수채화', anyOf: ['watercolor', 'watercolour', 'gouache', '수채화', '수채', 'soft watercolor', 'watercolor wash', 'watercolor and ink'] },
];

// 정규 ID 8종 — 이미 정규 ID로 박힌 책들은 그대로
const CANONICAL_IDS = new Set([
  'photographic', 'watercolor', 'cartoon', 'traditional', 'animation',
  'modern-illustration', 'oil-painting', 'pencil-sketch',
  'paper-craft', // 신규 ID
]);

// label로 박혀 있는 책 → id로 변환
const LABEL_TO_ID = new Map([
  ['Modern Illustration', 'modern-illustration'],
  ['Pixar 3D animation style', 'animation'],
  ['pixar 초 고화질 3D 애니메이션 스타일.', 'animation'],
  ['Botticelli style Renaissance painting', 'oil-painting'],
  ['네셔널 지오그래픽 수준 실사 사진', 'photographic'],
  ['다큐멘터리 수준 초 고화질 실사 사진', 'photographic'],
]);

function normalize(rawArtStyle) {
  if (!rawArtStyle) return { id: null, reason: 'empty' };
  const trimmed = String(rawArtStyle).trim();

  // 1. 이미 정규 ID
  if (CANONICAL_IDS.has(trimmed)) return { id: trimmed, reason: 'already-canonical' };

  // 2. 알려진 label
  if (LABEL_TO_ID.has(trimmed)) return { id: LABEL_TO_ID.get(trimmed), reason: 'label-map' };

  // 3. keyword 매칭
  const lower = trimmed.toLowerCase();
  for (const rule of RULES) {
    for (const needle of rule.anyOf) {
      if (lower.includes(needle.toLowerCase())) {
        return { id: rule.id, reason: `keyword: "${needle}"` };
      }
    }
  }

  // 4. 매칭 실패
  return { id: null, reason: 'no-match' };
}

async function apiJson(path, init) {
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`${res.status} ${path}: ${text.slice(0, 200)}`); }
  if (!res.ok || json.success === false) {
    throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 200)}`);
  }
  return json.data;
}

async function mapWithConcurrency(items, fn, n) {
  const out = new Array(items.length);
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        try { out[i] = await fn(items[i], i); } catch (e) { out[i] = { __error: e.message }; }
        done++;
        if (done % 20 === 0 || done === items.length) {
          process.stdout.write(`\r  ${done}/${items.length}    `);
        }
      }
    }),
  );
  process.stdout.write('\n');
  return out;
}

function trunc(s, n) { return s.length > n ? s.slice(0, n) + '…' : s; }

async function main() {
  console.log(`mode: ${APPLY ? '🔥 APPLY' : 'DRY-RUN (--apply 없음)'}\n`);
  const list = await apiJson('/storybooks');
  console.log(`라이브러리 ${list.length}권. 개별 fetch 중...\n`);

  const books = await mapWithConcurrency(
    list,
    (s) => apiJson(`/storybooks/${s.id}`),
    CONCURRENCY,
  );

  // 매핑 분석
  const planByOriginal = new Map(); // originalArtStyle (trimmed) → { mappedId, reason, count, sampleIds, originalFull }
  const noMatch = [];
  const errors = [];

  for (const b of books) {
    if (!b || b.__error) { errors.push(b?.__error ?? 'unknown'); continue; }
    const original = (b.artStyle ?? '').trim();
    const mapped = normalize(original);
    const key = original;
    if (!planByOriginal.has(key)) {
      planByOriginal.set(key, {
        mappedId: mapped.id,
        reason: mapped.reason,
        count: 0,
        sampleIds: [],
        originalFull: original,
      });
    }
    const entry = planByOriginal.get(key);
    entry.count++;
    if (entry.sampleIds.length < 3) entry.sampleIds.push(b.id);
    if (mapped.id == null) noMatch.push({ id: b.id, title: b.title, original });
  }

  // 출력 — original 별로 묶어서 표시
  const sorted = [...planByOriginal.entries()].sort((a, b) => b[1].count - a[1].count);
  console.log('─'.repeat(80));
  console.log('매핑 결과 (count 큰 순):\n');
  for (const [original, e] of sorted) {
    const previewOrig = trunc(original.replace(/\s+/g, ' '), 60);
    const arrow = e.mappedId ? `→ ${e.mappedId}` : '→ ❌ NO MATCH';
    console.log(`[${String(e.count).padStart(3)}] "${previewOrig}"`);
    console.log(`        ${arrow}   (${e.reason})`);
  }

  // ID별 합계
  const idTotals = new Map();
  for (const [, e] of planByOriginal.entries()) {
    if (e.mappedId) idTotals.set(e.mappedId, (idTotals.get(e.mappedId) ?? 0) + e.count);
  }
  console.log('\n─'.repeat(80));
  console.log('정규화 후 분포:');
  const sortedIds = [...idTotals.entries()].sort((a, b) => b[1] - a[1]);
  for (const [id, n] of sortedIds) console.log(`  ${id.padEnd(22)} ${n}`);
  console.log(`\n총 ${books.length - errors.length}권 (errors ${errors.length})`);
  console.log(`매핑 성공: ${books.length - errors.length - noMatch.length}`);
  console.log(`NO MATCH:  ${noMatch.length}`);
  if (noMatch.length) {
    console.log('\nNO MATCH 책 (앞 10개):');
    for (const m of noMatch.slice(0, 10)) {
      console.log(`  ${m.id} ${trunc(m.title, 30)} | "${trunc(m.original, 50)}"`);
    }
  }

  if (idTotals.has('paper-craft')) {
    console.log(`\n⚠️  'paper-craft'는 신규 ID — 매핑 완료 후 ART_STYLES 상수에 추가 필요.`);
  }

  if (!APPLY) {
    console.log(`\n💡 위 매핑 OK면 \`node scripts/normalize-art-style.mjs --apply\` 로 실제 업데이트.`);
    return;
  }

  // === APPLY ===
  console.log('\n🔥 APPLY 모드 — 실제 업데이트 시작\n');
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const errSamples = [];
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    if (!b || b.__error) { failed++; continue; }
    const original = (b.artStyle ?? '').trim();
    const mapped = normalize(original);
    const prefix = `[${String(i + 1).padStart(3)}/${books.length}] ${b.id} ${trunc(b.title ?? '', 24)}`;
    if (!mapped.id) { console.log(`${prefix} — skip (no-match)`); skipped++; continue; }
    if (mapped.id === original) { skipped++; continue; }
    try {
      const next = { ...b, artStyle: mapped.id };
      await apiJson('/storybooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storybook: next }),
      });
      updated++;
      if (updated % 20 === 0) process.stdout.write(`\r  updated ${updated}    `);
    } catch (e) {
      failed++;
      errSamples.push({ id: b.id, error: e.message });
      if (errSamples.length <= 5) console.log(`${prefix} — FAILED: ${e.message}`);
    }
  }
  process.stdout.write('\n');
  console.log(`\n━━ 완료 ━━\nupdated: ${updated}\nskipped: ${skipped}\nfailed:  ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
