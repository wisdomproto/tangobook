// Only reviewed, source-bound meanings. Never infer a link from spelling alone.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export function buildReviewedScenes(books, references) {
  const byId = new Map(books.map(b => [b.id, b]));
  const index = {};
  for (const ref of references.entries) {
    assert.equal(ref.reviewed, true, 'Unreviewed meaning');
    assert(ref.targetSense?.trim(), 'Target meaning missing');
    assert(/^changjak-[a-z]+-\d+$/.test(ref.bookId) || ref.collection === 'public-reviewed', 'Wrong collection');
    assert(['ko', 'en'].includes(ref.lang), 'Unsupported language');
    const book = byId.get(ref.bookId);
    assert(book?.isPublic, ref.bookId + ' is not public');
    const page = book.pages?.find(p => (p.pageNumber ?? p.page_number) === ref.pageNumber);
    const text = ref.lang === 'ko' ? page?.text : page?.translations?.en?.text;
    assert.equal(text, ref.sourceText, 'Reviewed source changed');
    assert.equal(crypto.createHash('sha256').update(text).digest('hex'), ref.sourceSha256);
    assert(page.illustrationUrl && (ref.lang === 'ko' ? page.ttsUrl : page.translations?.en?.ttsUrl), 'Incomplete scene');
    assert(ref.phonicsUnitIds.length && ref.phonicsUnitIds.every(id => {
      const unit = byId.get(id);
      return unit?.type === 'phonics' && unit.phonicsConfig?.targetWords?.some(w => w.toLowerCase() === ref.word.toLowerCase());
    }), 'Not an actual phonics target');
    // Runtime retains the reviewed text to reject a changed meaning after publication.
    const word = ref.word.trim().toLowerCase();
    const rows = index[word] ??= [];
    assert(!rows.some(([id, n]) => id === ref.bookId && n === ref.pageNumber), 'Duplicate scene');
    rows.push([ref.bookId, ref.pageNumber, text]);
  }
  return index;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const books = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const references = JSON.parse(fs.readFileSync('docs/work/phonics/tasks/20261012-changjak-word-scene-references.json', 'utf8'));
  const index = buildReviewedScenes(books, references);
  fs.writeFileSync('packages/client/src/features/phonics-learner/data/changjak-word-scenes.json', JSON.stringify(index));
  console.log(JSON.stringify({ words: Object.keys(index).length, scenes: references.entries.length,
    series: new Set(references.entries.filter(r => r.bookId.startsWith('changjak-')).map(r => r.bookId.split('-')[1])).size }));
}
