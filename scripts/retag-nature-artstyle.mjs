// 자연관찰 폴더의 모든 책 artStyle → 'photographic'
// 기존 'Modern Illustration' 표기가 실사/도감 스타일이라 네이밍 통일.
//
// 서버 localhost:3500 필요.
//
// 실행: node scripts/retag-nature-artstyle.mjs

const API = 'http://localhost:3500/api';
const TARGET = 'photographic';

async function apiJson(path, init) {
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${res.status} ${path}: ${text.slice(0, 200)}`);
  }
  if (!res.ok || json.success === false) {
    throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 200)}`);
  }
  return json.data;
}

async function main() {
  const list = await apiJson('/storybooks');
  const targets = list.filter(
    (s) => s.folder && s.folder.startsWith('자연관찰') && s.type !== 'phonics',
  );
  console.log(`대상: ${targets.length}권 (folder startsWith '자연관찰')`);
  console.log(`artStyle → '${TARGET}'`);
  console.log('');

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const tag = `[${String(i + 1).padStart(2, '0')}/${targets.length}] ${t.id} ${t.title.slice(0, 30)}`;
    try {
      const sb = await apiJson(`/storybooks/${t.id}`);
      if (sb.artStyle === TARGET) {
        console.log(`${tag} — skip (이미 ${TARGET})`);
        skipped++;
        continue;
      }
      await apiJson('/storybooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storybook: { ...sb, artStyle: TARGET } }),
      });
      console.log(`${tag} — ${sb.artStyle} → ${TARGET}`);
      updated++;
    } catch (err) {
      console.error(`${tag} — FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n━━ 완료 ━━\nupdated: ${updated}\nskipped: ${skipped}\nfailed:  ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('스크립트 오류:', e);
  process.exit(1);
});
