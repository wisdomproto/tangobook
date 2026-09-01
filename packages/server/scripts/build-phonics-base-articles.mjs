// 파닉스 블로그 JSON → 기본글(base-article) JSON 파생 (멱등).
//   node packages/server/scripts/build-phonics-base-articles.mjs [--ids kr-h1-u03,…]
//
// 🔴 **같은 내용을 두 번 쓰지 않는다.** 기본글과 블로그는 쓰임이 다르지만(기본글=네이버 소스,
//    블로그=내부 발행) 담는 지식은 같다. 32단원 × 두 벌을 손으로 쓰면 반드시 갈라지고,
//    갈라진 뒤엔 어느 쪽이 정본인지 아무도 모른다. → **블로그가 정본**, 기본글은 파생물.
//
// ⚠️ 동화책 라인(명작·자연·생활)의 기본글은 손으로 쓴 별개 문서다 — 이 스크립트는
//    `kr-h*`(파닉스 단원)만 건드린다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dir, '_data', 'marketing', 'blogs');
const OUT_DIR = path.join(__dir, '_data', 'marketing', 'base-articles');

const argv = process.argv.slice(2);
const arg = (k) => {
  const hit = argv.find((a) => a === k || a.startsWith(`${k}=`));
  if (!hit) return null;
  return hit.includes('=') ? hit.split('=').slice(1).join('=') : argv[argv.indexOf(hit) + 1];
};
const ONLY = (arg('--ids') || '').split(',').map((s) => s.trim()).filter(Boolean);

/** 태그를 지운 읽기용 본문 — 블록 요소는 줄바꿈, 그 외는 그냥 벗긴다. */
const toPlain = (html) =>
  html
    .replace(/<\/(h2|h3|p|li)>/g, '\n')
    .replace(/<li>/g, '· ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// `kr-h*` = 단원 글 · `hub-*` = 여러 단원을 묶는 허브 글 · `write-*` = 쓰기 롱테일(자음/모음/받침/쌍자음 쓰기).
const files = fs
  .readdirSync(BLOG_DIR)
  .filter(
    (f) =>
      (f.startsWith('kr-h') || f.startsWith('hub-') || f.startsWith('write-')) &&
      f.endsWith('.json')
  )
  .filter((f) => !ONLY.length || ONLY.includes(f.replace('.json', '')));

let made = 0;
for (const file of files) {
  const blog = JSON.parse(fs.readFileSync(path.join(BLOG_DIR, file), 'utf8'));
  // 🔴 섹션 HTML 을 그대로 잇는다 — 블로그 본문이 곧 기본글 본문이다. 섹션은 `<h2>` 로 시작하므로
  //    이어 붙이면 소제목이 살아 있는 한 편의 글이 된다(derive-cardnews 가 그 h2 를 읽는다).
  const body_html = blog.sections.map((s) => s.text_html).join('\n\n');
  const out = {
    storybookId: blog.storybookId,
    category: 'phonics',
    title: blog.seo_title,
    body_html,
    body_plain_text: toPlain(body_html),
    sources:
      blog.storybookId.startsWith('hub-') || blog.storybookId.startsWith('write-')
        ? [
            {
              type: 'curriculum',
              ref: 'packages/client/src/features/phonics-learner/lib/korean-phonics-units.ts',
            },
          ]
        : [{ type: 'curriculum', ref: `packages/client/public/hangeul-tree-${blog.storybookId}.html` }],
    generatedAt: blog.generatedAt ?? null,
  };
  fs.writeFileSync(
    path.join(OUT_DIR, `${blog.storybookId}.json`),
    JSON.stringify(out, null, 2) + '\n'
  );
  made++;
  console.log(`✓ ${blog.storybookId} — h2 ${(body_html.match(/<h2>/g) || []).length}개 · ${out.body_plain_text.length}자`);
}
console.log(`\n완료: ${made}개`);
