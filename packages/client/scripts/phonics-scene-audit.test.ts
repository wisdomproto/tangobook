// Read-only audit of collected production data with the actual client scene functions.
// pnpm --filter @tangobook/client exec vitest run --config vitest.phonics-audit.config.ts
// PHONICS_AUDIT_ROOT points to books.json, collection.json and live content-status.json.
import fs from 'node:fs';
import process from 'node:process';
import path from 'node:path';
import { test, expect, vi } from 'vitest';
import type { Lang, Storybook } from '@tangobook/shared';
import { apiGet } from '@/lib/axios';
import BASE from '@/features/phonics-learner/data/word-scenes.json';
import CURATED from '@/features/phonics-learner/data/changjak-word-scenes.json';
import {
  hasPhonicsWordScene,
  isReviewedSceneCurrent,
  pickPhonicsWordScene,
  pickUnitStoryScene,
  preloadWordScenes,
} from '@/features/games/lib/phonics-word-scene';
import { hasWord } from '@/features/games/lib/word-in-text';
vi.mock('@/lib/axios', () => ({ apiGet: vi.fn() }));

test('audits current production targets and every referenced scene without writing production', async () => {
  const root = process.env.PHONICS_AUDIT_ROOT;
  if (!root) throw new Error('Set PHONICS_AUDIT_ROOT to the read-only collection directory');
  const read = (file: string) =>
    JSON.parse(fs.readFileSync(path.join(root, file + '.json'), 'utf8'));
  const collection = read('collection');
  expect(collection.failures).toEqual([]);
  const books: Storybook[] = read('books');
  const byId = new Map(books.map((b) => [b.id, b]));
  vi.mocked(apiGet).mockImplementation(
    async (url) => byId.get(decodeURIComponent(url.split('/').at(-1)!)) as never
  );
  const base = BASE as Record<string, Array<[string, number]>>;
  const reviewed = CURATED as unknown as Record<string, Array<[string, number, string]>>;
  const random = vi.spyOn(Math, 'random').mockReturnValue(0.999999);
  const rows = [];
  for (const unit of books
    .filter((b) => b.type === 'phonics' && /^(kr|en)-/.test(b.id))
    .sort((a, b) => a.id.localeCompare(b.id))) {
    const lang: Lang = unit.id.startsWith('kr-') ? 'ko' : 'en';
    for (const word of unit.phonicsConfig?.targetWords ?? []) {
      const key = word.trim().toLowerCase();
      const candidates = [...(base[key] ?? []), ...(reviewed[key] ?? [])];
      const seen = new Set<string>();
      const scenes = candidates.flatMap(([id, n]) => {
        const b = byId.get(id);
        const pair = id + ':' + n;
        if (seen.has(pair)) return [];
        seen.add(pair);
        const page = b?.pages?.[n - 1];
        if (!b || !page || !isReviewedSceneCurrent(word, lang, b, n)) return [];
        const text = lang === 'ko' ? page.text : page.translations?.[lang]?.text;
        const tts = lang === 'ko' ? page.ttsUrl : page.translations?.[lang]?.ttsUrl;
        return [
          {
            id,
            page: n,
            public: !!b.isPublic,
            image: !!page.illustrationUrl,
            text: !!text,
            tts: !!tts,
            wordInText: hasWord(text, word),
            creative: id.startsWith('changjak-'),
            reviewed: !!reviewed[key]?.some(([rid, rn]) => rid === id && rn === n),
          },
        ];
      });
      await preloadWordScenes([word]);
      const chosen = pickPhonicsWordScene(word, lang);
      const own = pickUnitStoryScene(word, lang, unit);
      rows.push({
        unitId: unit.id,
        word,
        lang,
        indexed: hasPhonicsWordScene(word),
        scenes,
        chosenScene: chosen
          ? { image: !!chosen.illustrationUrl, text: !!chosen.pageText, tts: !!chosen.pageTtsUrl }
          : null,
        own: own
          ? {
              image: !!own.illustrationUrl,
              text: !!own.pageText,
              tts: !!own.pageTtsUrl,
              wordInText: hasWord(own.pageText, word),
            }
          : null,
      });
    }
  }
  random.mockRestore();
  const complete = (s: { image: boolean; text: boolean; tts: boolean }) =>
    s.image && s.text && s.tts;
  const tracks = ['ko', 'en'].map((lang) => {
    const r = rows.filter((x) => x.lang === lang);
    const external = (x: (typeof r)[number]) => x.scenes.some((s) => s.public && complete(s));
    const own = (x: (typeof r)[number]) => !!x.own && complete(x.own);
    return {
      lang,
      units: new Set(r.map((x) => x.unitId)).size,
      targets: r.length,
      unique: new Set(r.map((x) => x.word.toLowerCase())).size,
      indexed: r.filter((x) => x.indexed).length,
      externalComplete: r.filter(external).length,
      creativeComplete: r.filter((x) => x.scenes.some((s) => s.creative && s.public && complete(s)))
        .length,
      ownComplete: r.filter(own).length,
      anyComplete: r.filter((x) => external(x) || own(x)).length,
      ownOnly: r.filter((x) => !external(x) && own(x)).length,
      missing: r
        .filter((x) => !external(x) && !own(x))
        .map((x) => ({ unitId: x.unitId, word: x.word })),
      creativeMissing: [
        ...new Set(
          r.filter((x) => !x.scenes.some((s) => s.creative && complete(s))).map((x) => x.word)
        ),
      ],
      suspectCandidates: r.flatMap((x) =>
        x.scenes
          .filter((s) => !s.public || !complete(s) || !s.wordInText)
          .map((s) => ({ word: x.word, unitId: x.unitId, ...s }))
      ),
      chosenComplete: r.filter((x) => x.chosenScene && complete(x.chosenScene)).length,
    };
  });
  const result = {
    at: collection.at,
    scope:
      'Runtime URL/text availability; deterministic last candidate, not playback or semantic review of all legacy scenes',
    canonicalSeam: read('content-status').data.seam.byTrack.filter((x: { track: string }) =>
      ['kr', 'en'].includes(x.track)
    ),
    tracks,
    rows,
  };
  fs.writeFileSync(path.join(root, 'runtime-report.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(tracks, null, 2));
  expect(rows.length).toBe(516);
}, 120000);
