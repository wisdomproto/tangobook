import { walkAndCollect, walkAndTransform, makeExtensionMatcher } from '../utils/url-walker.js';

function assertEqual<T>(name: string, actual: T, expected: T) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${name} mismatch\n  actual:   ${a}\n  expected: ${e}`);
  console.log(`✓ ${name}`);
}

const sample = {
  title: 'test',
  coverImage: 'https://r2.example/a.png',
  pages: [
    {
      imageUrl: 'https://r2.example/p1.png',
      ttsUrl: 'https://r2.example/p1.wav',
      text: 'hello',
      translations: { en: { ttsUrl: 'https://r2.example/p1-en.wav' } },
    },
  ],
  alreadyNew: 'https://r2.example/x.webp',
  notAUrl: 'something.png',
  externalUnchanged: 'https://external.com/other.png',
};

const match = makeExtensionMatcher(['wav', 'png']);

const r2Match = (s: string) => match(s) && s.includes('r2.example');
const collected = walkAndCollect(sample, r2Match);
assertEqual('collected count', collected.length, 4);
assertEqual('collected paths', collected.map((c) => c.path).sort(), [
  'coverImage',
  'pages[0].imageUrl',
  'pages[0].translations.en.ttsUrl',
  'pages[0].ttsUrl',
]);

const transformed = walkAndTransform(sample, (url) => {
  if (!r2Match(url)) return undefined;
  return url.replace(/\.wav$/, '.mp3').replace(/\.png$/, '.webp');
});

assertEqual('cover transformed', transformed.coverImage, 'https://r2.example/a.webp');
assertEqual('page image transformed', transformed.pages[0].imageUrl, 'https://r2.example/p1.webp');
assertEqual('page tts transformed', transformed.pages[0].ttsUrl, 'https://r2.example/p1.mp3');
assertEqual(
  'translation tts transformed',
  transformed.pages[0].translations.en.ttsUrl,
  'https://r2.example/p1-en.mp3'
);
assertEqual('already-new untouched', transformed.alreadyNew, 'https://r2.example/x.webp');
assertEqual('non-URL untouched', transformed.notAUrl, 'something.png');
assertEqual('external untouched', transformed.externalUnchanged, 'https://external.com/other.png');
assertEqual('original not mutated (coverImage)', sample.coverImage, 'https://r2.example/a.png');

// Idempotency
const twice = walkAndTransform(transformed, (url) => {
  if (!r2Match(url)) return undefined;
  return url.replace(/\.wav$/, '.mp3').replace(/\.png$/, '.webp');
});
assertEqual('idempotent', twice, transformed);

console.log('\n✅ url-walker verified');
