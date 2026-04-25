// v1 storybook → v2 books/{bid}/... 마이그레이션 service.
//
// per-book idempotent. 같은 base bid의 모든 레벨 variant를 묶어 1 manifest + N text slices + 1 style slice 로 변환.
// 자산은 R2 server-side copy.
//
// 스펙: docs/superpowers/specs/2026-04-25-book-variants-design.md
// 플랜: docs/superpowers/plans/2026-04-25-book-variants-plan.md Task 2.1~2.2

import {
  downloadFromR2,
  copyR2Object,
  objectExists,
  urlToR2Key,
  r2PublicUrl,
} from '../providers/r2.provider.js';
import {
  manifestKey,
  textSliceKey,
  audioFileKey,
  styleCoverKey,
  stylePageImageKey,
  styleKeyObjectImageKey,
  styleVocabImageKey,
} from '../utils/book-v2-keys.js';
import {
  putManifest,
  putTextSlice,
  putStyleCharacters,
} from '../repositories/book-v2.repository.js';
import type {
  Storybook,
  BookManifest,
  BookTextSlice,
  BookCharacter,
  BookKeyObjectText,
  BookVocabText,
  ReadingLevel,
  UsedVariants,
  KeyObject,
  KeyObjectImage,
  VocabularyItem,
  VocabularyImage,
  Page,
} from '@tangobook/shared';

const STORYBOOK_PREFIX = 'storybook-';

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

export interface MigrationResult {
  bid: string;
  status: 'migrated' | 'skipped' | 'failed';
  reason?: string;
  variantsFound: { level: ReadingLevel; storybookId: string }[];
  manifestKey?: string;
  textSlicesWritten: number;
  styleAssetsCopied: number;
  audioFilesCopied: number;
  warnings: string[];
}

export interface MigrationOptions {
  force?: boolean;
  dryRun?: boolean;
}

/** 한 base bid에 대한 v1 → v2 마이그. 모든 레벨 variant를 묶음. */
export async function migrateBookToV2(
  baseBid: string,
  variants: { storybookId: string; level: ReadingLevel; storybook: Storybook }[],
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const result: MigrationResult = {
    bid: baseBid,
    status: 'migrated',
    variantsFound: variants.map((v) => ({ level: v.level, storybookId: v.storybookId })),
    textSlicesWritten: 0,
    styleAssetsCopied: 0,
    audioFilesCopied: 0,
    warnings: [],
  };

  // idempotent skip
  if (!options.force && (await objectExists(manifestKey(baseBid)))) {
    return { ...result, status: 'skipped', reason: 'manifest already exists' };
  }

  // base storybook 결정 (ID === baseBid 우선, 아니면 첫 variant)
  const baseEntry = variants.find((v) => v.storybookId === baseBid) ?? variants[0];
  if (!baseEntry) {
    return { ...result, status: 'failed', reason: 'no variants supplied' };
  }
  const base = baseEntry.storybook;

  // 1. usedVariants 결정
  const levels = uniq(variants.map((v) => v.level));
  const languages = uniq([
    'ko',
    ...variants.flatMap((v) => extractLanguagesFromPages(v.storybook.pages ?? [])),
  ]);
  const rawStyle = (base.artStyle ?? 'watercolor').trim();
  const style = /^[a-z][a-z0-9-]*$/.test(rawStyle) ? rawStyle : 'watercolor';
  if (style !== rawStyle) {
    result.warnings.push(`invalid artStyle "${rawStyle.slice(0, 80)}…" → fallback to "watercolor"`);
  }

  const usedVariants: UsedVariants = { levels, languages, styles: [style] };

  // 2. keyObjectIds, vocabIds — base 책 기준
  const keyObjects: KeyObject[] = (base.key_objects ?? []) as KeyObject[];
  const keyObjectIdMap = buildKeyObjectIdMap(keyObjects); // name → id
  const keyObjectIds = Array.from(keyObjectIdMap.values());

  const vocabulary: VocabularyItem[] = base.educational_content?.vocabulary ?? [];
  const vocabIdMap = buildVocabIdMap(vocabulary); // word → id
  const vocabIds = Array.from(vocabIdMap.values());

  const manifest: BookManifest = {
    id: baseBid,
    title: base.title ?? '(no title)',
    type: base.type ?? 'storybook',
    category: base.category,
    folder: base.folder,
    isPublic: base.isPublic,
    parentGuide: base.parentGuide,
    usedVariants,
    keyObjectIds,
    vocabIds,
    bgmUrl: base.backgroundMusicUrl,
    imageModels: base.imageModels,
    aspectRatios: pickAspectRatios(base),
    createdAt: base.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (options.dryRun) {
    result.warnings.push('dry-run: no writes performed');
    return result;
  }

  // 3. manifest 저장
  await putManifest(baseBid, manifest);
  result.manifestKey = manifestKey(baseBid);

  // 4. style slice — characters.json
  const characters: BookCharacter[] = (base.characters ?? []).map((c, idx) => ({
    ...c,
    id: c.referenceImage ? slugifyId(c.name ?? `c${idx + 1}`) : `c${idx + 1}`,
  }));
  await putStyleCharacters(baseBid, style, characters);

  // 5. style assets — 표지
  if (base.coverImage) {
    await safeCopy(base.coverImage, styleCoverKey(baseBid, style), result);
  }

  // 6. style assets — keyObjectImages
  const keyObjectImages: KeyObjectImage[] = (
    (base.keyObjectImages ?? []) as KeyObjectImage[]
  ).filter((x): x is KeyObjectImage => x != null);
  for (const ki of keyObjectImages) {
    const id = keyObjectIdMap.get(ki.objectName);
    if (!id) {
      result.warnings.push(`keyObject image without matching name: ${ki.objectName}`);
      continue;
    }
    if (ki.imageUrl) {
      await safeCopy(ki.imageUrl, styleKeyObjectImageKey(baseBid, style, id), result);
    }
  }

  // 7. style assets — vocabularyImages
  const vocabularyImages: VocabularyImage[] = (
    (base.vocabularyImages ?? []) as VocabularyImage[]
  ).filter((x): x is VocabularyImage => x != null);
  for (const vi of vocabularyImages) {
    const id = vocabIdMap.get(vi.word);
    if (!id) {
      result.warnings.push(`vocab image without matching word: ${vi.word}`);
      continue;
    }
    if (vi.imageUrl) {
      await safeCopy(vi.imageUrl, styleVocabImageKey(baseBid, style, id), result);
    }
  }

  // 8. 각 variant → text slice + audio copy + page image copy
  for (const v of variants) {
    const sb = v.storybook;
    const pages = sb.pages ?? [];

    // 8a. 페이지 이미지 → styles/{style}/pages/{level}/p{N}.webp
    for (const page of pages) {
      if (page.illustrationUrl) {
        await safeCopy(
          page.illustrationUrl,
          stylePageImageKey(baseBid, style, v.level, `p${page.pageNumber}`),
          result
        );
      }
      // 한국어 TTS
      if (page.ttsUrl) {
        await safeCopyAudio(
          page.ttsUrl,
          audioFileKey(baseBid, v.level, 'ko', page.pageNumber),
          result
        );
      }
      // 다른 언어 TTS
      if (page.translations) {
        for (const [lang, t] of Object.entries(page.translations)) {
          if (t?.ttsUrl) {
            await safeCopyAudio(
              t.ttsUrl,
              audioFileKey(baseBid, v.level, lang, page.pageNumber),
              result
            );
          }
        }
      }
    }

    // 8b. text slices: 한국어 + 발견된 추가 언어
    const langs = uniq(['ko', ...extractLanguagesFromPages(pages)]);
    for (const lang of langs) {
      const slice = buildTextSlice(
        sb,
        v.level,
        lang,
        keyObjectIdMap,
        vocabIdMap,
        keyObjects,
        vocabulary
      );
      await putTextSlice(baseBid, v.level, lang, slice);
      result.textSlicesWritten++;
    }
  }

  return result;
}

// ────────────────────────────────────────────────────────────────────────────
// V1 list helpers
// ────────────────────────────────────────────────────────────────────────────

export interface V1ListEntry {
  storybookId: string;
  baseBid: string;
  level: ReadingLevel;
}

const VARIANT_RE = /^(.+?)__(L[1-4])$/;

export function classifyV1Id(
  id: string,
  fallbackLevel?: ReadingLevel
): { baseBid: string; level: ReadingLevel } {
  const m = id.match(VARIANT_RE);
  if (m) return { baseBid: m[1], level: m[2] as ReadingLevel };
  return { baseBid: id, level: fallbackLevel ?? 'L3' };
}

/** v1 R2 list에서 storybook json 모두 fetch + 그룹핑. */
export async function loadV1Storybooks(): Promise<Map<string, V1ListEntry[]>> {
  // listR2Objects와 downloadFromR2 사용 — repository 의존 없이 raw access
  const { listR2Objects } = await import('../providers/r2.provider.js');
  const objects = await listR2Objects(STORYBOOK_PREFIX);
  const groups = new Map<string, V1ListEntry[]>();
  const concurrency = 30;

  const items: { Key: string }[] = objects
    .filter((o) => o.Key?.endsWith('.json'))
    .map((o) => ({ Key: o.Key! }));

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (o) => {
        try {
          const buf = await downloadFromR2(o.Key);
          const sb = JSON.parse(buf.toString('utf-8')) as Storybook;
          const { baseBid, level } = classifyV1Id(sb.id, sb.readingLevel);
          if (!groups.has(baseBid)) groups.set(baseBid, []);
          groups.get(baseBid)!.push({ storybookId: sb.id, baseBid, level });
        } catch {
          /* skip */
        }
      })
    );
  }
  return groups;
}

export async function fetchV1Storybook(storybookId: string): Promise<Storybook> {
  const buf = await downloadFromR2(`${STORYBOOK_PREFIX}${storybookId}.json`);
  return JSON.parse(buf.toString('utf-8')) as Storybook;
}

// ────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────────────

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function extractLanguagesFromPages(pages: Page[]): string[] {
  const langs = new Set<string>();
  for (const p of pages) {
    if (p.translations) for (const lang of Object.keys(p.translations)) langs.add(lang);
  }
  return [...langs].filter((l) => l !== 'ko');
}

function pickAspectRatios(sb: Storybook): BookManifest['aspectRatios'] {
  if (!sb.coverAspectRatio && !sb.illustrationAspectRatio && !sb.phonicsAspectRatio)
    return undefined;
  return {
    cover: sb.coverAspectRatio,
    illustration: sb.illustrationAspectRatio,
    phonics: sb.phonicsAspectRatio,
  };
}

function slugifyId(name: string): string {
  // 한글 그대로 유지하되 안전 문자 외에는 `_`로 치환
  return (
    String(name)
      .trim()
      .replace(/[^A-Za-z0-9가-힣_-]/g, '_')
      .slice(0, 32) || 'item'
  );
}

function buildKeyObjectIdMap(keyObjects: KeyObject[]): Map<string, string> {
  const map = new Map<string, string>();
  const used = new Set<string>();
  for (const ko of keyObjects) {
    let base = slugifyId(ko.nameEn ?? ko.name ?? 'k');
    if (!base.startsWith('k_')) base = `k_${base}`;
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}_${n++}`;
    used.add(id);
    map.set(ko.name, id);
  }
  return map;
}

function buildVocabIdMap(vocab: VocabularyItem[]): Map<string, string> {
  const map = new Map<string, string>();
  const used = new Set<string>();
  for (const v of vocab) {
    let base = slugifyId(v.word ?? 'v');
    if (!base.startsWith('v_')) base = `v_${base}`;
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}_${n++}`;
    used.add(id);
    map.set(v.word, id);
  }
  return map;
}

function buildTextSlice(
  sb: Storybook,
  level: ReadingLevel,
  language: string,
  keyObjectIdMap: Map<string, string>,
  vocabIdMap: Map<string, string>,
  keyObjects: KeyObject[],
  vocabulary: VocabularyItem[]
): BookTextSlice {
  const pages = (sb.pages ?? []).map((p) => {
    let text = p.text ?? '';
    if (language !== 'ko' && p.translations?.[language]?.text) {
      text = p.translations[language]!.text!;
    }
    return {
      pageNumber: p.pageNumber,
      text,
      illustrationKey: `p${p.pageNumber}`,
      sceneDescription: p.scene_description,
    };
  });

  const keyObjectsText: Record<string, BookKeyObjectText> = {};
  for (const ko of keyObjects) {
    const id = keyObjectIdMap.get(ko.name);
    if (!id) continue;
    keyObjectsText[id] = {
      word: language === 'ko' ? (ko.korean ?? ko.name) : (ko.nameEn ?? ko.name),
      korean: ko.korean ?? ko.name,
    };
  }

  const vocabText: Record<string, BookVocabText> = {};
  for (const v of vocabulary) {
    const id = vocabIdMap.get(v.word);
    if (!id) continue;
    vocabText[id] = {
      word: v.word,
      korean: v.korean,
      definition: v.definition,
    };
  }

  return {
    level,
    language,
    title: sb.title ?? '(no title)',
    intro: undefined,
    pages,
    keyObjectsText,
    vocabText,
  };
}

/** R2 public URL → key, 같은 버킷이면 server-side copy. 외부면 download → upload. */
async function safeCopy(srcUrl: string, destKey: string, result: MigrationResult): Promise<void> {
  if (!srcUrl) return;
  const isOurR2 = srcUrl.startsWith(r2PublicUrl);
  if (!isOurR2) {
    result.warnings.push(`external URL not migrated: ${truncUrl(srcUrl)} → ${destKey}`);
    return;
  }
  const srcKey = urlToR2Key(srcUrl);
  if (await objectExists(destKey)) {
    return; // idempotent
  }
  try {
    await copyR2Object(srcKey, destKey);
    result.styleAssetsCopied++;
  } catch (e) {
    result.warnings.push(`copy failed ${srcKey} → ${destKey}: ${(e as Error).message}`);
  }
}

async function safeCopyAudio(
  srcUrl: string,
  destKey: string,
  result: MigrationResult
): Promise<void> {
  if (!srcUrl) return;
  const isOurR2 = srcUrl.startsWith(r2PublicUrl);
  if (!isOurR2) {
    result.warnings.push(`external audio URL not migrated: ${truncUrl(srcUrl)} → ${destKey}`);
    return;
  }
  const srcKey = urlToR2Key(srcUrl);
  if (await objectExists(destKey)) return;
  try {
    await copyR2Object(srcKey, destKey);
    result.audioFilesCopied++;
  } catch (e) {
    result.warnings.push(`audio copy failed ${srcKey} → ${destKey}: ${(e as Error).message}`);
  }
}

function truncUrl(u: string, n = 60): string {
  return u.length > n ? `${u.slice(0, n)}…` : u;
}
