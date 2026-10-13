import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildReviewedScenes } from './build-changjak-word-scenes.mjs';
const sourceText = '엄마가 가위로 종이를 잘랐어요.';
const book = { id: 'changjak-mio-11', isPublic: true, pages: [{ pageNumber: 1, text: sourceText, illustrationUrl: 'p.webp', ttsUrl: 'p.mp3' }] };
const unit = { id: 'kr-h4-u03', type: 'phonics', phonicsConfig: { targetWords: ['가위'] } };
const ref = { word: '가위', lang: 'ko', bookId: book.id, pageNumber: 1, sourceText,
  sourceSha256: crypto.createHash('sha256').update(sourceText).digest('hex'),
  reviewed: true, targetSense: 'paper-cutting scissors', phonicsUnitIds: [unit.id] };
test('links the reviewed scene and retains its exact source for runtime validation', () => {
  assert.deepEqual(buildReviewedScenes([book, unit], { entries: [ref] }), { 가위: [[book.id, 1, sourceText]] });
});
test('refuses an unreviewed spelling match', () => {
  assert.throws(() => buildReviewedScenes([book, unit], { entries: [{ ...ref, reviewed: false }] }));
});
test('rejects a changed meaning even when the spelling still matches', () => {
  const changed = { ...book, pages: [{ ...book.pages[0], text: '가위, 바위, 보!' }] };
  assert.throws(() => buildReviewedScenes([changed, unit], { entries: [ref] }), /source changed/);
});
test('refuses a private book, missing narration, or a non-target word', () => {
  assert.throws(() => buildReviewedScenes([{ ...book, isPublic: false }, unit], { entries: [ref] }), /not public/);
  assert.throws(() => buildReviewedScenes([{ ...book, pages: [{ ...book.pages[0], ttsUrl: '' }] }, unit], { entries: [ref] }), /Incomplete/);
  assert.throws(() => buildReviewedScenes([book, { ...unit, phonicsConfig: { targetWords: [] } }], { entries: [ref] }), /target/);
});
