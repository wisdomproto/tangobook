#!/usr/bin/env node
/**
 * translate-extract.mjs 로 만든 후 Claude 가 채운 번역(t 칸)을 R2 storybook 에 주입. 언어 무관.
 * 저작도구 "언어 추가 + 번역" 과 동일 필드:
 *   languages, titleTranslations[lang], page.translations[lang], key_objects[].nameTranslations[lang]
 *   + parentGuideTranslations[lang] (확장).
 * Gemini 등 외부 번역 API 미사용.
 *
 * 사용:
 *   node scripts/translate-apply.mjs --lang=vi --dry-run            # 전체 요약 (PUT 안 함)
 *   node scripts/translate-apply.mjs --lang=vi --dry-run --id=178…  # 단권 요약
 *   node scripts/translate-apply.mjs --lang=vi --id=178…            # 단권 적용
 *   node scripts/translate-apply.mjs --lang=vi                       # 채워진 파일 전부 적용
 */
import fs from 'node:fs';
import path from 'node:path';
import { getStorybook, putStorybook, parseArgs, langDir } from './translation-core.mjs';

const args = parseArgs(process.argv.slice(2));
const LANG = args.lang;
if (!LANG) {
  console.error('필수: --lang=<code> (예: vi, ja, zh).');
  process.exit(1);
}
const DRY = args.flags.has('dry-run');
const ONLY_ID = args.id ?? null;
// 특정 책들만 적용(쉼표 구분). 한 언어 dir 에 여러 배치(명작+생활동화 등)가 섞였을 때 사용.
const ONLY_IDS = args.ids
  ? String(args.ids)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

/** 빈 t 칸 검증. 본문/제목/단어 누락은 책 전체 skip, 가이드 누락은 가이드만 제외. */
function validate(tr) {
  const missing = [];
  if (!tr.titleT?.trim()) missing.push('title');
  for (const p of tr.pages ?? []) if ((p.ko ?? '').trim() && !p.t?.trim()) missing.push(`page ${p.n}`);
  for (const k of tr.keyObjects ?? []) if (!k.t?.trim()) missing.push(`word[${k.i}] ${k.korean}`);

  const guideMissing = [];
  if (tr.parentGuide) {
    const pg = tr.parentGuide;
    if (!pg.overview?.t?.trim()) guideMissing.push('overview');
    (pg.lessons ?? []).forEach((l, i) => !l.t?.trim() && guideMissing.push(`lesson ${i}`));
    (pg.readingTips ?? []).forEach((t, i) => !t.t?.trim() && guideMissing.push(`tip ${i}`));
    (pg.faq ?? []).forEach(
      (f, i) => (!f.q_t?.trim() || !f.a_t?.trim()) && guideMissing.push(`faq ${i}`)
    );
  }
  return { missing, guideMissing };
}

function injectInto(sb, tr, lang) {
  const langs = sb.languages?.length ? [...sb.languages] : ['ko'];
  if (!langs.includes(lang)) langs.push(lang);
  sb.languages = langs;

  sb.titleTranslations = { ...(sb.titleTranslations ?? {}), [lang]: tr.titleT };

  const pageByNum = new Map((sb.pages ?? []).map((p) => [p.pageNumber, p]));
  for (const p of tr.pages ?? []) {
    const target = pageByNum.get(p.n);
    if (!target) continue;
    target.translations = { ...(target.translations ?? {}), [lang]: { text: p.t } };
  }

  const koList = sb.key_objects ?? sb.keyObjects ?? [];
  for (const k of tr.keyObjects ?? []) {
    const target = koList[k.i];
    if (!target) continue;
    target.nameTranslations = { ...(target.nameTranslations ?? {}), [lang]: k.t };
  }

  if (tr.parentGuide) {
    const pg = tr.parentGuide;
    sb.parentGuideTranslations = {
      ...(sb.parentGuideTranslations ?? {}),
      [lang]: {
        overview: pg.overview.t,
        lessons: (pg.lessons ?? []).map((l) => l.t),
        readingTips: (pg.readingTips ?? []).map((t) => t.t),
        faq: (pg.faq ?? []).map((f) => ({ q: f.q_t, a: f.a_t })),
      },
    };
  }

  sb.updatedAt = new Date().toISOString();
  return sb;
}

async function main() {
  const dir = langDir(LANG);
  let files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
  if (ONLY_ID) files = files.filter((f) => f === `${ONLY_ID}.json`);
  if (ONLY_IDS) files = files.filter((f) => ONLY_IDS.includes(f.replace(/\.json$/, '')));
  if (!files.length) {
    console.log(`적용할 파일 없음 (${dir}). 먼저 translate-extract.mjs --lang=${LANG} 실행.`);
    return;
  }

  let applied = 0;
  let skipped = 0;
  for (const file of files.sort()) {
    const tr = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    if (tr.lang && tr.lang !== LANG) {
      console.log(`⏭️  ${tr.title} — 파일 lang=${tr.lang} ≠ --lang=${LANG} → skip`);
      skipped++;
      continue;
    }
    const { missing, guideMissing } = validate(tr);

    if (missing.length) {
      console.log(
        `⏭️  ${tr.title} — 미완성 ${missing.length}곳 (${missing.slice(0, 4).join(', ')}${missing.length > 4 ? '…' : ''}) → skip`
      );
      skipped++;
      continue;
    }

    const guideNote = !tr.parentGuide
      ? ' (가이드 없음)'
      : guideMissing.length
        ? ` ⚠️ 가이드 미완 ${guideMissing.length}곳 → 가이드 제외 적용`
        : ' +가이드';

    if (DRY) {
      console.log(
        `📋 ${tr.title} — title✓ / ${tr.pages.length}p / ${tr.keyObjects.length}단어${guideNote}`
      );
      applied++;
      continue;
    }

    const sb = await getStorybook(tr.id);
    const trToApply = guideMissing.length ? { ...tr, parentGuide: null } : tr;
    injectInto(sb, trToApply, LANG);
    await putStorybook(tr.id, sb);
    console.log(`✅ ${tr.title}${guideNote}`);
    applied++;
  }

  console.log(`\n[${LANG}] ${DRY ? '[DRY-RUN] ' : ''}적용 ${applied} | skip ${skipped}`);
  if (DRY) console.log('실제 적용은 --dry-run 빼고 다시 실행.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
