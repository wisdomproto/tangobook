import assert from 'node:assert/strict';
import test from 'node:test';
import { assignNativeEnglishAudio, narrationComparison } from './tts-registration-fields.mjs';

test('native English reaches both readers while preserving original and other languages', () => {
  const page = {
    pageNumber: 1,
    text: 'Look! A cat.',
    scene_description: 'source scene',
    illustrationUrl: 'existing-image',
    translations: { ja: { text: 'other', ttsUrl: 'other-audio' }, en: { reviewed: true } },
    games: [{ type: 'quiz' }],
  };
  const before = structuredClone(page);
  assignNativeEnglishAudio(page, before.text, 'new-en-mp3');
  assert.equal(page.ttsUrl, 'new-en-mp3');
  assert.equal(page.translations.en.ttsUrl, 'new-en-mp3');
  assert.equal(page.translations.en.text, before.text);
  assert.equal(page.translations.en.reviewed, true);
  assert.deepEqual(page.translations.ja, before.translations.ja);
  for (const key of ['text', 'scene_description', 'illustrationUrl', 'games'])
    assert.deepEqual(page[key], before[key]);
});

test('source conflicts and either existing audio field cannot be overwritten', () => {
  for (const page of [
    { text: 'changed' },
    { text: 'source', ttsUrl: 'existing' },
    { text: 'source', translations: { en: { ttsUrl: 'existing' } } },
    { text: 'source', translations: { en: { text: 'different' } } },
  ]) {
    const before = structuredClone(page);
    assert.throws(() => assignNativeEnglishAudio(page, 'source', 'new'));
    assert.deepEqual(page, before);
  }
});

test('combined task permits only missing illustration additions, preserving old images and narration', () => {
  const before = {
    id: 'en-b1-u01',
    type: 'phonics',
    pages: [
      { pageNumber: 1, text: 'source', ttsUrl: 'audio' },
      { pageNumber: 2, text: 'another', illustrationUrl: 'old', ttsUrl: 'audio2' },
    ],
  };
  const updated = structuredClone(before);
  updated.pages[0].illustrationUrl = 'new';
  updated.updatedAt = 'later';
  assert.deepEqual(
    narrationComparison(updated, before, true),
    narrationComparison(before, before, true)
  );
  for (const change of [
    (x) => (x.pages[1].illustrationUrl = 'replacement'),
    (x) => (x.pages[0].ttsUrl = 'replacement'),
    (x) => (x.pages[0].text = 'edited'),
    (x) => (x.pages[0].games = []),
  ]) {
    const invalid = structuredClone(updated);
    change(invalid);
    assert.notDeepEqual(
      narrationComparison(invalid, before, true),
      narrationComparison(before, before, true)
    );
  }
  assert.notDeepEqual(narrationComparison(updated, before), narrationComparison(before, before));
});
