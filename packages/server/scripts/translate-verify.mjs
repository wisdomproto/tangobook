#!/usr/bin/env node
/**
 * R2 storybook 에 주입된 특정 언어 번역 데이터를 재조회해 확인. 언어 무관.
 * 사용: node scripts/translate-verify.mjs --lang=vi <storybookId>
 */
import { getStorybook, parseArgs } from './translation-core.mjs';

const args = parseArgs(process.argv.slice(2));
const LANG = args.lang;
const id = args._[0];
if (!LANG || !id) {
  console.error('사용: node scripts/translate-verify.mjs --lang=<code> <storybookId>');
  process.exit(1);
}

const sb = await getStorybook(id);

console.log('=== ', sb.title, '(', id, ') · lang=', LANG, ' ===');
console.log('languages            :', JSON.stringify(sb.languages));
console.log(`titleTranslations.${LANG} :`, sb.titleTranslations?.[LANG]);
console.log('page[0]              :', sb.pages?.[0]?.translations?.[LANG]?.text?.slice(0, 90));
console.log('page[5]              :', sb.pages?.[5]?.translations?.[LANG]?.text?.slice(0, 90));
const ko = sb.key_objects ?? sb.keyObjects ?? [];
console.log('keyObjects           :', ko.map((k) => `${k.korean}→${k.nameTranslations?.[LANG]}`).join(' / '));
const pg = sb.parentGuideTranslations?.[LANG];
console.log('parentGuide          :', pg ? 'O' : 'X');
if (pg) {
  console.log('  overview           :', pg.overview?.slice(0, 90));
  console.log('  lessons/tips/faq   :', pg.lessons?.length, '/', pg.readingTips?.length, '/', pg.faq?.length);
}
