// Build the master snapshot using the exact client game/card builders, without remote writes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Storybook } from '@tangobook/shared';
import {
  auditLibraryBook,
  r2AssetKey,
  completeCount,
  readingReady,
  type LibraryContentAudit,
} from '../../client/src/features/library/lib/content-audit';
import catalog from '../../client/src/features/games/data/scene-coloring-catalog.json';
import type { SceneColoringCatalog } from '../../client/src/features/games/lib/editor-scene-coloring';
const dir = process.argv[2] ?? 'D:/tangobook-inventory/20261012';
const read = (name: string) => JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8'));
const books: Storybook[] = read('books');
const collection = read('collection');
if (collection.failures.length) throw new Error('Collection was incomplete');
const keys = new Set<string>(read('objects').map((o: { key: string }) => o.key));
const index = read('coloring-book-index');
const manifest: { unitId: string; word: string; lineartUrl: string }[] = read('coloring-manifest');
const brokenSheets = new Map<string, string[]>();
for (const sheet of manifest) {
  const key = r2AssetKey(sheet.lineartUrl);
  if (key && !keys.has(key))
    brokenSheets.set(sheet.unitId, [...(brokenSheets.get(sheet.unitId) ?? []), sheet.word]);
}
const storybooks = books.filter((b) => !b.type || b.type === 'storybook');
const snapshot: LibraryContentAudit = {
  generatedAt: collection.completedAt,
  assetCheckedAt: collection.completedAt,
  rows: storybooks.map((b) =>
    auditLibraryBook(
      b,
      index,
      catalog as SceneColoringCatalog,
      keys,
      brokenSheets.get(b.splitFrom?.bookId ?? b.id)
    )
  ),
  fetchFailed: [],
  excludedPhonics: books.length - storybooks.length,
};
const publicFile = fileURLToPath(
  new URL('../../client/public/library-content-audit.json', import.meta.url)
);
fs.writeFileSync(publicFile, JSON.stringify(snapshot));
fs.writeFileSync(path.join(dir, 'library-content-audit.json'), JSON.stringify(snapshot, null, 2));
const categories = [...new Set(snapshot.rows.map((r) => r.category))].sort();
const table = [
  '|카테고리|권수|삽화 완비|한글 TTS|영어 TTS·번역|어휘 삽화|단어 색칠|장면 색칠|숨은그림|',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
];
for (const cat of ['전체', ...categories]) {
  const rows = cat === '전체' ? snapshot.rows : snapshot.rows.filter((r) => r.category === cat);
  table.push(
    `|${cat}|${rows.length}|${rows.filter((r) => completeCount(r.illustrations)).length}|${rows.filter((r) => completeCount(r.ko)).length}|${rows.filter((r) => completeCount(r.en) && completeCount(r.english)).length}|${rows.filter((r) => !r.vocabularyHidden && completeCount(r.words)).length}|${rows.filter((r) => !r.vocabularyHidden && r.coloring.ko).length}|${rows.filter((r) => r.sceneColoring).length}|${rows.filter((r) => r.hiddenPlayable).length}|`
  );
}
const summary = {
  books: snapshot.rows.length,
  phonics: snapshot.excludedPhonics,
  public: snapshot.rows.filter((r) => r.public).length,
  readyKo: snapshot.rows.filter(readingReady).length,
  missingIllustrations: snapshot.rows.reduce((n, r) => n + r.illustrations.missing.length, 0),
  brokenIllustrations: snapshot.rows.reduce((n, r) => n + r.illustrations.broken.length, 0),
  missingKo: snapshot.rows.reduce((n, r) => n + r.ko.missing.length, 0),
  missingEn: snapshot.rows.reduce((n, r) => n + r.en.missing.length, 0),
  brokenAudio: snapshot.rows.reduce((n, r) => n + r.ko.broken.length + r.en.broken.length, 0),
};
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(dir, 'summary.md'), table.join('\n') + '\n');
console.log(summary);
console.log(table.join('\n'));
