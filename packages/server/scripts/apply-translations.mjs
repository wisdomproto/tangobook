#!/usr/bin/env node
/**
 * classics-translations.json 의 영어 번역을 각 책의 keyObject 에 적용.
 * - GET /api/storybooks/:id 로 책 fetch
 * - key_objects[*] 의 korean 매칭 → nameEn (없으면), eng 도 같이 채움
 * - POST /api/storybooks 로 저장
 *
 * 사용: node packages/server/scripts/apply-translations.mjs [translations-file]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TR_FILE = process.argv[2] || path.join(__dirname, '_data', 'classics-translations.json');

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const j = await res.json();
  return j.data ?? j;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`${res.status} ${url} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function extractKo(k) {
  return (k.korean || k.kor || k.name || '').trim();
}
function extractEn(k) {
  return (k.nameEn || k.eng || k.english || '').trim();
}

async function main() {
  const map = JSON.parse(fs.readFileSync(TR_FILE, 'utf-8'));
  const bookIds = Object.keys(map);
  console.log(`적용 대상: ${bookIds.length} 책\n`);

  let ok = 0;
  let failed = 0;
  let totalUpdated = 0;
  const skipped = [];

  for (let i = 0; i < bookIds.length; i++) {
    const id = bookIds[i];
    const { title, tr } = map[id];
    try {
      const book = await getJSON(`${BASE}/api/storybooks/${id}`);
      const keyObjs = book.key_objects || book.keyObjects || [];
      let updatedCount = 0;
      const stillMissing = [];

      for (const k of keyObjs) {
        const ko = extractKo(k);
        if (!ko) continue;
        const en = tr[ko];
        if (!en) {
          if (!extractEn(k) || /[가-힣]/.test(extractEn(k))) stillMissing.push(ko);
          continue;
        }
        const curEn = extractEn(k);
        if (curEn && !/[가-힣]/.test(curEn) && curEn !== ko) continue; // 이미 정상 영어
        k.nameEn = en;
        k.eng = en;
        if (k.name && /[가-힣]/.test(k.name)) {
          // name 도 영어로 통일 (기존 패턴 — keyObject.name 은 영어 식별자)
          k.name = en;
        }
        updatedCount++;
      }

      if (updatedCount > 0) {
        await postJSON(`${BASE}/api/storybooks`, { storybook: book });
        ok++;
        totalUpdated += updatedCount;
        console.log(`✓ ${title.padEnd(30)} → ${updatedCount} 단어 번역${stillMissing.length ? ` (남은: ${stillMissing.join(',')})` : ''}`);
      } else {
        skipped.push({ id, title, reason: 'no updates' });
        console.log(`○ ${title.padEnd(30)} → 변경 없음`);
      }
    } catch (e) {
      failed++;
      console.error(`✗ ${title} : ${e.message}`);
    }
  }

  console.log(`\n=== 결과 ===`);
  console.log(`성공: ${ok} 책 / ${totalUpdated} 단어`);
  console.log(`변경 없음: ${skipped.length}`);
  console.log(`실패: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
