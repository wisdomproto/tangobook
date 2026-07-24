// 다국어 블로그 번역 산출물 무결성 검증 (카드-배열 스키마).
// 소스 = i18n/_source-ko/<id>.json (ko 발행본 카드 전체)
// 대상 = i18n/<lang>/<id>.json
// 사용: node packages/server/scripts/verify-blog-i18n.mjs [--lang en,vi,zh,th]
//
// HARD FAIL(재번역): JSON 파싱 실패 · 카드 수 불일치 · href/url/image_prompt 변조 ·
//   card_type/sort_order 변조 · 필수 필드 누락 · 원본과 동일(미번역) · 한글 잔존(비-ko).
// SOFT WARN(무해): 태그 개수 소폭 차이(±3).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dir, '_data', 'marketing', 'blogs', 'i18n', '_source-ko');
const I18N = path.join(__dir, '_data', 'marketing', 'blogs', 'i18n');
const ALL_LANGS = ['en', 'vi', 'zh', 'th'];

const args = process.argv.slice(2);
let langs = ALL_LANGS;
const li = args.indexOf('--lang');
if (li >= 0) langs = args[li + 1].split(',').map((s) => s.trim()).filter(Boolean);

const tags = (s) => ((s || '').match(/<[^>]+>/g) || []).length;
const hrefs = (s) => ((s || '').match(/href="[^"]*"/g) || []).sort().join('|');
const hasHangul = (s) => /[가-힣]/.test(s || '');

let hardFail = 0, softWarn = 0, missing = 0, okCount = 0;

const srcFiles = fs.readdirSync(SRC).filter((f) => f.endsWith('.json')).sort();

for (const lang of langs) {
  for (const f of srcFiles) {
    const outPath = path.join(I18N, lang, f);
    if (!fs.existsSync(outPath)) { missing++; continue; }
    const ko = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
    let tr;
    try { tr = JSON.parse(fs.readFileSync(outPath, 'utf8')); }
    catch (e) { console.log(`[HARD] ${lang}/${f} JSON 파싱 실패: ${e.message}`); hardFail++; continue; }

    const issues = [];
    if (tr.storybookId !== ko.storybookId) issues.push('storybookId 변조');
    if (tr.url_slug !== ko.url_slug) issues.push('url_slug 변조');
    if (!tr.seo_title) issues.push('seo_title 누락');
    // 메타 필드의 한글 잔재도 잡는다(카드 스캔은 cards 만 본다)
    if (lang !== 'ko' && (hasHangul(tr.seo_title) || hasHangul(tr.meta_description)))
      issues.push('메타(seo_title/meta_description) 한글 잔존');

    const kc = ko.cards || [], tc = tr.cards || [];
    if (tc.length !== kc.length) issues.push(`카드 수 ${tc.length}!=${kc.length}`);
    else {
      let hangulHits = 0, bigTagDiff = false;
      kc.forEach((c, i) => {
        const t = tc[i] || {}, kco = c.content || {}, tco = t.content || {};
        if (t.card_type !== c.card_type) issues.push(`card${i} card_type 변조`);
        if (t.sort_order !== c.sort_order) issues.push(`card${i} sort_order 변조`);
        if ((tco.url ?? '') !== (kco.url ?? '')) issues.push(`card${i} url 변조`);
        if ((tco.image_prompt ?? '') !== (kco.image_prompt ?? '')) issues.push(`card${i} image_prompt 변조`);
        if (hrefs(tco.text) !== hrefs(kco.text)) issues.push(`card${i} href 변조`);
        if (Math.abs(tags(kco.text) - tags(tco.text)) > 3) bigTagDiff = true;
        // 🔴 text 뿐 아니라 alt·caption 도 검사 — alt 는 이미지 대체텍스트라
        // 접근성·SEO 에 그대로 노출되는데, text 만 보던 예전 기준이 이를 놓쳤다.
        if (lang !== 'ko' && (hasHangul(tco.text) || hasHangul(tco.alt) || hasHangul(tco.caption)))
          hangulHits++;
      });
      if (bigTagDiff) issues.push('태그 개수 크게 불일치(>3)');
      // 🔴 한글은 카드 1개만 남아도 FAIL — 로컬 모델이 캐릭터명(호리·콩이)이나
      // 의성어(냠냠·보글보글)를 번역 안 하고 흘리는 일이 잦다. "절반 이상"으로 재던
      // 예전 기준은 이런 소수 잔재를 통째로 놓쳤다(zh 26·th 16·vi 4 파일).
      if (hangulHits > 0) issues.push(`한글 잔존 ${hangulHits}/${kc.length} 카드`);
    }
    if (JSON.stringify(tr.cards) === JSON.stringify(ko.cards)) issues.push('카드 원본과 동일(미번역)');

    if (issues.length === 0) {
      let warn = false;
      kc.forEach((c, i) => {
        if (tags(c.content?.text) !== tags((tc[i] || {}).content?.text)) warn = true;
      });
      if (warn) softWarn++;
      okCount++;
    } else {
      console.log(`[HARD] ${lang}/${f}: ${issues.join('; ')}`);
      hardFail++;
    }
  }
}

console.log(
  `\n검증: ${langs.join(',')} × ${srcFiles.length}편 = ${langs.length * srcFiles.length}` +
    `\n  OK ${okCount} (soft-warn ${softWarn}) · HARD FAIL ${hardFail} · MISSING ${missing}`
);
process.exit(hardFail > 0 ? 1 : 0);
