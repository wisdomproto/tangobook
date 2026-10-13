// Read-only inventory: use actual game asset selection, distinguish concat sources from saved TTS.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { test, expect } from 'vitest';
import { neutralizeKoreanFinal, type Storybook } from '@tangobook/shared';
import { findImageData } from '@/features/phonics-learner/lib/phonics-game-adapter';
import { r2AssetKey } from '@/features/library/lib/content-audit';

test('audits active phonics cards and Hori pages, excluding retired zodiac story pages', () => {
  const root = process.env.PHONICS_AUDIT_ROOT;
  if (!root) throw new Error('Set PHONICS_AUDIT_ROOT');
  const read = (file: string) =>
    JSON.parse(fs.readFileSync(path.join(root, file + '.json'), 'utf8'));
  expect(read('collection').failures).toEqual([]);
  const books: Storybook[] = read('books');
  const keys = new Set<string>(read('objects').map((o: { key: string }) => o.key));
  const present = (url?: string) =>
    !!url?.trim() && (!r2AssetKey(url) || keys.has(r2AssetKey(url)!));
  function tokenSource(token: string, lang: 'ko' | 'en') {
    const candidates = [token, token.toLowerCase()];
    if (/^[A-Za-z]+$/.test(token) && new Set(token.toLowerCase()).size === 1)
      candidates.push(token[0].toLowerCase());
    const stripped = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (stripped) candidates.push(stripped);
    const neutral = neutralizeKoreanFinal(token);
    if (neutral) candidates.push(neutral);
    const categories =
      lang === 'ko' ? ['mod_korean', 'mod_phonics'] : ['mod_phonics', 'mod_english'];
    for (const word of candidates)
      for (const cat of categories) {
        const normal = `phonics-library/${cat}/${word}.mp3`;
        if (keys.has(normal)) return normal;
        const garbled = `phonics-library/${cat}/${Buffer.from(word).toString('latin1')}.mp3`;
        if (keys.has(garbled)) return garbled;
      }
    return null;
  }
  const rows = books
    .filter((b) => b.type === 'phonics' && /^(kr|en)-/.test(b.id))
    .flatMap((book) => {
      const lang = book.id.startsWith('kr-') ? ('ko' as const) : ('en' as const);
      return (book.phonicsConfig?.targetWords ?? []).map((word) => {
        const asset = findImageData(book, word);
        const tokens = word.split(/ +/).flatMap((w) => (/[가-힣]/.test(w) ? [...w] : [w]));
        const sources = tokens.map((token) => ({ token, key: tokenSource(token, lang) }));
        return {
          unitId: book.id,
          lang,
          word,
          image: present(asset.imageUrl),
          imageUrl: asset.imageUrl,
          imageBroken: !!asset.imageUrl && !present(asset.imageUrl),
          savedTts: present(asset.ttsUrl),
          ttsUrl: asset.ttsUrl,
          ttsBroken: !!asset.ttsUrl && !present(asset.ttsUrl),
          concatSourcesAvailable: sources.every((s) => !!s.key),
          missingTokens: sources.filter((s) => !s.key).map((s) => s.token),
        };
      });
    });
  const tracks = ['ko', 'en'].map((lang) => {
    const r = rows.filter((x) => x.lang === lang);
    return {
      lang,
      targets: r.length,
      images: r.filter((x) => x.image).length,
      missingImages: r
        .filter((x) => !x.image)
        .map((x) => ({ unitId: x.unitId, word: x.word, broken: x.imageBroken })),
      savedTts: r.filter((x) => x.savedTts).length,
      savedOrConcatSources: r.filter((x) => x.savedTts || x.concatSourcesAvailable).length,
      missingAudioSources: r
        .filter((x) => !x.savedTts && !x.concatSourcesAvailable)
        .map((x) => ({ unitId: x.unitId, word: x.word, missingTokens: x.missingTokens })),
      brokenTts: r.filter((x) => x.ttsBroken).map((x) => ({ unitId: x.unitId, word: x.word })),
    };
  });
  const hori = books.filter((b) => b.type === 'phonics' && b.id.startsWith('kr-'));
  const pageMissing = hori.flatMap((b) =>
    b.pages.flatMap((p) => {
      const missing = [];
      if (!present(p.illustrationUrl)) missing.push('illustration');
      if (p.text?.trim() && !present(p.ttsUrl)) missing.push('koTts');
      return missing.length ? [{ unitId: b.id, page: p.pageNumber, missing }] : [];
    })
  );
  const result = {
    collectedAt: read('collection').completedAt,
    scope: '71 active lesson units; retired English zodiac pages are not required assets',
    tracks,
    rows,
    hori: { units: hori.length, pages: hori.reduce((n, b) => n + b.pages.length, 0), pageMissing },
    excludedRetiredStoryUnits: books.filter(
      (b) => b.type === 'phonics' && b.id.startsWith('en-') && !b.pages.length
    ).length,
    limitation:
      'Concat source availability is not generated audio or a listening test; no production writes.',
  };
  fs.writeFileSync(path.join(root, 'phonics-assets-report.json'), JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      { tracks, hori: result.hori, excluded: result.excludedRetiredStoryUnits },
      null,
      2
    )
  );
  expect(rows).toHaveLength(516);
  expect(hori).toHaveLength(32);
}, 120000);
