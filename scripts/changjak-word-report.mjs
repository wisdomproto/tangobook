import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const root = path.resolve('generated-images/changjak-words');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const cards = read('cropped.json'),
  jobs = read('jobs.json').jobs,
  reviews = read('reviews.json'),
  ledger = read('registration.json');
assert(ledger.completedAt, 'registration incomplete');
assert.equal(cards.length, read('cards.json').length);
assert.equal(Object.keys(ledger.books).length, 500);
assert(Object.values(ledger.books).every((b) => b.verified));
assert.equal(new Set(ledger.verified).size, cards.length);
for (const c of cards) assert.equal(hash(c.file), c.sha256, c.id + ' changed after registration');
const report = {
  version: 1,
  generatedWith: 'ChatGPT subscription-native OpenAI image_gen',
  completedAt: ledger.completedAt,
  books: 500,
  uniqueCards: cards.length,
  bookWordLinks: cards.reduce((n, c) => n + c.uses.length, 0),
  pagePolicy:
    'Existing pages, illustrations, audio, translations, covers and characters preserved; missing keyObjectImages filled only.',
  sheets: jobs.map((j) => {
    assert.equal(reviews[j.id]?.status, 'pass', j.id + ' unreviewed');
    assert.equal(hash(j.out), reviews[j.id].sha256, j.id + ' changed after visual review');
    const bytes = fs.readFileSync(j.out);
    return {
      id: j.id,
      sha256: hash(j.out),
      size: [bytes.readUInt32BE(16), bytes.readUInt32BE(20)],
      review: reviews[j.id],
      references: (j.references || []).map((file) => ({
        file: path.relative(root, file).replaceAll('\\', '/'),
        sha256: hash(file),
      })),
    };
  }),
  cards: cards.map((c) => ({
    id: c.id,
    series: c.series,
    word: c.word,
    variant: c.variant,
    url: ledger.uploaded[c.id].url,
    sha256: c.sha256,
    size: c.size,
    bytes: c.bytes,
    uses: c.uses.map(({ bookId, objectName, pages }) => ({ bookId, objectName, pages })),
  })),
  registration: Object.entries(ledger.books).map(([id, b]) => ({
    bookId: id,
    added: b.added,
    existingPagesPreserved: b.verified,
  })),
};
const out = path.resolve('docs/work/content/tasks/20261003-changjak-word-images.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({
    file: out,
    books: report.books,
    cards: report.uniqueCards,
    links: report.bookWordLinks,
    sheets: report.sheets.length,
  })
);
