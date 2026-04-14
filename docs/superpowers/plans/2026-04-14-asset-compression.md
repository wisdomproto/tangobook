# Asset Compression Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all R2-stored TTS audio (WAV→MP3) and images (PNG→WebP), migrate existing 60 storybooks, and delete originals after user verification.

**Architecture:** Drop-in transcoding in generation pipeline + 2-phase migration (convert → verify → cleanup) with per-storybook manifest for rollback. URL discovery via generic JSON walker to avoid touching 80+ typed fields.

**Tech Stack:** Node.js + TypeScript + tsx, sharp (WebP), ffmpeg-static (MP3), S3 SDK (R2). No unit test framework exists in server package — use tsx verification scripts instead of formal tests.

**Spec:** `docs/superpowers/specs/2026-04-14-asset-compression-design.md`

---

## Chunk 1: Transcoding utilities

### Task 1: pcmToMp3 + imageToWebp utilities

**Files:**
- Create: `packages/server/src/utils/transcode.ts`
- Create: `packages/server/src/scripts/verify-transcode.ts`

- [ ] **Step 1: Create transcode utility**

Create `packages/server/src/utils/transcode.ts`:

```typescript
import sharp from 'sharp';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

if (!ffmpegPath) {
  throw new Error('ffmpeg-static not available');
}

/**
 * Encode raw PCM (24kHz 16-bit mono) to MP3 (128kbps).
 * Gemini TTS returns PCM; input should NOT be WAV-wrapped.
 */
export async function pcmToMp3(
  pcm: Buffer,
  opts: { sampleRate?: number; channels?: number; bitrate?: string } = {}
): Promise<Buffer> {
  const { sampleRate = 24000, channels = 1, bitrate = '128k' } = opts;
  return runFfmpeg(pcm, [
    '-f', 's16le',
    '-ar', String(sampleRate),
    '-ac', String(channels),
    '-i', 'pipe:0',
    '-codec:a', 'libmp3lame',
    '-b:a', bitrate,
    '-f', 'mp3',
    'pipe:1',
  ]);
}

/**
 * Decode WAV container and re-encode to MP3.
 * Used for migrating existing WAV files in R2.
 */
export async function wavToMp3(wav: Buffer, bitrate = '128k'): Promise<Buffer> {
  return runFfmpeg(wav, [
    '-i', 'pipe:0',
    '-codec:a', 'libmp3lame',
    '-b:a', bitrate,
    '-f', 'mp3',
    'pipe:1',
  ]);
}

/**
 * Convert PNG/JPG buffer to WebP.
 */
export async function imageToWebp(
  input: Buffer,
  opts: { quality?: number } = {}
): Promise<Buffer> {
  const { quality = 85 } = opts;
  return sharp(input).webp({ quality }).toBuffer();
}

function runFfmpeg(input: Buffer, args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath as string, args);
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    proc.stdout.on('data', (c) => chunks.push(c));
    proc.stderr.on('data', (c) => errChunks.push(c));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`ffmpeg exited ${code}: ${Buffer.concat(errChunks).toString()}`));
    });
    proc.stdin.on('error', reject);
    proc.stdin.end(input);
  });
}
```

- [ ] **Step 2: Create verification script**

Create `packages/server/src/scripts/verify-transcode.ts`:

```typescript
import { pcmToMp3, wavToMp3, imageToWebp } from '../utils/transcode.js';
import sharp from 'sharp';

async function main() {
  // Synthetic PCM: 1 second of 440Hz tone at 24kHz
  const sampleRate = 24000;
  const samples = sampleRate;
  const pcm = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const v = Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 16000);
    pcm.writeInt16LE(v, i * 2);
  }

  const mp3 = await pcmToMp3(pcm);
  console.log('[pcmToMp3] input:', pcm.length, 'bytes → output:', mp3.length, 'bytes');
  if (mp3.length < 100) throw new Error('MP3 too small');
  // MP3 frame header starts with 0xFF 0xFB or ID3 ("ID3")
  const header = mp3.slice(0, 3).toString('hex');
  if (!header.startsWith('fffb') && !header.startsWith('fff3') && mp3.slice(0, 3).toString() !== 'ID3') {
    throw new Error('Invalid MP3 header: ' + header);
  }

  // Synthetic PNG: solid 100x100 red
  const png = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
  }).png().toBuffer();

  const webp = await imageToWebp(png);
  console.log('[imageToWebp] PNG', png.length, 'bytes → WebP', webp.length, 'bytes');
  if (webp.slice(0, 4).toString() !== 'RIFF' || webp.slice(8, 12).toString() !== 'WEBP') {
    throw new Error('Invalid WebP header');
  }

  // Round-trip via WAV
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcm.length, 4);
  wavHeader.write('WAVEfmt ', 8);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(1, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(sampleRate * 2, 28);
  wavHeader.writeUInt16LE(2, 32);
  wavHeader.writeUInt16LE(16, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcm.length, 40);
  const wav = Buffer.concat([wavHeader, pcm]);
  const mp3FromWav = await wavToMp3(wav);
  console.log('[wavToMp3] WAV', wav.length, 'bytes → MP3', mp3FromWav.length, 'bytes');
  if (mp3FromWav.length < 100) throw new Error('wavToMp3 output too small');

  console.log('\n✅ All transcode verifications passed');
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
```

- [ ] **Step 3: Run verification**

Run: `pnpm tsx packages/server/src/scripts/verify-transcode.ts`
Expected: `✅ All transcode verifications passed` with nonzero byte counts.

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/utils/transcode.ts packages/server/src/scripts/verify-transcode.ts
git commit -m "feat(server): add transcode utilities (pcmToMp3, wavToMp3, imageToWebp)"
```

---

## Chunk 2: URL walker

### Task 2: Generic JSON URL walker

**Files:**
- Create: `packages/server/src/utils/url-walker.ts`
- Create: `packages/server/src/scripts/verify-url-walker.ts`

- [ ] **Step 1: Create walker**

Create `packages/server/src/utils/url-walker.ts`:

```typescript
/**
 * Recursively walk any JSON-like object/array and collect or transform
 * string values that match a predicate. Returns a new object (does not mutate).
 */
export type UrlTransformer = (url: string, path: string) => string | undefined;

export function walkAndCollect(
  obj: unknown,
  match: (s: string) => boolean,
  path = ''
): Array<{ url: string; path: string }> {
  const out: Array<{ url: string; path: string }> = [];
  if (typeof obj === 'string') {
    if (match(obj)) out.push({ url: obj, path });
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => out.push(...walkAndCollect(v, match, `${path}[${i}]`)));
    return out;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out.push(...walkAndCollect(v, match, path ? `${path}.${k}` : k));
    }
  }
  return out;
}

export function walkAndTransform<T>(obj: T, transform: UrlTransformer, path = ''): T {
  if (typeof obj === 'string') {
    const next = transform(obj, path);
    return (next ?? obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((v, i) => walkAndTransform(v, transform, `${path}[${i}]`)) as unknown as T;
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = walkAndTransform(v, transform, path ? `${path}.${k}` : k);
    }
    return out as T;
  }
  return obj;
}

/** Default matcher: HTTP(S) URL ending in one of the extensions (ignoring query). */
export function makeExtensionMatcher(extensions: string[]): (s: string) => boolean {
  const pattern = new RegExp(
    `^https?://[^\\s"]+\\.(${extensions.join('|')})(\\?.*)?$`,
    'i'
  );
  return (s) => pattern.test(s);
}
```

- [ ] **Step 2: Create verification script**

Create `packages/server/src/scripts/verify-url-walker.ts`:

```typescript
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

// Filter to only R2 URLs (custom matcher)
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
assertEqual('translation tts transformed', transformed.pages[0].translations.en.ttsUrl, 'https://r2.example/p1-en.mp3');
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
```

- [ ] **Step 3: Run verification**

Run: `pnpm tsx packages/server/src/scripts/verify-url-walker.ts`
Expected: All `✓` lines + `✅ url-walker verified`.

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/utils/url-walker.ts packages/server/src/scripts/verify-url-walker.ts
git commit -m "feat(server): add generic JSON URL walker"
```

---

## Chunk 3: Generation pipeline (new content → MP3/WebP)

### Task 3: TTS provider returns MP3

**Files:**
- Modify: `packages/server/src/providers/gemini-tts.provider.ts`
- Modify: `packages/server/src/services/tts.service.ts`

- [ ] **Step 1: Update TTS provider**

Edit `packages/server/src/providers/gemini-tts.provider.ts`:

Replace the `pcmToWav` function and its usage:

```typescript
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';
import { withGeminiRetry } from '../utils/gemini-retry.js';
import { pcmToMp3 } from '../utils/transcode.js';

let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return _ai;
}

export interface TtsOptions {
  text: string;
  voice?: string;
  language?: string;
  retries?: number;
}

export async function generateGeminiTts(options: TtsOptions): Promise<Buffer> {
  const { text, voice = config.gemini.ttsVoice, language = 'ko', retries = 3 } = options;
  const cleaned = text.replace(/\//g, '').trim();
  let prompt: string;
  if (cleaned.length <= 3 && language !== 'ko') {
    prompt = `${cleaned}, ${cleaned}, ${cleaned}`;
  } else if (cleaned.includes('...')) {
    prompt = cleaned.replace(/\.\.\./g, ',');
  } else {
    prompt = cleaned;
  }

  return withGeminiRetry(
    async () => {
      const response = await getAI().models.generateContent({
        model: config.gemini.ttsModel,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.[0];
      if (!audioPart?.inlineData?.data) {
        throw new Error('TTS 응답에 오디오 데이터가 없습니다.');
      }
      const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
      return pcmToMp3(pcmBuffer);
    },
    { retries, baseDelayMs: 2000, context: 'Gemini TTS' }
  );
}
```

- [ ] **Step 2: Update TTS service**

Edit `packages/server/src/services/tts.service.ts` at line 33-37 (case 'gemini'):

```typescript
      case 'gemini':
        audioBuffer = await generateGeminiTts({ text, voice, language });
        ext = 'mp3';
        mimeType = 'audio/mpeg';
        break;
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter server typecheck`
Expected: No errors.

- [ ] **Step 4: E2E smoke test — generate one TTS**

Start server (`PORT=3500 pnpm --filter server dev`). Use any existing storybook UI or curl to trigger TTS generation, then confirm in R2 console that the new file has `.mp3` extension and plays correctly.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/providers/gemini-tts.provider.ts packages/server/src/services/tts.service.ts
git commit -m "feat(server): TTS output as MP3 instead of WAV"
```

### Task 4: Image service outputs WebP

**Files:**
- Modify: `packages/server/src/services/image.service.ts`
- Modify: `packages/server/src/repositories/r2.repository.ts`

- [ ] **Step 1: Add base64-to-webp upload helper in R2Repository**

Edit `packages/server/src/repositories/r2.repository.ts`. Add import and new method:

```typescript
import { imageToWebp } from '../utils/transcode.js';
```

Replace the existing `uploadImage` method to always produce WebP:

```typescript
  async uploadImage(base64: string, key: string): Promise<string> {
    const buf = Buffer.from(base64, 'base64');
    const webp = await imageToWebp(buf);
    const webpKey = key.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    return uploadBufferToR2(webp, webpKey, 'image/webp');
  },
```

- [ ] **Step 2: Change extension in all image.service.ts callers**

Edit `packages/server/src/services/image.service.ts`. Change every `extension: 'png'` (8 occurrences) to `extension: 'webp'`.

Run: `pnpm --filter server typecheck`
Expected: No errors.

- [ ] **Step 3: Check for other uploadImage callers**

Run Grep: `uploadImage\(` across `packages/server/src/`
Expected: Only image.service.ts calls. If any other callers pass non-PNG base64, they still work because `imageToWebp` (via sharp) auto-detects input format.

- [ ] **Step 4: E2E smoke test — generate one image**

Via UI, generate a character or cover image. In R2 confirm the new file has `.webp` extension and renders in the browser.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/repositories/r2.repository.ts packages/server/src/services/image.service.ts
git commit -m "feat(server): store generated images as WebP"
```

---

## Chunk 4: Migration service + CLI

### Task 5: R2 provider helpers for migration

**Files:**
- Modify: `packages/server/src/providers/r2.provider.ts` (check existing helpers)

- [ ] **Step 1: Verify existing R2 helpers**

Run Grep: `export async function` in `packages/server/src/providers/r2.provider.ts`.
Confirm the following exist: `uploadBufferToR2`, `uploadJsonToR2`, `downloadFromR2`, `deleteFromR2`, `listR2Objects`, `urlToR2Key`.

- [ ] **Step 2: Add `objectExists` helper if missing**

If `objectExists` does not exist, add to `packages/server/src/providers/r2.provider.ts`:

```typescript
export async function objectExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({ Bucket: config.r2.bucketName, Key: key }));
    return true;
  } catch (e: unknown) {
    const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return false;
    throw e;
  }
}
```

Import `HeadObjectCommand` at the top:
```typescript
import { HeadObjectCommand } from '@aws-sdk/client-s3';
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter server typecheck`
Expected: No errors.

- [ ] **Step 4: Commit (only if changes made)**

```bash
git add packages/server/src/providers/r2.provider.ts
git commit -m "feat(server): add objectExists helper to R2 provider"
```

### Task 6: Migration service

**Files:**
- Create: `packages/server/src/services/migration.service.ts`

- [ ] **Step 1: Create migration service**

Create `packages/server/src/services/migration.service.ts`:

```typescript
import {
  downloadFromR2,
  uploadBufferToR2,
  uploadJsonToR2,
  deleteFromR2,
  urlToR2Key,
  objectExists,
} from '../providers/r2.provider.js';
import { wavToMp3, imageToWebp } from '../utils/transcode.js';
import {
  walkAndCollect,
  walkAndTransform,
  makeExtensionMatcher,
} from '../utils/url-walker.js';

const STORYBOOK_PREFIX = 'storybook-';
const MIGRATION_PREFIX = '_migrations/';
const BACKUP_PREFIX = '_backup/';

interface Mapping {
  oldUrl: string;
  newUrl: string;
  oldKey: string;
  newKey: string;
  type: 'audio' | 'image';
  oldBytes?: number;
  newBytes?: number;
}

export interface Manifest {
  storybookId: string;
  migratedAt: string;
  backupKey: string;
  mappings: Mapping[];
  stats: { files: number; oldBytes: number; newBytes: number };
}

const match = makeExtensionMatcher(['wav', 'png']);

function classify(url: string): 'audio' | 'image' {
  return /\.wav(\?|$)/i.test(url) ? 'audio' : 'image';
}

function newKeyFor(oldKey: string): string {
  return oldKey.replace(/\.wav$/i, '.mp3').replace(/\.png$/i, '.webp');
}

function newUrlFor(oldUrl: string): string {
  return oldUrl.replace(/\.wav(\?|$)/i, '.mp3$1').replace(/\.png(\?|$)/i, '.webp$1');
}

function manifestKey(storybookId: string, dateIso: string): string {
  return `${MIGRATION_PREFIX}${dateIso.slice(0, 10)}-${storybookId}.json`;
}
function backupKey(storybookId: string, dateIso: string): string {
  return `${BACKUP_PREFIX}${dateIso.slice(0, 10)}-${storybookId}.json`;
}

export const MigrationService = {
  async listAllStorybookIds(): Promise<string[]> {
    const { listR2Objects } = await import('../providers/r2.provider.js');
    const objects = await listR2Objects(STORYBOOK_PREFIX);
    const ids: string[] = [];
    for (const obj of objects) {
      const key = obj.Key;
      if (!key?.endsWith('.json')) continue;
      const id = key.slice(STORYBOOK_PREFIX.length, -'.json'.length);
      ids.push(id);
    }
    return ids;
  },

  async manifestExists(storybookId: string): Promise<boolean> {
    const { listR2Objects } = await import('../providers/r2.provider.js');
    const prefix = `${MIGRATION_PREFIX}`;
    const objects = await listR2Objects(prefix);
    return objects.some((o) => o.Key?.endsWith(`-${storybookId}.json`));
  },

  async convertStorybook(
    storybookId: string,
    opts: { dryRun?: boolean } = {}
  ): Promise<Manifest> {
    const now = new Date().toISOString();
    const jsonKey = `${STORYBOOK_PREFIX}${storybookId}.json`;
    const jsonBuf = await downloadFromR2(jsonKey);
    const json = JSON.parse(jsonBuf.toString('utf-8'));

    // Collect URLs to migrate (only ones that match wav|png and are not already migrated)
    const collected = walkAndCollect(json, match);
    const unique = new Map<string, 'audio' | 'image'>();
    for (const { url } of collected) unique.set(url, classify(url));

    const mappings: Mapping[] = [];
    let oldBytes = 0;
    let newBytes = 0;

    for (const [oldUrl, type] of unique) {
      const oldKey = urlToR2Key(oldUrl);
      const newKey = newKeyFor(oldKey);
      const newUrl = newUrlFor(oldUrl);

      if (opts.dryRun) {
        mappings.push({ oldUrl, newUrl, oldKey, newKey, type });
        continue;
      }

      // Skip if new asset already uploaded (idempotent re-run)
      const already = await objectExists(newKey);
      let outSize = 0;
      if (!already) {
        const srcBuf = await downloadFromR2(oldKey);
        oldBytes += srcBuf.length;
        const out = type === 'audio' ? await wavToMp3(srcBuf) : await imageToWebp(srcBuf);
        outSize = out.length;
        const contentType = type === 'audio' ? 'audio/mpeg' : 'image/webp';
        await uploadBufferToR2(out, newKey, contentType);
        // HEAD verify
        const exists = await objectExists(newKey);
        if (!exists) throw new Error(`Upload verify failed: ${newKey}`);
      }
      newBytes += outSize;
      mappings.push({
        oldUrl,
        newUrl,
        oldKey,
        newKey,
        type,
        oldBytes: already ? undefined : undefined,
        newBytes: outSize || undefined,
      });
    }

    const manifest: Manifest = {
      storybookId,
      migratedAt: now,
      backupKey: backupKey(storybookId, now),
      mappings,
      stats: { files: mappings.length, oldBytes, newBytes },
    };

    if (opts.dryRun) return manifest;

    // Backup original JSON
    await uploadBufferToR2(jsonBuf, manifest.backupKey, 'application/json');

    // Rewrite JSON with new URLs
    const urlMap = new Map(mappings.map((m) => [m.oldUrl, m.newUrl]));
    const rewritten = walkAndTransform(json, (url) => urlMap.get(url));
    await uploadJsonToR2(rewritten, jsonKey);

    // Save manifest
    await uploadJsonToR2(manifest, manifestKey(storybookId, now));

    return manifest;
  },

  async cleanupOldAssets(storybookId: string): Promise<{ deleted: number; errors: string[] }> {
    const { listR2Objects } = await import('../providers/r2.provider.js');
    const candidates = await listR2Objects(MIGRATION_PREFIX);
    const match = candidates.find((o) => o.Key?.endsWith(`-${storybookId}.json`));
    if (!match?.Key) throw new Error(`Manifest not found for ${storybookId}`);
    const manifestBuf = await downloadFromR2(match.Key);
    const manifest = JSON.parse(manifestBuf.toString('utf-8')) as Manifest;

    let deleted = 0;
    const errors: string[] = [];
    for (const m of manifest.mappings) {
      try {
        if (await objectExists(m.oldKey)) {
          await deleteFromR2(m.oldKey);
          deleted++;
        }
      } catch (e) {
        errors.push(`${m.oldKey}: ${(e as Error).message}`);
      }
    }
    return { deleted, errors };
  },

  async restoreFromManifest(storybookId: string): Promise<void> {
    const { listR2Objects } = await import('../providers/r2.provider.js');
    const candidates = await listR2Objects(MIGRATION_PREFIX);
    const match = candidates.find((o) => o.Key?.endsWith(`-${storybookId}.json`));
    if (!match?.Key) throw new Error(`Manifest not found for ${storybookId}`);
    const manifest = JSON.parse(
      (await downloadFromR2(match.Key)).toString('utf-8')
    ) as Manifest;
    const backup = await downloadFromR2(manifest.backupKey);
    const jsonKey = `${STORYBOOK_PREFIX}${storybookId}.json`;
    await uploadBufferToR2(backup, jsonKey, 'application/json');
  },
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter server typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/services/migration.service.ts
git commit -m "feat(server): add migration service (convert/cleanup/restore)"
```

### Task 7: CLI scripts

**Files:**
- Create: `packages/server/src/scripts/migrate-assets.ts`
- Create: `packages/server/src/scripts/cleanup-old-assets.ts`
- Create: `packages/server/src/scripts/restore-from-manifest.ts`

- [ ] **Step 1: Create migrate-assets.ts**

Create `packages/server/src/scripts/migrate-assets.ts`:

```typescript
import 'dotenv/config';
import { MigrationService } from '../services/migration.service.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const id = args.find((a) => a.startsWith('--id='))?.slice('--id='.length);
  const idFlagIdx = args.indexOf('--id');
  const idFromFlag = idFlagIdx >= 0 ? args[idFlagIdx + 1] : undefined;
  return {
    id: id ?? idFromFlag,
    all: args.includes('--all'),
    dryRun: args.includes('--dry-run'),
    resume: args.includes('--resume'),
  };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const { id, all, dryRun, resume } = parseArgs();

  let ids: string[];
  if (id) ids = [id];
  else if (all) ids = await MigrationService.listAllStorybookIds();
  else {
    console.error('Usage: --id <storybookId> | --all [--dry-run] [--resume]');
    process.exit(2);
  }

  console.log(`Target: ${ids.length} storybook(s). dryRun=${dryRun}, resume=${resume}`);

  let totalOld = 0;
  let totalNew = 0;
  const failed: Array<{ id: string; err: string }> = [];

  for (let i = 0; i < ids.length; i++) {
    const sid = ids[i];
    const prefix = `[${i + 1}/${ids.length}] ${sid}`;
    try {
      if (resume && (await MigrationService.manifestExists(sid))) {
        console.log(`${prefix} → skip (manifest exists)`);
        continue;
      }
      const start = Date.now();
      const manifest = await MigrationService.convertStorybook(sid, { dryRun });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      totalOld += manifest.stats.oldBytes;
      totalNew += manifest.stats.newBytes;
      console.log(
        `${prefix} ✓ ${manifest.stats.files} files, ${formatBytes(manifest.stats.oldBytes)} → ${formatBytes(manifest.stats.newBytes)} in ${elapsed}s`
      );
    } catch (e) {
      const msg = (e as Error).message;
      failed.push({ id: sid, err: msg });
      console.error(`${prefix} ✗ ${msg}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Processed: ${ids.length - failed.length}/${ids.length}`);
  console.log(`Total size: ${formatBytes(totalOld)} → ${formatBytes(totalNew)}`);
  if (failed.length > 0) {
    console.log(`Failed (${failed.length}):`);
    for (const f of failed) console.log(`  ${f.id}: ${f.err}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Create cleanup-old-assets.ts**

Create `packages/server/src/scripts/cleanup-old-assets.ts`:

```typescript
import 'dotenv/config';
import { MigrationService } from '../services/migration.service.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const idFlagIdx = args.indexOf('--id');
  return {
    id: idFlagIdx >= 0 ? args[idFlagIdx + 1] : undefined,
    all: args.includes('--all'),
  };
}

async function main() {
  const { id, all } = parseArgs();
  let ids: string[];
  if (id) ids = [id];
  else if (all) ids = await MigrationService.listAllStorybookIds();
  else {
    console.error('Usage: --id <storybookId> | --all');
    process.exit(2);
  }

  let totalDeleted = 0;
  const errors: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    const sid = ids[i];
    try {
      if (!(await MigrationService.manifestExists(sid))) {
        console.log(`[${i + 1}/${ids.length}] ${sid} → skip (no manifest)`);
        continue;
      }
      const { deleted, errors: errs } = await MigrationService.cleanupOldAssets(sid);
      totalDeleted += deleted;
      errors.push(...errs);
      console.log(`[${i + 1}/${ids.length}] ${sid} → deleted ${deleted} objects`);
    } catch (e) {
      errors.push(`${sid}: ${(e as Error).message}`);
      console.error(`[${i + 1}/${ids.length}] ${sid} ✗ ${(e as Error).message}`);
    }
  }

  console.log(`\nTotal deleted: ${totalDeleted}`);
  if (errors.length > 0) {
    console.log(`Errors (${errors.length}):`);
    for (const e of errors) console.log(`  ${e}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: Create restore-from-manifest.ts**

Create `packages/server/src/scripts/restore-from-manifest.ts`:

```typescript
import 'dotenv/config';
import { MigrationService } from '../services/migration.service.js';

async function main() {
  const idFlagIdx = process.argv.indexOf('--id');
  const id = idFlagIdx >= 0 ? process.argv[idFlagIdx + 1] : undefined;
  if (!id) {
    console.error('Usage: --id <storybookId>');
    process.exit(2);
  }
  await MigrationService.restoreFromManifest(id);
  console.log(`Restored JSON for ${id} from manifest backup.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter server typecheck`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/scripts/migrate-assets.ts packages/server/src/scripts/cleanup-old-assets.ts packages/server/src/scripts/restore-from-manifest.ts
git commit -m "feat(server): add migration/cleanup/restore CLI scripts"
```

---

## Chunk 5: Execution (sample → full → cleanup)

### Task 8: Dry-run + single-storybook verification

**Files:** (execution only, no code changes)

- [ ] **Step 1: Dry-run on one storybook**

Pick a test storybook id (ask user; or list via: `pnpm tsx -e "import('./packages/server/src/services/migration.service.js').then(m => m.MigrationService.listAllStorybookIds().then(console.log))"`).

Run: `pnpm tsx packages/server/src/scripts/migrate-assets.ts --id <TEST_ID> --dry-run`
Expected: "✓ N files" with nonzero counts; no R2 writes.

- [ ] **Step 2: Real migration on one storybook**

Run: `pnpm tsx packages/server/src/scripts/migrate-assets.ts --id <TEST_ID>`
Expected: `✓ N files, X MB → Y MB in Z s`. Summary shows 1/1 processed.

- [ ] **Step 3: User verification in viewer**

User opens the test storybook in the viewer (http://localhost:5174) and checks:
- Cover image displays
- Each page image + TTS autoplay works
- For phonics: flashcard images, blending audio
- Remotion audiobook preview (if applicable)

If anything broken: stop here. Run `pnpm tsx packages/server/src/scripts/restore-from-manifest.ts --id <TEST_ID>` to restore.

- [ ] **Step 4: Commit (if any fixes made)**

If debugging required fixes, commit them before proceeding.

### Task 9: Full migration + user spot-check

**Files:** (execution only)

- [ ] **Step 1: Run full migration**

Run: `pnpm tsx packages/server/src/scripts/migrate-assets.ts --all --resume`
Expected: Summary `Processed: N/N`, total size savings reported. Failed list should be empty.

- [ ] **Step 2: User spot-checks 3-5 random storybooks**

User opens multiple storybooks in the viewer and confirms playback works. If any fail: note the ids, restore them (`restore-from-manifest.ts --id <id>`), debug, re-migrate individually.

- [ ] **Step 3: User explicit approval gate**

Do NOT proceed to cleanup until user types approval.

### Task 10: Cleanup originals

**Files:** (execution only)

- [ ] **Step 1: Cleanup one storybook (smoke test)**

Run: `pnpm tsx packages/server/src/scripts/cleanup-old-assets.ts --id <TEST_ID>`
Expected: `→ deleted N objects` with no errors. In R2 console, verify `.wav`/`.png` files for that storybook are gone.

- [ ] **Step 2: Cleanup all**

Run: `pnpm tsx packages/server/src/scripts/cleanup-old-assets.ts --all`
Expected: `Total deleted: <big number>`, Errors 0.

- [ ] **Step 3: Verify R2 has no residual .wav/.png under storybook assets**

Manual: In R2 browser or via listObjects script, search for `*.wav` and `*.png` under storybook asset prefixes. Expect zero.

(Optional script `scripts/check-residual.ts` can be added if manual check is painful — YAGNI for now.)

- [ ] **Step 4: Final commit + push**

All code committed earlier; ensure working tree clean.

```bash
git status
git push origin main
```
