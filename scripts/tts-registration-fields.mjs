import assert from 'node:assert/strict';

export function assertNativeEnglishTarget(page, text) {
  assert.equal(page.text, text, 'Native English source changed');
  assert(!page.ttsUrl, 'Existing native audio must be preserved');
  assert(
    !page.translations?.en?.ttsUrl,
    'Existing English audio must be preserved; reconcile the base URL before registering'
  );
  if (page.translations?.en?.text)
    assert.equal(page.translations.en.text, text, 'New English source conflict');
}

export function assignNativeEnglishAudio(page, text, url) {
  assertNativeEnglishTarget(page, text);
  page.ttsUrl = url;
  page.translations = { ...page.translations, en: { ...page.translations?.en, text, ttsUrl: url } };
}

export function narrationComparison(book, before, allowMissingPhonicsIllustrations = false) {
  const result = structuredClone(book);
  delete result.updatedAt;
  if (allowMissingPhonicsIllustrations) {
    assert(
      before.type === 'phonics' && before.id.startsWith('en-'),
      'Native English comparison scope'
    );
    for (const original of before.pages) {
      if (original.illustrationUrl) continue;
      const number = original.pageNumber ?? original.page_number;
      const page = result.pages.find((p) => (p.pageNumber ?? p.page_number) === number);
      assert(page, 'A registered page was removed');
      delete page.illustrationUrl;
    }
  }
  return result;
}
