// Multilingual cover pipeline (vi/th/zh baked onto text-free clean covers, registered to primaryCoverByLang).
// ko/en keep their original baked covers. Classics = per displayed art-style (availableStyles).
//
// FULL PIPELINE (idempotent — safe to re-run to fill gaps, e.g. retry the 27 books Gemini refused):
//   1) pnpm --filter @tangobook/server exec tsx scripts/generate-clean-covers.ts [--retries=1] [--book=<id>] [--force]
//        → Gemini removes cover text (fidelity gate) → R2 covers/clean/ + styleAssets[style].cleanCoverImage. Refusals → out/clean-covers-review.json
//   2) tsx scripts/register-lang-covers.ts --phase=manifest   → out/bake-manifest.json (displayed styles WITH a clean cover)
//   3) (client) node scripts/bake-lang-covers.mjs [--force]   → puppeteer glass-Jua overlay render → out/lang-covers/{id}-{style}-{lang}.webp
//   4) tsx scripts/register-lang-covers.ts --phase=ingest      → upload out/lang-covers → R2 covers/lang/ + primaryCoverByLang[lang]
//   5) tsx scripts/register-lang-covers.ts --phase=report      → out/missing-covers.json + console (gaps = Gemini clean refusals)
//   phases below: manifest | ingest (idempotent, --force to overwrite) | report
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { R2Repository } from '../src/repositories/r2.repository.js';
import { uploadBufferToR2 } from '../src/providers/r2.provider.js';
import { pickStyleCovers } from '../src/services/covers/clean-cover.js';

const OUT = path.resolve(process.cwd(), 'out');
const LANG_DIR = path.join(OUT, 'lang-covers');
const MANIFEST = path.join(OUT, 'bake-manifest.json');
const MISSING = path.join(OUT, 'missing-covers.json');
const LANGS = ['vi', 'th', 'zh'] as const;

const arg = (n: string) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`));
  return h ? h.slice(n.length + 3) : undefined;
};
const hasFlag = (n: string) => process.argv.includes(`--${n}`);

async function publicBooks(): Promise<string[]> {
  const list = await R2Repository.listStorybooks();
  return list
    .filter((s: any) => s.isPublic !== false && s.koCompletion?.cover)
    .map((s: any) => s.id);
}

// clean cover URL for a (book, style): styleAssets[style].cleanCoverImage, or top-level for the active style
function cleanUrlFor(sb: any, style: string): string | undefined {
  return (
    sb.styleAssets?.[style]?.cleanCoverImage ??
    (style === sb.artStyle ? sb.cleanCoverImage : undefined)
  );
}

// displayed styles only (availableStyles = 앱 노출 그림체; 명작 3 / 자연 1). fallback [artStyle].
function displayStyles(sb: any): string[] {
  const av =
    sb.availableStyles && sb.availableStyles.length > 0
      ? sb.availableStyles
      : sb.artStyle
        ? [sb.artStyle]
        : [];
  const have = new Set(pickStyleCovers(sb).map((s) => s.style));
  return (av as string[]).filter((s) => have.has(s));
}

async function manifest() {
  const ids = await publicBooks();
  const out: any[] = [];
  for (const id of ids) {
    const sb: any = await R2Repository.getStorybook(id);
    if (!sb) continue;
    const t = sb.titleTranslations ?? {};
    if (!t.vi && !t.th && !t.zh) continue;
    for (const style of displayStyles(sb)) {
      const cleanUrl = cleanUrlFor(sb, style);
      if (!cleanUrl) continue; // clean generation failed for this style → skip (reported by `report`)
      out.push({
        id,
        title: sb.title,
        style,
        cleanUrl,
        vi: t.vi ?? '',
        th: t.th ?? '',
        zh: t.zh ?? '',
      });
    }
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(out, null, 2));
  console.log(`[manifest] ${out.length} (book,style) entries with a clean cover → ${MANIFEST}`);
}

async function ingest() {
  const force = hasFlag('force');
  const manifest: any[] = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const byBook = new Map<string, any[]>();
  for (const m of manifest) {
    if (!byBook.has(m.id)) byBook.set(m.id, []);
    byBook.get(m.id)!.push(m);
  }
  let ok = 0,
    skip = 0,
    miss = 0;
  for (const [id, entries] of byBook) {
    let sb: any = await R2Repository.getStorybook(id);
    if (!sb) continue;
    let touched = false;
    for (const m of entries) {
      const asset =
        (sb.styleAssets = sb.styleAssets ?? {})[m.style] ?? (sb.styleAssets[m.style] = {});
      asset.primaryCoverByLang = asset.primaryCoverByLang ?? {};
      for (const lang of LANGS) {
        if (!m[lang]) continue;
        if (!force && asset.primaryCoverByLang[lang]) {
          skip++;
          continue;
        }
        const baked = path.join(LANG_DIR, `${id}-${m.style}-${lang}.webp`);
        if (!fs.existsSync(baked)) {
          miss++;
          continue;
        }
        try {
          const url = await uploadBufferToR2(
            fs.readFileSync(baked),
            `covers/lang/${id}-${m.style}-${lang}-${Date.now()}.webp`,
            'image/webp'
          );
          asset.primaryCoverByLang[lang] = url;
          if (m.style === sb.artStyle) {
            sb.primaryCoverByLang = sb.primaryCoverByLang ?? {};
            sb.primaryCoverByLang[lang] = url;
          }
          ok++;
          touched = true;
        } catch (e) {
          console.error(`  ! ${id}/${m.style}/${lang}: ${(e as Error).message}`);
          miss++;
        }
      }
    }
    if (touched) await R2Repository.saveStorybook(sb);
  }
  console.log(`[ingest] registered ${ok}, skipped(existing) ${skip}, missing-baked ${miss}`);
}

async function report() {
  const ids = await publicBooks();
  const missing: any[] = [];
  let fullyMissing = 0;
  for (const id of ids) {
    const sb: any = await R2Repository.getStorybook(id);
    if (!sb) continue;
    const t = sb.titleTranslations ?? {};
    const styles = displayStyles(sb);
    const perStyle: any[] = [];
    for (const style of styles) {
      const hasClean = !!cleanUrlFor(sb, style);
      const pbl =
        sb.styleAssets?.[style]?.primaryCoverByLang ??
        (style === sb.artStyle ? sb.primaryCoverByLang : undefined) ??
        {};
      const missLangs = LANGS.filter((l) => t[l] && !pbl[l]);
      if (!hasClean || missLangs.length) perStyle.push({ style, hasClean, missing: missLangs });
    }
    if (perStyle.length) {
      const noneRegistered = styles.every((style) => {
        const pbl =
          sb.styleAssets?.[style]?.primaryCoverByLang ??
          (style === sb.artStyle ? sb.primaryCoverByLang : undefined) ??
          {};
        return LANGS.every((l) => !pbl[l]);
      });
      if (noneRegistered) fullyMissing++;
      missing.push({
        id,
        title: sb.title,
        category: sb.category,
        fullyMissing: noneRegistered,
        styles: perStyle,
      });
    }
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(MISSING, JSON.stringify(missing, null, 2));
  console.log(`\n===== 이미지 없는 것들 (다국어 표지 미생성) =====`);
  console.log(
    `대상 공개책 ${ids.length} · 결손 있는 책 ${missing.length} (그 중 vi/th/zh 전무 ${fullyMissing})\n`
  );
  for (const m of missing) {
    const tag = m.fullyMissing ? '❌ 전무' : '⚠️ 부분';
    const detail = m.styles
      .map(
        (s: any) =>
          `${s.style}${s.hasClean ? '' : '(클린실패)'}${s.missing.length ? ':' + s.missing.join('/') : ''}`
      )
      .join(', ');
    console.log(`${tag}  ${m.title}  [${m.category ?? ''}]  (${m.id})  →  ${detail}`);
  }
  console.log(`\n상세 JSON → ${MISSING}`);
}

async function main() {
  const phase = arg('phase');
  if (phase === 'manifest') await manifest();
  else if (phase === 'ingest') await ingest();
  else if (phase === 'report') await report();
  else throw new Error('use --phase=manifest|ingest|report');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
