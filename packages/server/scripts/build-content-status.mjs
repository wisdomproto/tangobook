// 콘텐츠 현황판 — 프로덕션을 통째로 읽어 「뭐가 있고 뭐가 없나」를 한 장으로 굽는다.
//
//   node scripts/build-content-status.mjs                 # 프로덕션
//   node scripts/build-content-status.mjs --api=http://localhost:3500
//   node scripts/build-content-status.mjs --selftest      # 네트워크 없이 집계식만 검사
//
// 🔴 집계식은 여기 없다 — `@tangobook/shared` 의 `buildContentStatus` 한 곳에만 있다.
//    서버 `GET /api/content-status` 도 **같은 함수**를 쓴다. 각자 세면 값이 갈라진다
//    (2026-09-04 에 같은 값이 세 개(129/83 · 126/72 · 128/86)가 됐던 게 그 병이다).
//    ⚠️ 그래서 `pnpm --filter @tangobook/shared build` 가 선행돼야 돈다.
//
// 🔴 여기서 굽는 건 **폴백**이다. 화면은 `/api/content-status`(라이브)를 먼저 보고,
//    그게 안 되면 이 정적 파일을 쓴다. 정적 파일만 있으면 프로덕션에서 배포 시점에 멈춘다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContentStatus, computeSeam, pct } from '@tangobook/shared';

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
const OUT_JSON = OUT.replace(/\.html$/, '.json');
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

/**
 * 대분류 — 표의 맨 위 층. 🔴 순서가 곧 화면 순서라 의미순으로 둔다(권수순 아님).
 * 라인(category)이 어느 대분류에 드는지는 여기 한 곳에서만 정한다. 창작동화는 「미공개 · 파닉스 아님」으로 잡는다
 * (시리즈 이름이 19개라 목록을 손으로 들면 새 시리즈마다 빠진다).
 */
const GROUPS = [
  { name: '파닉스', match: (cat, r) => r.isPhonics },
  { name: '세계 명작', match: (cat) => cat === '세계 명작' },
  { name: '전래 동화', match: (cat) => cat === '전래 동화' },
  { name: '생활 동화', match: (cat) => cat === '생활동화' || cat === '호리 유치원동화' },
  { name: '자연 관찰 · 논픽션', match: (cat) => /친구들$|우주와 자연|우리 몸|호리 세상 탐험/.test(cat) },
  { name: '창작 동화', match: (cat, r, pubOfCat) => pubOfCat === 0 },
  { name: '기타', match: () => true },
];

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function render(rows, meta) {
  const cats = [...new Set(rows.map((r) => r.category))].sort((a, b) => {
    const n = (c) => rows.filter((r) => r.category === c).length;
    return n(b) - n(a);
  });

  const agg = cats.map((c) => {
    const g = rows.filter((r) => r.category === c);
    const have = {};
    for (const col of COLS) have[col.key] = g.filter((r) => r[col.key]).length;
    return { cat: c, n: g.length, have, pub: g.filter((r) => r.isPublic).length };
  });

  // 대분류 배정 — 라인마다 첫 번째로 맞는 GROUPS 항목. 공개 0권 판정은 라인 단위(창작동화 시리즈).
  const groupOf = (a) => {
    const sample = rows.find((r) => r.category === a.cat) ?? {};
    return GROUPS.findIndex((g) => g.match(a.cat, sample, a.pub));
  };
  const grouped = GROUPS.map((g, gi) => ({ ...g, gi, cats: agg.filter((a) => groupOf(a) === gi) })).filter(
    (g) => g.cats.length
  );

  // 레벨 칸 — 난이도 표를 여기로 접었다. 분포(L1·L2·L3 중 0 아닌 것만) · 중앙 어절 · 선언≠실측.
  //    파닉스 줄은 레벨이 무의미하니 대신 예문 커버리지(이음매)를 보여준다.
  const trackOf = (cat) => {
    const ids = rows.filter((r) => r.category === cat && r.isPhonics).map((r) => String(r.id).split('-')[0]);
    if (!ids.length) return null;
    const cnt = {};
    for (const t of ids) cnt[t] = (cnt[t] ?? 0) + 1;
    return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
  };
  const lvDist = (actual, median, wrong) => {
    const parts = ['L1', 'L2', 'L3'].filter((l) => actual?.[l]).map((l) => `<b>${l}</b> ${actual[l]}`);
    if (!parts.length) return '<span class="p">—</span>';
    return (
      parts.join(' ') +
      (median ? ` <span class="p">· ${median}어절</span>` : '') +
      (wrong ? ` <span class="bad">≠${wrong}</span>` : '')
    );
  };
  const seamCell = (cat) => {
    const t = trackOf(cat);
    const st = t && meta.seam.byTrack.find((x) => x.track === t);
    if (!st) return '<span class="p">—</span>';
    const cls = st.coveredPct >= 90 ? 'f' : st.coveredPct >= 50 ? 'h' : 'l';
    return `<span class="${cls}" style="padding:1px 6px;border-radius:5px">예문 ${st.covered}/${st.words} · ${st.coveredPct}%</span>`;
  };

  const cell = (n, total) => {
    if (!total) return '<td class="z">—</td>';
    const p = Math.round((n / total) * 100);
    const cls = p === 0 ? 'z' : p === 100 ? 'f' : p >= 50 ? 'h' : 'l';
    return `<td class="${cls}">${n}<span class="p">/${total}</span></td>`;
  };

  const groupRow = (lead = 2) => {
    const gs = [];
    let cur = null;
    for (const c of COLS) {
      if (c.group !== cur) {
        gs.push({ g: c.group, n: 1 });
        cur = c.group;
      } else gs[gs.length - 1].n++;
    }
    return `<tr class="gh">${'<th></th>'.repeat(lead)}${gs
      .map((x) => `<th colspan="${x.n}" class="g-${x.g}">${x.g}</th>`)
      .join('')}</tr>`;
  };

  // 🔴 charset 을 빼면 한글이 깨진다 — 서버가 헤더로 안 알려줄 때(파일 직접 열기 포함) 브라우저가 추측한다.
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>콘텐츠 현황판</title>
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
#q{width:min(420px,100%);padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--sf);
color:var(--ink);font:inherit;font-size:.9rem;margin:0 10px 10px 0}
#q:focus{outline:2px solid var(--h);outline-offset:1px}
.chk{font-size:.86rem;color:var(--mut);margin-right:10px;cursor:pointer;user-select:none}
#cnt{font-size:.86rem}
.tb{font:inherit;font-size:.82rem;padding:5px 11px;border:1px solid var(--line);border-radius:7px;background:var(--sf);color:var(--mut);cursor:pointer;margin:0 6px 10px 0}
.tb:hover{color:var(--ink);border-color:var(--h)}
tr.grp td{cursor:pointer;font-weight:700;background:var(--hw);color:var(--ink)}
tr.grp td:first-child{background:var(--hw)}
tr.cat td{cursor:pointer;font-weight:600;background:var(--sunk)}
tr.cat td:first-child{background:var(--sunk);padding-left:22px}
tr.grp .tg,tr.cat .tg{display:inline-block;width:16px;color:var(--faint);transition:.15s;font-weight:400}
tr.grp[aria-expanded=true] .tg,tr.cat[aria-expanded=true] .tg{transform:rotate(90deg)}
tr.bk td:first-child{padding-left:44px;font-weight:400}
th.sort{cursor:pointer;user-select:none}
th.sort:hover{color:var(--ink)}
th.sort[data-dir]::after{content:' ▼';font-size:.7em}
th.sort[data-dir=asc]::after{content:' ▲'}
.bad{color:var(--l);font-weight:700;font-size:.8em}
</style>
<div class="wrap">
<h1>콘텐츠 현황판</h1>
<p class="sub">${meta.at} · <code>${esc(meta.api)}</code> 실측 · 책 ${meta.books}권 · 파닉스 ${meta.phonics}단원<br>
다시 구우려면 <code>node scripts/build-content-status.mjs</code> · 라이브는 <code>/api/content-status</code></p>

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

<h2>대분류 › 라인 › 책 — 한 표</h2>
<p class="sub" style="margin:0 0 10px">대분류·라인 행을 누르면 아래 층이 펼쳐진다. 묶음 셀은 <b>몇 권 중 몇 권</b>, 책 셀은 그 책의 값. <b>열 머리를 누르면 그 열로 정렬</b>(대분류 순서는 고정, 안에서 라인·책이 정렬). 레벨 열 = 라인은 <b>L1·L2·L3 분포 · 중앙 어절 · 선언≠실측</b>, 책은 실측 레벨, 파닉스 줄은 <b>예문 커버리지</b>. 검색하면 맞는 책이 있는 줄만 펼쳐진 채 남는다. <code>backup</code> 폴더는 뺐다. 고치기 = <code>node scripts/fix-reading-levels.mjs --apply</code></p>
<input id="q" placeholder="제목·라인으로 거르기 (예: 전래 · 코코네 · 명작)" autocomplete="off">
<label class="chk"><input type="checkbox" id="pubOnly"> 공개만</label>
<button class="tb" id="expAll" type="button">전부 펼치기</button>
<button class="tb" id="colAll" type="button">전부 접기</button>
<span class="p" id="cnt"></span>
<div class="tw"><table id="books">
<thead>${groupRow(3)}<tr><th>대분류 › 라인 › 책</th><th class="sort" data-key="n">권</th><th class="sort" data-key="lv">레벨</th>${COLS.map(
      (c) => `<th class="sort" data-key="${c.key}">${c.label}</th>`
    ).join('')}</tr></thead>
<tbody>
${grouped
  .map((g) => {
    const gn = g.cats.reduce((t, a) => t + a.n, 0);
    const gp = g.cats.reduce((t, a) => t + a.pub, 0);
    const ghave = {};
    for (const col of COLS) ghave[col.key] = g.cats.reduce((t, a) => t + a.have[col.key], 0);
    const gact = {};
    let gwrong = 0;
    for (const a of g.cats) {
      const c = meta.categories.find((x) => x.category === a.cat) ?? {};
      for (const [l, n] of Object.entries(c.actual ?? {})) gact[l] = (gact[l] ?? 0) + n;
      gwrong += c.levelWrong ?? 0;
    }
    const gIsPhonics = g.cats.every((a) => trackOf(a.cat));
    const gLv = gIsPhonics ? '<span class="p">—</span>' : lvDist(gact, 0, gwrong);
    const gv = { n: gn, lv: 0, ...Object.fromEntries(COLS.map((col) => [col.key, ghave[col.key]])) };
    const grow =
      `<tr class="grp" data-g="${g.gi}" data-k="${esc(g.name).toLowerCase()}" data-v='${JSON.stringify(gv)}' aria-expanded="false">` +
      `<td><span class="tg">▸</span>${esc(g.name)}<span class="p"> · ${g.cats.length}라인</span></td>` +
      `<td>${gn}<span class="p">/${gp}공개</span></td><td>${gLv}</td>${COLS.map((col) => cell(ghave[col.key], gn)).join('')}</tr>`;
    const crows = g.cats
      .map((a, ci) => {
        const c = meta.categories.find((x) => x.category === a.cat) ?? {};
        const key = `${g.gi}-${ci}`;
        const lvSum = trackOf(a.cat) ? seamCell(a.cat) : lvDist(c.actual, c.wordsMedian, c.levelWrong);
        const cv = { n: a.n, lv: c.wordsMedian || 0, ...Object.fromEntries(COLS.map((col) => [col.key, a.have[col.key]])) };
        const head =
          `<tr class="cat" data-g="${g.gi}" data-c="${key}" data-k="${esc(a.cat).toLowerCase()}" data-v='${JSON.stringify(cv)}' aria-expanded="false" hidden><td><span class="tg">▸</span>${esc(a.cat)}</td>` +
          `<td>${a.n}<span class="p">/${a.pub}공개</span></td><td>${lvSum}</td>${COLS.map((col) => cell(a.have[col.key], a.n)).join('')}</tr>`;
        const kids = rows
          .filter((r) => r.category === a.cat)
          .map((r) => {
            const lvN = r.levelActual ? Number(r.levelActual.slice(1)) : 0;
            const lv = r.isPhonics
              ? '<td class="p">—</td>'
              : r.levelDeclared && r.levelActual && r.levelDeclared !== r.levelActual
                ? `<td class="l">${r.levelDeclared}→${r.levelActual}</td>`
                : `<td class="${r.levelDeclared ? 'f' : 'z'}">${r.levelActual ?? '—'}${r.levelDeclared ? '' : '<span class="p"> 미선언</span>'}</td>`;
            const bv = {
              n: 1,
              lv: lvN,
              ...Object.fromEntries(
                COLS.map((col) => {
                  const v = r[col.key];
                  return [col.key, typeof v === 'number' ? v : v ? 1 : 0];
                })
              ),
            };
            return `<tr class="bk" data-g="${g.gi}" data-c="${key}" data-k="${esc(`${r.title} ${r.category}`).toLowerCase()}" data-pub="${r.isPublic ? 1 : 0}" data-v='${JSON.stringify(bv)}' hidden><td>${
              r.isPublic ? '' : '<span class="p">비공개 </span>'
            }${esc(r.title)}</td><td class="p">${r.isPhonics ? '단원' : ''}</td>${lv}${COLS.map((col) => {
              const v = r[col.key];
              const n = typeof v === 'number' ? v : v ? 1 : 0;
              return `<td class="${n ? 'f' : 'z'}">${n || '—'}</td>`;
            }).join('')}</tr>`;
          })
          .join('\n');
        return head + '\n' + kids;
      })
      .join('\n');
    return grow + '\n' + crows;
  })
  .join('\n')}
</tbody></table></div>

<div class="note">
🔴 <b>메타 3열(주제·무대·캐스트)이 전부 0 인 것이 정상이다</b> — 아직 스키마에 그 필드가 없다.
스키마가 생기면 이 표가 <b>「어느 주제가 비었나」</b>를 그대로 보여준다.<br>
🔴 <b>블로그·카드뉴스가 0 에 가까운 것도 정상</b> — 실제 데이터는 <code>/marketing</code>(Supabase)에 있고
여기 열은 editor2(R2) 쪽이다. 두 벌이 있다는 사실 자체가 이 표의 정보다.
</div>

<h2>이음매 — 파닉스 낱말에 예문(동화책 쪽)이 붙나</h2>
<div class="note">
🔴 <b>나무 동화(한글 나무·ABC 나무)도 동화책이다.</b> 메인 라인업 밖(<code>type:'phonics'</code> 안의 8쪽)이라고
빼고 세면 없는 구멍이 생긴다 — 실제로 그렇게 세서 한글을 67%로 잘못 보고했다. <b>인용은 「예문 있음」으로.</b>
</div>
<div class="tw"><table>
<thead><tr><th>트랙</th><th>단원</th><th>낱말</th><th>예문 있음</th><th>그중 다른 동화책</th><th>그 단원 나무 동화</th></tr></thead>
<tbody>
${meta.seam.byTrack
  .map(
    (t) =>
      `<tr><td>${esc(t.track)}</td><td>${t.units}</td><td>${t.words}</td>` +
      `<td class="${t.coveredPct >= 90 ? 'f' : t.coveredPct >= 50 ? 'h' : 'l'}">${t.covered}<span class="p">/${t.words} · ${t.coveredPct}%</span></td>` +
      `<td class="p">${t.other}</td><td class="p">${t.own}</td></tr>`
  )
  .join('\n')}
</tbody></table></div>
<p class="sub">예문 없는 낱말: ${
    meta.seam.units
      .filter((u) => u.missing.length)
      .map((u) => `<b>${esc(u.id)}</b> ${u.missing.map(esc).join('·')}`)
      .join(' &nbsp;/&nbsp; ') || '없음'
  }</p>

</div>
<script>
// 대분류 › 라인 › 책 — 세 층 펼치기/접기 + 거르기 + 열 정렬. 라이브러리 없이.
(function(){
  var q=document.getElementById('q'),p=document.getElementById('pubOnly'),c=document.getElementById('cnt');
  var tbody=document.querySelector('#books tbody');
  var grps=[].slice.call(tbody.querySelectorAll('tr.grp'));
  var cats=[].slice.call(tbody.querySelectorAll('tr.cat'));
  var books=[].slice.call(tbody.querySelectorAll('tr.bk'));
  var openG={}, openC={};
  var val=function(r,k){ try{ return (JSON.parse(r.dataset.v)||{})[k]||0 }catch(e){ return 0 } };

  function run(){
    var s=q.value.trim().toLowerCase(), only=p.checked, shown=0, total=0;
    grps.forEach(function(gr){
      var gi=gr.dataset.g, gAny=false, gVis=0;
      cats.filter(function(cr){return cr.dataset.g===gi}).forEach(function(cr){
        var ci=cr.dataset.c, cAny=false, cVis=0;
        var catMatch = s && cr.dataset.k.indexOf(s)>=0;
        books.filter(function(r){return r.dataset.c===ci}).forEach(function(r){
          var ok=(!s||r.dataset.k.indexOf(s)>=0||catMatch)&&(!only||r.dataset.pub==='1');
          if(!only||r.dataset.pub==='1') total++;
          var show = s ? ok : (openG[gi] && openC[ci] && ok);
          r.hidden=!show; if(ok){cAny=true; cVis++;}
        });
        cr.hidden = s ? !cAny : !openG[gi];
        cr.setAttribute('aria-expanded', s ? 'true' : (openC[ci]?'true':'false'));
        if(cAny){gAny=true; gVis+=cVis;}
      });
      gr.hidden = s ? !gAny : false;
      gr.setAttribute('aria-expanded', s ? 'true' : (openG[gi]?'true':'false'));
      if(!gr.hidden) shown+=gVis;
    });
    c.textContent = s ? ('맞는 책 '+shown+'권') : ('책 '+total+'권 · 대분류 '+grps.length+' · 라인 '+cats.length);
  }
  grps.forEach(function(gr){ gr.addEventListener('click',function(){ if(q.value.trim())return; openG[gr.dataset.g]=!openG[gr.dataset.g]; run(); }); });
  cats.forEach(function(cr){ cr.addEventListener('click',function(){ if(q.value.trim())return; openC[cr.dataset.c]=!openC[cr.dataset.c]; run(); }); });
  document.getElementById('expAll').onclick=function(){ q.value=''; grps.forEach(function(g){openG[g.dataset.g]=true}); cats.forEach(function(cr){openC[cr.dataset.c]=true}); run(); };
  document.getElementById('colAll').onclick=function(){ q.value=''; openG={}; openC={}; run(); };

  // 정렬 — 대분류 순서는 고정(의미순). 그 안에서 라인을, 라인 안에서 책을 그 열 값으로.
  var sortKey=null, sortDir='desc';
  function sortRows(){
    var frag=document.createDocumentFragment();
    grps.forEach(function(gr){
      var gi=gr.dataset.g;
      var cs=cats.filter(function(cr){return cr.dataset.g===gi});
      if(sortKey) cs.sort(function(a,b){ var d=val(b,sortKey)-val(a,sortKey); return sortDir==='asc'?-d:d; });
      frag.appendChild(gr);
      cs.forEach(function(cr){
        var bs=books.filter(function(r){return r.dataset.c===cr.dataset.c});
        if(sortKey) bs.sort(function(a,b){ var d=val(b,sortKey)-val(a,sortKey); return sortDir==='asc'?-d:d; });
        frag.appendChild(cr); bs.forEach(function(r){ frag.appendChild(r); });
      });
    });
    tbody.appendChild(frag);
  }
  [].forEach.call(document.querySelectorAll('#books th.sort'),function(th){
    th.addEventListener('click',function(){
      var k=th.dataset.key;
      if(sortKey===k){ sortDir = sortDir==='desc'?'asc':'desc'; } else { sortKey=k; sortDir='desc'; }
      [].forEach.call(document.querySelectorAll('#books th.sort'),function(t){ t.removeAttribute('data-dir'); });
      th.setAttribute('data-dir',sortDir);
      sortRows(); run();
    });
  });
  q.addEventListener('input',run); p.addEventListener('change',run); run();
})();
</script>`;
}

/** 네트워크 없이 집계식만 검사한다: `node build-content-status.mjs --selftest` */
function selftest() {
  const s = computeSeam(
    [
      // 가방: 다른 동화책엔 없고 자기 나무 동화엔 있다 → covered 지만 other 는 아니다
      { id: 'kr-h1-u02', title: 'ㄱ', targetWords: ['고기', '가방'], ownWords: ['가방', '열매'] },
      { id: 'kr-h1-u01', title: '모음', targetWords: ['나비'], ownWords: [] },
      { id: 'en-b1-u01', title: 'Aa', targetWords: ['Cat', 'dog'], ownWords: [] },
      { id: 'kr-h1-u03', title: 'ㄴ', targetWords: [], ownWords: [] },
    ],
    new Set(['고기', '나비', 'cat'])
  );
  const eq = (a, b, m) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
  };
  const u02 = s.units.find((u) => u.id === 'kr-h1-u02');
  eq(s.units.map((u) => u.id), ['en-b1-u01', 'kr-h1-u01', 'kr-h1-u02', 'kr-h1-u03'], '진도순 정렬');
  eq([s.other, s.covered, s.words], [3, 4, 5], '두 층 합계');
  eq([u02.other, u02.own, u02.covered], [1, 1, 2], '나무 동화 폴백');
  eq(u02.missing, [], '폴백이 있으면 missing 아님');
  eq(s.units.find((u) => u.id === 'en-b1-u01').missing, ['dog'], '둘 다 없으면 missing');
  eq(s.units.find((u) => u.id === 'en-b1-u01').other, 1, '영어 대소문자 무시');
  eq(s.units.find((u) => u.id === 'kr-h1-u03').words, 0, '빈 단원');
  eq(pct(3, 5), 60, '퍼센트');
  eq(pct(0, 0), 0, '0으로 나누기');

  // 🔴 집계 전체에서도 「나무 동화도 동화책」이 지켜지나 — computeSeam 만 맞고 위에서 틀린 적이 있다
  //    (ownWords 를 `korean || name` 로 하나만 골라 영어가 33%로 나왔던 버그).
  const st = buildContentStatus([
    {
      id: 'b1',
      title: '책',
      category: '명작',
      isPublic: true,
      pages: [{ text: '고기를 먹었다.' }],
      key_objects: [{ korean: '고기' }],
    },
    {
      id: 'kr-h1-u02',
      type: 'phonics',
      title: 'ㄱ',
      phonicsConfig: { targetWords: ['고기', '가방'] },
      key_objects: [{ korean: '가방' }],
      pages: [],
    },
    // 영어 책: `korean` 이 한국어 번역이라 `||` 로 하나만 고르면 영어 낱말과 안 맞는다.
    {
      id: 'en-b1-u01',
      type: 'phonics',
      title: 'Aa',
      phonicsConfig: { targetWords: ['cat'] },
      key_objects: [{ korean: '고양이', nameEn: 'cat' }],
      pages: [],
    },
  ]);
  eq([st.seam.covered, st.seam.words], [3, 3], '집계 전체 covered');
  eq(st.seam.other, 1, '집계 전체 other');
  eq(st.books, 1, '동화책 수');
  eq(st.phonicsUnits, 2, '파닉스 단원 수');
  eq(st.graph.en.units[0].words[0].books.length, 1, '영어도 그래프에 이어진다');
  if (!st.graph.kr || st.graph.kr.books.length !== 2) throw new Error('그래프에 나무 동화가 빠졌다');
  console.log('selftest ok');
}

async function main() {
  console.log(`읽는 중: ${API}`);
  const list = await fetch(`${API}/api/storybooks`).then((r) => r.json());
  const items = list.data ?? list ?? [];
  console.log(`  목록 ${items.length}건 · 상세 받는 중(동시 ${CONC})…`);

  const full = await pool(items, CONC, async (it) => {
    try {
      const r = await fetch(`${API}/api/storybooks/${it.id}`);
      if (!r.ok) return null;
      const j = await r.json();
      return j.data ?? j;
    } catch {
      return null;
    }
  });

  const st = buildContentStatus(full.filter(Boolean));
  // 🔴 backup 폴더는 표에서 뺀다(사용자, 2026-09-04) — 옛 파일 67권이 라인처럼 보였다. 집계 json 은 그대로.
  const rows = st.rows.filter((r) => r.category !== 'backup').sort(
    (a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
  );

  const html = render(rows, {
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    api: API,
    books: st.books,
    phonics: st.phonicsUnits,
    pub: st.public,
    words: st.words,
    uniqWords: st.uniqueWords,
    multi: st.multiBookWordPct,
    categories: st.categories,
    levels: st.levels,
    seam: st.seam,
  });

  // 🔴 임시로 쓰고 옮긴다 — 중간에 죽으면 기존 파일을 비우게 된다.
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const write = (file, body) => {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, body, 'utf8');
    fs.renameSync(tmp, file);
  };
  write(OUT, html);

  // rows(책별 원본)는 빼고 낸다 — 화면이 안 쓰는데 파일만 커진다. 책 목록은 현황판 HTML 이 보여준다.
  const { rows: _drop, ...json } = st;
  write(OUT_JSON, `${JSON.stringify({ at: new Date().toISOString(), api: API, ...json }, null, 2)}\n`);

  console.log(`\n동화책 ${st.books} · 파닉스 ${st.phonicsUnits} · 공개 ${st.public}`);
  console.log(`유니크 낱말 ${st.uniqueWords} · 2권 이상 등장 ${st.multiBookWordPct}%`);
  console.log(
    `난이도 실측 ${['L1', 'L2', 'L3'].map((l) => `${l} ${st.levels.actual[l] ?? 0}`).join(' · ')}` +
      ` │ 선언없음 ${st.levels.missing} · 선언≠실측 ${st.levels.wrong}`
  );
  console.log(`이음매 예문있음 ${st.seam.covered}/${st.seam.words} = ${st.seam.coveredPct}%`);
  // 🔴 진도순은 트랙 **안에서만** 뜻이 있다 — 전체를 사전순으로 자르면 en 이 앞을 다 차지한다.
  for (const t of st.seam.byTrack) {
    console.log(
      `  ${t.track}: 예문 ${t.covered}/${t.words} = ${t.coveredPct}% · 다른 동화책 ${t.other} (${t.units}단원)`
    );
    const head = st.seam.units
      .filter((u) => u.track === t.track)
      .slice(0, 5)
      .map((u) => `${u.id.replace(`${t.track}-`, '')} ${u.covered}/${u.words}`)
      .join(' · ');
    if (head) console.log(`      앞 단원(예문): ${head}`);
  }
  console.log(`→ ${path.relative(process.cwd(), OUT)}`);
  console.log(`→ ${path.relative(process.cwd(), OUT_JSON)}`);
}

if (process.argv.includes('--selftest')) {
  selftest();
} else {
  main().catch((e) => {
    console.error(e?.message || e);
    process.exit(1);
  });
}
