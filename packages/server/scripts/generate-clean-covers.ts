// 동화책 표지의 베이크된 제목/장식 텍스트를 Gemini 이미지 편집으로 지운 "클린 표지"를 배치 생성.
// 릴스 썸네일 히어로용 — 표지는 가장 아이코닉한 대표 샷이지만 위쪽에 만화 제목이 구워져 있어,
// 텍스트를 지우고 배경을 자연스럽게 채운 버전을 만든다. 결과 URL은 clean-covers.json 에 매핑 저장.
//
// 실행:
//   dry-run(로컬 out/clean-covers 에 저장, R2/맵 미기록):
//     pnpm --filter @tangobook/server exec tsx scripts/generate-clean-covers.ts --book=<id> --dry-run
//   전체(R2 업로드 + 맵 기록, 멱등 — 이미 있는 책 skip):
//     pnpm --filter @tangobook/server exec tsx scripts/generate-clean-covers.ts
//   재생성: --force
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { generateImageWithGemini } from '../src/providers/gemini.provider.js';
import { uploadBase64ToR2 } from '../src/providers/r2.provider.js';
import {
  resolveClassicBookIds,
  resolveNatureBookIds,
  fetchStorybook,
} from '../src/services/reel/reel-targets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(__dirname, '_data', 'marketing', 'clean-covers.json');
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3.1-flash-image-preview';

const PROMPT = `Edit this children's book cover: remove ALL text, Korean and English letters, numbers, and every decorative title/sticker graphic (hearts, stars, sparkles, ribbons, speech bubbles, badges) — especially any big title at the top. Seamlessly reconstruct and extend the natural background of the scene (sky, clouds, water, ground, foliage, etc.) to fill exactly where the text and stickers were, matching the existing art style, colors, lighting and perspective so it looks like one clean, complete illustration. Keep the main subject (the animal / character / object) and the rest of the artwork exactly the same, in the same wide 16:9 composition. The final image must contain absolutely NO text, letters, numbers, or sticker graphics anywhere — just the clean scene.`;

function loadMap(): Record<string, string> {
  return fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, 'utf8')) : {};
}
function saveMap(m: Record<string, string>): void {
  fs.mkdirSync(path.dirname(MAP_PATH), { recursive: true });
  fs.writeFileSync(MAP_PATH, JSON.stringify(m, null, 1));
}

function argVal(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/** 표지 URL → PNG base64 (Gemini 레퍼런스용, webp/한글파일명 정규화). */
async function coverToPngBase64(url: string): Promise<string> {
  const res = await fetch(encodeURI(url));
  if (!res.ok) throw new Error(`cover fetch ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const png = await sharp(buf).png().toBuffer();
  return png.toString('base64');
}

async function withRetry<T>(fn: () => Promise<T>, n = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw last;
}

async function main() {
  const dryRun = hasFlag('dry-run');
  const force = hasFlag('force');
  const book = argVal('book');
  const limit = argVal('limit') ? Number(argVal('limit')) : undefined;

  let ids: string[];
  if (book) {
    ids = [book];
  } else {
    const classics = (() => {
      try {
        return resolveClassicBookIds();
      } catch {
        return [];
      }
    })();
    ids = [...new Set([...classics, ...resolveNatureBookIds()])];
  }
  if (limit != null) ids = ids.slice(0, limit);

  const map = loadMap();
  const outDir = path.resolve(process.cwd(), 'out/clean-covers');
  if (dryRun) fs.mkdirSync(outDir, { recursive: true });

  console.log(`[clean-covers] 대상 ${ids.length}권 · model=${IMAGE_MODEL} · dryRun=${dryRun}`);
  const summary = { ok: 0, skip: 0, fail: 0 };

  for (const id of ids) {
    if (!force && !dryRun && map[id]) {
      summary.skip++;
      continue;
    }
    try {
      const sb = await fetchStorybook(id);
      const cover = sb?.coverImage;
      if (!cover) throw new Error('coverImage 없음');
      const base64 = await coverToPngBase64(cover);
      const out = await withRetry(() =>
        generateImageWithGemini({
          prompt: PROMPT,
          referenceImages: [{ base64, mimeType: 'image/png' }],
          model: IMAGE_MODEL,
        })
      );
      if (dryRun) {
        const p = path.join(outDir, `${id}-clean.png`);
        fs.writeFileSync(p, Buffer.from(out, 'base64'));
        console.log(`  ✓ ${id} ${sb.title} → ${p}`);
      } else {
        const url = await uploadBase64ToR2(out, `mkt/clean-covers/${id}-${Date.now()}.png`);
        map[id] = url;
        saveMap(map);
        console.log(`  ✓ ${id} ${sb.title} → ${url.slice(-46)}`);
      }
      summary.ok++;
    } catch (e) {
      console.error(`  ✗ ${id} FAILED: ${(e as Error).message}`);
      summary.fail++;
    }
  }

  console.log(`\n[clean-covers] 완료 — ok=${summary.ok} skip=${summary.skip} fail=${summary.fail}`);
}

main().catch((e) => {
  console.error('[clean-covers] 치명적 오류:', e);
  process.exit(1);
});
