// 콘텐츠 현황판 — 프로덕션을 통째로 읽어 「뭐가 있고 뭐가 없나」를 한 장으로 굽는다.
//
//   node scripts/build-content-status.mjs                 # 프로덕션
//   node scripts/build-content-status.mjs --api=http://localhost:3500
//   node scripts/build-content-status.mjs --out=../client/public/content-status.html
//
// 🔴 왜 스크립트인가 — 책 하나하나를 열어야 알 수 있는 필드(key_objects·games·flashcards…)라
//    브라우저에서 라이브로 하면 요청이 360개다. 여기서 한 번 굽고 정적 파일로 본다.
// 🔴 이 파일이 기억을 대신한다. 「그거 몇 권이었지」를 메모리에서 찾지 말고 다시 구울 것.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const API = arg('api', 'https://www.tangobook.co.kr').replace(/\/$/, '');
const OUT = path.resolve(
  __dirname,
  arg('out', path.join('..', '..', 'client', 'public', 'content-status.html'))
);
const CONC = Number(arg('concurrency', '12'));

/** 동시에 N개씩 — 프로덕션을 때리므로 과하게 올리지 않는다. */
async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      for (;;) {
        const idx = i++;
        if (idx >= items.length) return;
        out[idx] = await fn(items[idx], idx);
      }
    })
  );
  return out;
}

const num = (v) => (Array.isArray(v) ? v.length : v ? 1 : 0);

/** 한 권에서 「있나 없나」를 뽑는다. 축 이름이 곧 화면의 열이다. */
function probe(sb) {
  const pages = sb.pages ?? [];
  const ko = sb.key_objects ?? sb.keyObjects ?? [];
  const koi = sb.keyObjectImages ?? [];
  const fc = sb.flashcards ?? [];
  const pc = sb.phonicsConfig ?? {};
  const isPhonics = sb.type === 'phonics';

  return {
    id: sb.id,
    title: sb.title ?? '',
    category: sb.category || sb.folder || '(없음)',
    isPublic: !!sb.isPublic,
    isPhonics,
    langs: (sb.languages ?? []).length,
    styles: Object.keys(sb.styleAssets ?? {}).length,

    // 제품 축
    pages: pages.length,
    illust: pages.filter((p) => p.illustrationUrl).length,
    tts: pages.filter((p) => p.ttsUrl).length,
    cover: sb.coverImage ? 1 : 0,
    words: isPhonics ? (pc.targetWords ?? []).length : ko.length,
    cards: isPhonics ? fc.filter((f) => f.imageUrl).length : koi.length,
    keypoints: isPhonics
      ? fc.filter((f) => (f.keypoints ?? []).length).length
      : koi.filter((k) => (k?.keypoints ?? []).length).length,
    games: num(sb.games),
    hidden: num(sb.hiddenObjectScenes),
    chant: sb.chant ? 1 : 0,

    // 유통 축
    longform: num(sb.longformProjects),
    audiobook: num(sb.audiobookProjects),
    blog: num(sb.blogPosts),
    cardnews: num(sb.cardNewsProjects),

    // 메타 축 — 아직 스키마가 없다. 생기면 여기만 고치면 화면이 따라온다.
    theme: sb.theme ?? sb.curriculumTheme ?? null,
    setting: sb.setting ?? null,
    cast: sb.cast ?? null,
  };
}

/** 열 정의 — 화면과 집계가 같은 배열을 본다(둘이 갈라지지 않게). */
const COLS = [
  { key: 'pages', label: '쪽', group: '제품' },
  { key: 'illust', label: '삽화', group: '제품' },
  { key: 'tts', label: '나레이션', group: '제품' },
  { key: 'cover', label: '표지', group: '제품' },
  { key: 'words', label: '낱말', group: '제품' },
  { key: 'cards', label: '낱말카드', group: '제품' },
  { key: 'keypoints', label: '키포인트', group: '제품' },
  { key: 'games', label: '게임', group: '제품' },
  { key: 'hidden', label: '숨은그림', group: '제품' },
  { key: 'chant', label: '챈트', group: '제품' },
  { key: 'longform', label: '롱폼', group: '유통' },
  { key: 'audiobook', label: '오디오북', group: '유통' },
  { key: 'blog', label: '블로그', group: '유통' },
  { key: 'cardnews', label: '카드뉴스', group: '유통' },
  { key: 'theme', label: '주제', group: '메타' },
  { key: 'setting', label: '무대', group: '메타' },
  { key: 'cast', label: '캐스트', group: '메타' },
];

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function render(rows, meta) {
  const cats = [...new Set(rows.map((r) => r.category))].sort((a, b) => {
    const n = (c) => rows.filter((r) => r.category === c).length;
    return n(b) - n(a);
  });

  // 카테고리별 집계 — 「몇 권 중 몇 권이 그 칸을 갖고 있나」
  const agg = cats.map((c) => {
    const g = rows.filter((r) => r.category === c);
    const have = {};
    for (const col of COLS) have[col.key] = g.filter((r) => r[col.key]).length;
    return { cat: c, n: g.length, have, pub: g.filter((r) => r.isPublic).length };
  });

  const cell = (n, total) => {
    if (!total) return '<td class="z">—</td>';
    const pct = Math.round((n / total) * 100);
    const cls = pct === 0 ? 'z' : pct === 100 ? 'f' : pct >= 50 ? 'h' : 'l';
    return `<td class="${cls}">${n}<span class="p">/${total}</span></td>`;
  };

  const groupRow = () => {
    const gs = [];
    let cur = null;
    for (const c of COLS) {
      if (c.group !== cur) {
        gs.push({ g: c.group, n: 1 });
        cur = c.group;
      } else gs[gs.length - 1].n++;
    }
    return `<tr class="gh"><th></th><th></th>${gs
      .map((x) => `<th colspan="${x.n}" class="g-${x.g}">${x.g}</th>`)
      .join('')}</tr>`;
  };

  return `<title>콘텐츠 현황판</title>
<style>
:root{--bg:#FBF8F4;--sf:#fff;--sunk:#F4EEE5;--ink:#1F1B18;--mut:#6B615A;--faint:#8A7F76;--line:#E5DCD0;
--f:#17A184;--fw:#E4F4EF;--h:#C08A16;--hw:#F8F0DC;--l:#E4572E;--lw:#FBEBE4;--z:#B4A99D}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#16130F;--sf:#201C18;--sunk:#1B1713;
--ink:#F1EBE2;--mut:#B0A69C;--faint:#948A81;--line:#332C25;--f:#3FCFAE;--fw:#142723;--h:#E0B457;--hw:#2A2216;
--l:#FF7A54;--lw:#2E1F18;--z:#5E554D}}
:root[data-theme=dark]{--bg:#16130F;--sf:#201C18;--sunk:#1B1713;--ink:#F1EBE2;--mut:#B0A69C;--faint:#948A81;
--line:#332C25;--f:#3FCFAE;--fw:#142723;--h:#E0B457;--hw:#2A2216;--l:#FF7A54;--lw:#2E1F18;--z:#5E554D}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"IBM Plex Sans KR","Apple SD Gothic Neo",system-ui,sans-serif;
font-size:14px;line-height:1.6;word-break:keep-all}
.wrap{max-width:1500px;margin:0 auto;padding:28px clamp(14px,3vw,28px) 80px}
h1{font-size:1.7rem;margin:0 0 6px;letter-spacing:-.03em}
h2{font-size:1.15rem;margin:34px 0 10px;letter-spacing:-.02em}
.sub{color:var(--mut);margin:0 0 22px;font-size:.93rem}
.sub code{background:var(--sunk);padding:1px 5px;border-radius:4px;font-size:.86rem}
.tw{overflow:auto;border:1px solid var(--line);border-radius:11px;background:var(--sf);max-height:78vh}
table{border-collapse:separate;border-spacing:0;width:100%;font-size:.86rem}
th,td{padding:6px 9px;border-bottom:1px solid var(--line);white-space:nowrap;text-align:right}
th:first-child,td:first-child{text-align:left;position:sticky;left:0;background:var(--sf);z-index:2;
max-width:280px;overflow:hidden;text-overflow:ellipsis}
thead th{position:sticky;top:0;background:var(--sunk);z-index:3;font-weight:600;font-size:.78rem;color:var(--mut)}
thead tr.gh th{top:0;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase}
thead tr:nth-child(2) th{top:28px}
.gh .g-제품{color:var(--f)}.gh .g-유통{color:var(--h)}.gh .g-메타{color:var(--l)}
td.f{background:var(--fw);color:var(--f);font-weight:600}
td.h{background:var(--hw);color:var(--h);font-weight:600}
td.l{background:var(--lw);color:var(--l);font-weight:600}
td.z{color:var(--z)}
.p{font-size:.78em;opacity:.6;font-weight:400}
tbody tr:hover td{background:var(--sunk)}
tbody tr:hover td:first-child{background:var(--sunk)}
.legend{display:flex;gap:14px;flex-wrap:wrap;margin:12px 0 0;font-size:.82rem;color:var(--mut)}
.legend b{padding:2px 8px;border-radius:5px;font-weight:600}
.legend .f{background:var(--fw);color:var(--f)}.legend .h{background:var(--hw);color:var(--h)}
.legend .l{background:var(--lw);color:var(--l)}.legend .z{background:var(--sunk);color:var(--z)}
.stat{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:1px;background:var(--line);
border:1px solid var(--line);border-radius:11px;overflow:hidden;margin:0 0 6px}
.stat>div{background:var(--sf);padding:14px 14px}
.stat .v{font-size:1.5rem;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.stat .k{font-size:.78rem;color:var(--mut);margin-top:3px}
.note{background:var(--lw);border:1px solid var(--l);border-radius:10px;padding:14px 16px;margin:18px 0;color:var(--mut)}
.note b{color:var(--ink)}
</style>
<div class="wrap">
<h1>콘텐츠 현황판</h1>
<p class="sub">${meta.at} · <code>${esc(meta.api)}</code> 실측 · 책 ${meta.books}권 · 파닉스 ${meta.phonics}단원<br>
다시 구우려면 <code>node scripts/build-content-status.mjs</code></p>

<div class="stat">
  <div><div class="v">${meta.books + meta.phonics}</div><div class="k">전체</div></div>
  <div><div class="v">${meta.pub}</div><div class="k">공개</div></div>
  <div><div class="v">${meta.books}</div><div class="k">동화책</div></div>
  <div><div class="v">${meta.phonics}</div><div class="k">파닉스 단원</div></div>
  <div><div class="v">${meta.words.toLocaleString()}</div><div class="k">낱말 항목</div></div>
  <div><div class="v">${meta.uniqWords.toLocaleString()}</div><div class="k">유니크 낱말</div></div>
  <div><div class="v">${meta.multi}%</div><div class="k">2권 이상 등장</div></div>
</div>
<div class="legend">
  <span><b class="f">100%</b> 다 있음</span><span><b class="h">50%+</b> 절반 넘음</span>
  <span><b class="l">~50%</b> 절반 미만</span><span><b class="z">0</b> 없음</span>
</div>

<h2>라인별 — 몇 권 중 몇 권이 그 칸을 갖고 있나</h2>
<div class="tw"><table>
<thead>${groupRow()}<tr><th>라인</th><th>권</th>${COLS.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
<tbody>
${agg
  .map(
    (a) =>
      `<tr><td>${esc(a.cat)}</td><td>${a.n}<span class="p">/${a.pub}공개</span></td>${COLS.map((c) =>
        cell(a.have[c.key], a.n)
      ).join('')}</tr>`
  )
  .join('\n')}
</tbody></table></div>

<div class="note">
🔴 <b>메타 3열(주제·무대·캐스트)이 전부 0 인 것이 정상이다</b> — 아직 스키마에 그 필드가 없다.
스키마가 생기면 이 표가 <b>「어느 주제가 비었나」</b>를 그대로 보여준다.<br>
🔴 <b>블로그·카드뉴스가 0 에 가까운 것도 정상</b> — 실제 데이터는 <code>/marketing</code>(Supabase)에 있고
여기 열은 editor2(R2) 쪽이다. 두 벌이 있다는 사실 자체가 이 표의 정보다.
</div>

<h2>책별 — 전체 ${rows.length}권</h2>
<div class="tw"><table>
<thead>${groupRow()}<tr><th>제목</th><th>라인</th>${COLS.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
<tbody>
${rows
  .map(
    (r) =>
      `<tr><td>${r.isPublic ? '' : '<span class="p">비공개 </span>'}${esc(r.title)}</td><td class="p">${esc(
        r.category
      )}</td>${COLS.map((c) => {
        const v = r[c.key];
        const n = typeof v === 'number' ? v : v ? 1 : 0;
        return `<td class="${n ? 'f' : 'z'}">${n || '—'}</td>`;
      }).join('')}</tr>`
  )
  .join('\n')}
</tbody></table></div>
</div>`;
}

async function main() {
  console.log(`읽는 중: ${API}`);
  const list = await fetch(`${API}/api/storybooks`).then((r) => r.json());
  const summaries = list.data ?? list;
  console.log(`  목록 ${summaries.length}건 · 상세 받는 중(동시 ${CONC})…`);

  const full = await pool(summaries, CONC, async (s) => {
    try {
      const r = await fetch(`${API}/api/storybooks/${s.id}`);
      const j = await r.json();
      return j.data ?? j;
    } catch {
      return null;
    }
  });

  const rows = full.filter(Boolean).map(probe);
  const books = rows.filter((r) => !r.isPhonics);
  const phonics = rows.filter((r) => r.isPhonics);

  // 낱말 재출현 — 「같은 낱말이 여러 책에」가 우리 학습 설계의 축이라 여기서 같이 잰다.
  const wordBooks = new Map();
  for (const sb of full.filter(Boolean)) {
    if (sb.type === 'phonics') continue;
    for (const k of sb.key_objects ?? sb.keyObjects ?? []) {
      const w = (k.korean || k.name || '').trim();
      if (!w) continue;
      if (!wordBooks.has(w)) wordBooks.set(w, new Set());
      wordBooks.get(w).add(sb.id);
    }
  }
  const uniq = wordBooks.size;
  const multi = uniq ? Math.round(([...wordBooks.values()].filter((s) => s.size >= 2).length / uniq) * 100) : 0;

  rows.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

  const html = render(rows, {
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    api: API,
    books: books.length,
    phonics: phonics.length,
    pub: rows.filter((r) => r.isPublic).length,
    words: rows.reduce((a, r) => a + r.words, 0),
    uniqWords: uniq,
    multi,
  });

  // 🔴 임시로 쓰고 옮긴다 — 중간에 죽으면 기존 파일을 비우게 된다.
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const tmp = `${OUT}.tmp`;
  fs.writeFileSync(tmp, html, 'utf8');
  fs.renameSync(tmp, OUT);

  console.log(`\n동화책 ${books.length} · 파닉스 ${phonics.length} · 공개 ${rows.filter((r) => r.isPublic).length}`);
  console.log(`유니크 낱말 ${uniq} · 2권 이상 등장 ${multi}%`);
  console.log(`→ ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
