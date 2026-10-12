// Read existing assets and exactly named R2 audio objects; no remote writes.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const assets = join(root, 'packages/remotion/public/hangul-sample-20261012');
await mkdir(assets, { recursive: true });
const copies = {
  'meeting.riv': 'output/rive-hangul-meet-20261012/sample.riv',
  'giyok-body.png': 'output/rive-hangul-meet-20261012/giyok-body.png',
  'a-body.png': 'output/rive-hangul-meet-20261012/a-body.png',
  'Pretendard-Regular.otf': 'packages/client/public/fonts/Pretendard-Regular.otf',
  'FONT-LICENSE.txt': 'packages/client/public/fonts/Pretendard-LICENSE.txt',
  'letter-g.mp3': 'packages/remotion/public/phonics/audio/letter-g.mp3',
  'vowel-a.mp3': 'packages/remotion/public/phonics/audio/vowel-a.mp3',
  'syllable-ga.mp3': 'packages/remotion/public/phonics/audio/syl-ga.mp3',
  'blend-ga.mp3': 'packages/remotion/public/phonics/audio/blend-ga.mp3',
  'bgm.mp3': 'packages/remotion/public/phonics/audio/bgm.mp3',
  'correct.mp3': 'packages/client/public/sounds/learning/correct.mp3',
  'complete.mp3': 'packages/client/public/sounds/learning/complete.mp3',
  'write-guide.mp3': 'packages/client/public/sounds/voice/write-trace-ko.mp3',
};
const records = [];
for (const [name, source] of Object.entries(copies)) {
  await copyFile(join(root, source), join(assets, name));
  records.push({
    name,
    source,
    sha256: createHash('sha256')
      .update(await readFile(join(assets, name)))
      .digest('hex'),
  });
}
// Direct SDK GET avoids triggering any application scheduler or concat writes.
const requireServer = createRequire(join(root, 'packages/server/package.json'));
const { S3Client, GetObjectCommand } = requireServer('@aws-sdk/client-s3');
const client = new S3Client({
  region: 'auto',
  endpoint: 'https://' + process.env.R2_ACCOUNT_ID + '.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  maxAttempts: 2,
});
const get = async (key) => {
  const r = await client.send(
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
  );
  return Buffer.from(await r.Body.transformToByteArray());
};
const key = 'phonics-library/mod_korean/방.mp3';
const bang = await readFile(join(assets, 'syllable-bang.mp3')).catch(() => get(key));
await writeFile(join(assets, 'syllable-bang.mp3'), bang);
records.push({
  name: 'syllable-bang.mp3',
  source: key,
  sha256: createHash('sha256').update(bang).digest('hex'),
});
execFileSync('ffmpeg', [
  '-y',
  '-v',
  'error',
  '-i',
  join(assets, 'syllable-ga.mp3'),
  '-i',
  join(assets, 'syllable-bang.mp3'),
  '-filter_complex',
  '[0:a]silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse[a];[1:a]silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse[b];[a][b]concat=n=2:v=0:a=1[out]',
  '-map',
  '[out]',
  '-ar',
  '48000',
  '-ac',
  '1',
  join(assets, 'word-gabang.wav'),
]);
records.push({
  name: 'word-gabang.wav',
  source: ['syllable-ga.mp3', 'syllable-bang.mp3'],
  sha256: createHash('sha256')
    .update(await readFile(join(assets, 'word-gabang.wav')))
    .digest('hex'),
  note: 'Existing syllables concatenated with no inter-syllable silence.',
});
const bag = await readFile(join(assets, 'bag.png')).catch(() => null);
if (bag)
  records.push({
    name: 'bag.png',
    source: 'built-in imagegen; image-prompt.txt',
    sha256: createHash('sha256').update(bag).digest('hex'),
  });
await writeFile(
  join(assets, 'sources.json'),
  JSON.stringify({ remoteOperations: 'GET only', records }, null, 2) + '\n'
);
console.log('Prepared ' + records.length + ' local assets; no remote writes.');
