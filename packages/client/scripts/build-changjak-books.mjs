/**
 * 창작동화 원고: 마크다운 → 회차 페이지 + 인덱스
 *
 *   docs/changjak-books/<id>.md  →  public/changjak-<id>.html  (+ changjak-index.json 갱신)
 *   node packages/client/scripts/build-changjak-books.mjs [--only a04]
 *
 * 🔴 원고는 마크다운이 원본이다. 생성된 html 을 직접 고치면 다음 빌드에 날아간다.
 * 🔴 스타일은 changjak-core.js 가 주입하므로 페이지는 마크업만 낸다(a04 수기본과 같은 구조).
 * 🔴 본문 자수는 여기서 센다 — 손으로 적어 두면 고칠 때마다 어긋난다.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../../../docs/changjak-books');
const PUB = resolve(here, '../public');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// SCENE 의 **라벨** 만 굵게 — 본문에는 마크다운을 쓰지 않는다
const scene = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
// note 는 편집자 메모라 강조·링크를 허용한다
const note = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\n/g, '<br>\n');

function parse(md) {
  const m = md.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('프론트매터(--- ... ---)가 없다');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    // 🔴 감싼 홑따옴표 한 겹만 벗긴다 — 후렴은 큰따옴표가 내용이라 같이 벗기면 사라진다
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^'([\s\S]*)'$/, '$1');
  }
  const body = m[2];

  // 🔴 lookahead 로 자르지 않는다 — `m` 플래그에서 `$` 가 줄 끝에 걸려 섹션이 첫 줄에서 끊긴다.
  //    (프롬프트 빌더에서 같은 정규식으로 "하나도 못 찾았다"가 났던 자리다)
  const secs = body.split(/^(?=##\s)/m);
  const notes = secs.filter((s) => /^##\s+note\s*$/m.test(s.split('\n')[0])).map((s) => s.replace(/^##.*\n/, '').trim());
  const pages = secs
    .filter((s) => /^##\s+p\d+\s*$/.test(s.split('\n')[0]))
    .map((s) => {
      const page = s.split('\n')[0].replace(/^##\s+/, '').trim();
      const sp = s.replace(/^##.*\n/, '').split(/^###\s+SCENE\s*$/m);
      return { page, ko: sp[0].trim(), scene: (sp[1] ?? '').trim() };
    });
  return { meta, notes, pages };
}

function render({ meta, notes, pages }) {
  const chars = pages.reduce((n, p) => n + p.ko.replace(/\s/g, '').length, 0);
  const per = pages.length ? Math.round(chars / pages.length) : 0;
  const badges = [
    `엔진 · ${meta.engine}`,
    `무대 · ${meta.stage}`,
    ...(meta.refrain ? [`후렴 · ${meta.refrain}`] : []),
  ].map((t) => `  <span>${esc(t)}</span>`);
  badges.push(`  <span class="q">${pages.length}스프레드</span>`);
  badges.push(`  <span class="q">본문 ${chars}자 · 쪽당 ${per}자</span>`);

  const body = pages
    .map(
      (p) =>
        `<div class="pg">\n` +
        `  <div class="ko${p.ko ? '' : ' empty'}"><span class="n">${p.page} · 본문</span>${p.ko ? esc(p.ko) : '(글 없음 — 그림만)'}</div>\n` +
        `  <div class="sc"><span class="n">${p.page} · SCENE</span>${scene(p.scene)}</div>\n` +
        `</div>`
    )
    .join('\n\n');

  const noteBlocks = notes.map((n) => `<div class="note">\n${note(n)}\n</div>`);
  // 첫 note 는 머리(집필 과제), 나머지는 꼬리(검수 반영)로 — a04 수기본과 같은 배치
  const head = noteBlocks.length ? noteBlocks[0] + '\n\n' : '';
  const tail = noteBlocks.length > 1 ? '\n\n' + noteBlocks.slice(1).join('\n\n') : '';

  const cast = (meta.cast ?? '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(meta.id.toUpperCase().replace(/^([A-H])/, '$1-'))} ${esc(meta.title)} — 창작동화 1000</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Pretendard Variable',Pretendard,-apple-system,sans-serif;background:#fff8f0;color:#2b2320;line-height:1.75}
</style>
</head>
<body>
<div class="ep">

<header class="hero">
  <div class="kicker">창작동화 1000 · ${esc(meta.group)} · ${esc(String(meta.no).padStart(2, '0'))}</div>
  <h1>${esc(meta.title)}</h1>
  <div class="sub">${esc(meta.sub ?? '')}</div>
</header>

<div class="meta">
${badges.join('\n')}
</div>

${head}${body}${tail}

</div>
<script>
// 🔴 앵커 바인딩 (기획서 §6 규격 ③) — 이 책이 100~150개 앵커 중 무엇을 쓰는가.
${meta.anchorNote ? `// ${meta.anchorNote}` : '// anchorSlug 는 렌더가 승인돼 앵커 보관함(ca-###)에 들어간 뒤에 채운다. 그전엔 null 이 정직하다.'}
window.CJ_EPISODE = {
  id: '${meta.id}',
  cluster: ${meta.cluster ? `'${meta.cluster}'` : 'null'},
  reference: ${meta.reference ? `'${meta.reference}'` : 'null'},
  anchorSlug: ${meta.anchorSlug ? `'${meta.anchorSlug}'` : 'null'},
  prompts: ${meta.prompts ? `'${meta.prompts}'` : 'null'},
  cast: [${cast.map((c) => `'${c}'`).join(', ')}],
};
</script>
<script src="/changjak-prompts.js"></script>
<script src="/changjak-core.js"></script>
</body>
</html>
`;
}

const files = existsSync(SRC) ? readdirSync(SRC).filter((f) => f.endsWith('.md')) : [];
if (!files.length) throw new Error(`원고가 없다: ${SRC}`);

const built = [];
for (const f of files) {
  const id = f.replace(/\.md$/, '');
  if (only && id !== only) continue;
  const doc = parse(readFileSync(join(SRC, f), 'utf8'));
  // 🔴 반쪽 원고를 내보내느니 실패한다 — 쪽이 비면 페이지가 조용히 짧아진다
  if (doc.pages.length !== 12) throw new Error(`${id}: 쪽 ${doc.pages.length}개 (12 이어야 함)`);
  const noScene = doc.pages.filter((p) => !p.scene);
  if (noScene.length) throw new Error(`${id}: SCENE 없음 — ${noScene.map((p) => p.page).join(',')}`);
  writeFileSync(join(PUB, `changjak-${id}.html`), render(doc), 'utf8');
  built.push({ id, ...doc.meta, chars: doc.pages.reduce((n, p) => n + p.ko.replace(/\s/g, '').length, 0) });
}

// 인덱스 — 기획서·시트는 앞에 고정, 회차는 id 순
const idxPath = join(PUB, 'changjak-index.json');
const idx = JSON.parse(readFileSync(idxPath, 'utf8'));
const fixed = idx.filter((e) => !/^changjak-[a-h]\d+\.html$/.test(e.file));
const eps = [...idx.filter((e) => /^changjak-[a-h]\d+\.html$/.test(e.file))];
for (const b of built) {
  const file = `changjak-${b.id}.html`;
  const label = `${b.id.toUpperCase().replace(/^([A-H])/, '$1-')} ${b.emoji ?? '📗'} ${b.engine}`;
  const row = { file, label, title: b.title };
  const at = eps.findIndex((e) => e.file === file);
  at < 0 ? eps.push(row) : (eps[at] = row);
}
eps.sort((a, b) => a.file.localeCompare(b.file));
writeFileSync(idxPath, JSON.stringify([...fixed, ...eps], null, 2) + '\n', 'utf8');

console.log(`회차 ${built.length}권 → public/`);
for (const b of built) console.log(`  ${b.id} 「${b.title}」 ${b.engine} · 본문 ${b.chars}자`);
