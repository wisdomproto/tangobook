// 창작동화 시리즈 **권별 경로표** — 뼈대 생성 + 검사.
//
// 경로표는 「열 장이 같은 골목이 되게」 하는 표다. 자리 시트가 *무엇을* 그릴지 정했다면,
// 경로표는 그 시트의 *어디서* 찍고 그 권의 축이 그 쪽에서 *어디쯤*인지를 정한다.
//
// 🔴 **자리 칸은 사람이 타이핑하지 않는다.** SCENE 에 붙은 무대 토큰에서 생성한다 —
//    같은 사실을 두 곳에 손으로 적어 두면 갈라진다는 걸 이 라인에서 이미 겪었다
//    (§3 의 「쪽 목록」과 변환표가 그렇게 어긋났고, 지우는 걸로 끝냈다).
//    그래서 뼈대가 자리를 채워 주고, `--check` 가 그 칸이 토큰과 여전히 같은지 다시 본다.
//
// 🔴 **되짚는 쪽**(「같은 자리, 바로 뒤」)은 토큰이 없다. 앞의 이름 붙은 쪽을 물려받는다 —
//    사람이 읽을 때 하는 그대로다. 표에는 `↑` 로 표시해서, 물려받은 것과 SCENE 이 직접
//    말한 것을 구별할 수 있게 둔다(물려받은 자리가 틀렸으면 고칠 곳은 SCENE 이다).
//
// 사용:
//   node packages/client/scripts/build-series-routes.mjs --skeleton nono   # 뼈대 쓰기
//   node packages/client/scripts/build-series-routes.mjs --skeleton        # 전 시리즈
//   node packages/client/scripts/build-series-routes.mjs --check           # 검사 (빈칸·자리 불일치)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBooks, loadScenes } from './_series-parse.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(__dirname, '..', '..', '..', 'docs', 'changjak-books');
const ART = path.join(__dirname, '..', '..', '..', 'docs', 'art-direction');

const SERIES = fs.readdirSync(DOCS).filter((d) => fs.existsSync(path.join(DOCS, d, '_scenes.json')));
const only = process.argv.slice(2).filter((a) => SERIES.includes(a));
const TARGETS = only.length ? only : SERIES;

/** SCENE 한 쪽에서 무대 토큰을 꺼낸다 — `[Alley]` · `[Terraces/B · 칸 1]` → 'Alley' · 'Terraces/B · 칸 1' */
const tokenOf = (t) => String(t).match(/<b>장소·시간<\/b>\s*\[([^\]]+)\]/)?.[1]?.trim() ?? null;

/** 권 하나의 쪽별 자리 — 토큰이 없으면 앞의 이름 붙은 쪽을 물려받는다. */
export function routeOf(pages) {
  const out = [];
  let last = null;
  for (const [pg, t] of pages) {
    const tok = tokenOf(t);
    if (tok) last = tok;
    out.push({ pg, place: tok ?? last, inherited: !tok });
  }
  return out;
}

/** 견본 표의 축 칸 이름 — 뼈대 안내문에만 쓴다. 없으면 '상태'.
 *  🔴 견본은 `-stages.md` 에서 `-routes.md` 로 옮겨 갔으므로 둘 다 본다(옮긴 뒤 stages 에선 안 나온다). */
function axisLabel(key) {
  for (const f of [`${key}-routes.md`, `${key}-stages.md`].map((n) => path.join(ART, n))) {
    if (!fs.existsSync(f)) continue;
    const m = fs.readFileSync(f, 'utf8').match(/^\| 쪽 \| [^|]+\| [^|]+\| (?!\?)([^|]+)\|/m);
    if (m) return m[1].replace(/🔴/g, '').trim();
  }
  return '상태';
}

if (process.argv.includes('--selftest')) {
  const ok = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } console.log('✓ ' + m); };
  const P = (o) => Object.entries(o);
  const r = routeOf(P({
    p1: '<b>장소·시간</b> [Alley] 골목.',
    p2: '<b>장소·시간</b> 같은 자리, 바로 뒤.',
    p3: '<b>장소·시간</b> [Shop] 가게 안.',
  }));
  ok(r[1].place === 'Alley' && r[1].inherited, '🔴 되짚는 쪽은 앞 쪽의 자리를 물려받고, 물려받았다고 표시한다');
  ok(r[2].place === 'Shop' && !r[2].inherited, '이름이 나오면 거기서 자리가 바뀐다');
  const head = routeOf(P({ p1: '<b>장소·시간</b> 같은 자리.' }));
  ok(head[0].place === null, '첫 쪽이 되짚기면 물려받을 것이 없다 — 빈칸으로 두고 신고한다');
  console.log('\n셀프테스트 통과');
  process.exit(0);
}

// ── 뼈대 쓰기 ────────────────────────────────────────────────────────────────
if (process.argv.includes('--skeleton')) {
  for (const key of TARGETS) {
    const books = parseBooks(path.join(DOCS, key));
    const scenes = loadScenes(path.join(DOCS, key));
    const axis = axisLabel(key);
    const out = [
      `# ${key} — 권별 경로표 (25권)`,
      '',
      `> 🔴 **자리 칸은 생성된 것이다.** \`node packages/client/scripts/build-series-routes.mjs --skeleton ${key}\``,
      '> 가 SCENE 의 무대 토큰에서 뽑아 쓴다 — 손으로 고치지 마라. 자리가 틀렸으면 고칠 곳은 SCENE 이다.',
      `> \`↑\` = 그 쪽 SCENE 이 「같은 자리」라고만 해서 **앞 쪽에서 물려받은** 자리.`,
      '>',
      `> 채우는 칸은 **SPOT** 과 **그 권의 계기** 와 **이어짐** 셋이다. 시트 = \`${key}-stages.md\`.`,
      '>',
      `> 🔴 **넷째 칸 이름은 권마다 다르다** — 그 권에서 열 쪽에 걸쳐 움직이는 것 하나다(${key} 견본은`,
      `> 「${axis}」였다). 표 머리의 \`?\` 를 그 권의 것으로 바꿔 쓴다. 한 권 = 계기 하나다.`,
      '',
      '---',
      '',
    ];
    for (const [id, bk] of [...books].sort((a, b) => a[0].localeCompare(b[0]))) {
      const pages = Object.entries(scenes[id] ?? {});
      out.push(`## ${id} 「${bk.title}」`, '');
      out.push('| 쪽 | 자리 | SPOT | 🔴 ? | 이어짐 |', '|---|---|---|---|---|');
      for (const r of routeOf(pages)) {
        out.push(`| ${r.pg} | ${r.place ? '`' + r.place + '`' : '🔴 ?'}${r.inherited ? ' ↑' : ''} |  |  |  |`);
      }
      out.push('');
    }
    const f = path.join(ART, `${key}-routes.md`);
    // 🔴 채워진 표를 뼈대로 되돌리지 않는다. 자동화가 **옳은 것을 지우는** 것이 이 파이프라인에서
    //    가장 나쁜 실패다(무대 토큰 때 이미 한 번 겪었다). 되굽고 싶으면 `--force` 를 명시한다.
    if (fs.existsSync(f) && /^\| p\d+ \|[^|]*\|\s*\S/m.test(fs.readFileSync(f, 'utf8')) && !process.argv.includes('--force')) {
      // 🔴 **없는 권만 이어 붙인다**(2026-09-04). 예전엔 파일 단위로 건너뛰어서, 25권 시절에 만든
      //    표가 채워져 있으면 **26~50권 250쪽이 영영 안 생겼다**(15 시리즈 전부 그 상태였다).
      //    채운 칸은 여전히 한 글자도 안 덮는다 — 이미 `## NN` 이 있는 권은 통째로 건너뛴다.
      if (process.argv.includes('--append')) {
        const md = fs.readFileSync(f, 'utf8');
        const have = new Set([...md.matchAll(/^## (\d+)[ 「]/gm)].map((m) => m[1]));
        const add = [];
        for (const [id, bk] of [...books].sort((a, b) => a[0].localeCompare(b[0]))) {
          if (have.has(id)) continue;
          const pages = Object.entries(scenes[id] ?? {});
          add.push(`## ${id} 「${bk.title}」`, '');
          add.push('| 쪽 | 자리 | SPOT | 🔴 ? | 이어짐 |', '|---|---|---|---|---|');
          for (const r of routeOf(pages))
            add.push(`| ${r.pg} | ${r.place ? '`' + r.place + '`' : '🔴 ?'}${r.inherited ? ' ↑' : ''} |  |  |  |`);
          add.push('');
        }
        if (!add.length) { console.log(`${key.padEnd(9)} ⏭  빠진 권 없음`); continue; }
        // 제목의 권수도 실제로 맞춘다 — 「(25권)」이 50권짜리 표에 남아 있었다
        const fixed = md.replace(/^(# \S+ — 권별 경로표) \(\d+권\)/m, `$1 (${books.size}권)`);
        fs.writeFileSync(f, [fixed.replace(/\s*$/, ''), '', ...add].join('\n'));
        console.log(`${key.padEnd(9)} ＋${add.filter((l) => l.startsWith('## ')).length}권 이어 붙임`);
        continue;
      }
      console.log(`${key.padEnd(9)} ⏭  이미 채워져 있다 — 건너뜀 (되굽으려면 --force · 없는 권만 --append)`);
      continue;
    }
    fs.writeFileSync(f, out.join('\n'));
    console.log(`${key.padEnd(9)} ${books.size}권 · ${path.basename(f)}`);
  }
  process.exit(0);
}

// ── 되짚는 쪽 판정 후보 ──────────────────────────────────────────────────────
// 🔴 되짚는 쪽(「같은 …」)에는 토큰을 안 붙인다 — 규칙에 태우면 타로 18권 「같은 나무 밑」이 `나무` 에
//    걸려 `WellTree` 가 되는데 그 권 나무는 `ForkTree` 다. 그래서 **앞 쪽에서 물려받는다.**
//    그런데 물려받기는 **바로 앞 한 쪽만** 본다. 앞 쪽이 잠깐 다른 데를 들렀다 오면
//    (유키 01 은 p6 이 방 안이고 p7 이 「같은 마당」이다) 그 뒤로 줄줄이 방이 된다.
// 🔴 **이건 답이 아니라 후보다.** 규칙이 이겼다고 규칙이 맞는 게 아니다 — 브루노 01 「같은 나무 밑동」은
//    그 그루터기가 오두막 앞에 있어서 **물려받기가 맞다**(= 위의 타로 함정과 같은 것). 권을 읽어야 안다.
if (process.argv.includes('--backref')) {
  const MAP = JSON.parse(fs.readFileSync(path.join(ART, '_stage-tokens.json'), 'utf8'));
  const resolve = (s, b, n) => s.byBook?.[b]?.[n] ?? s.exceptions?.[n]
    ?? s.rules.find(([p]) => n.includes(p))?.[1] ?? null;
  let tot = 0;
  for (const key of TARGETS) {
    const scenes = loadScenes(path.join(DOCS, key));
    const rows = [];
    for (const [b, pages] of Object.entries(scenes)) {
      let last = null;
      for (const [pg, t] of Object.entries(pages)) {
        const raw = String(t).match(/<b>장소·시간<\/b>\s*([^<]*)/)?.[1]?.trim(); if (!raw) continue;
        const tok = raw.match(/^\[([^\]]+)\]/)?.[1]; if (tok) { last = tok; continue; }
        const name = raw.split(',')[0].replace(/\.$/, '').trim();
        const bare = name.replace(/^(같은|그|저|바로)\s+/, ''); if (bare === name) continue;
        const want = resolve(MAP[key], b, bare);
        if (want && want !== last) rows.push(`| ${b} ${pg} | 「${name}」 | \`${last}\` | \`${want}\` |  |`);
      }
    }
    if (!rows.length) continue;
    tot += rows.length;
    console.log(`\n## ${key} (${rows.length}쪽)\n`);
    console.log('| 권·쪽 | SCENE | 물려받음 | 이름이 가리키는 곳 | 판정 |');
    console.log('|---|---|---|---|---|');
    for (const r of rows) console.log(r);
  }
  console.log(`\n합계 ${tot}쪽 — 🔴 고칠 곳은 표가 아니라 **SCENE 의 토큰**이다.`);
  console.log('   고친 뒤 `--resync <시리즈> --apply` 로 경로표 자리 칸만 따라가게 한다.');
  process.exit(0);
}

// ── 자리 칸만 다시 맞추기 ────────────────────────────────────────────────────
// 🔴 무대 토큰을 고치면 표의 자리 칸이 낡는다. 그렇다고 `--skeleton` 을 다시 돌리면 채운 750칸이
//    같이 날아간다 — 그래서 **자리 칸 한 칸만** 갈아 끼운다. 나머지 세 칸은 한 글자도 안 건드린다.
//    (이게 없으면 「토큰이 틀렸다」는 신고를 받고도 고칠 방법이 없어서 표가 SSOT 를 이긴다.)
if (process.argv.includes('--resync')) {
  const apply = process.argv.includes('--apply');
  for (const key of TARGETS) {
    const f = path.join(ART, `${key}-routes.md`);
    if (!fs.existsSync(f)) continue;
    const scenes = loadScenes(path.join(DOCS, key));
    const want = new Map();
    for (const [b, pages] of Object.entries(scenes)) for (const r of routeOf(Object.entries(pages))) want.set(`${b} ${r.pg}`, r);
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    let book = null; const changed = [];
    for (let i = 0; i < lines.length; i++) {
      const bm = lines[i].match(/^## (\d+) 「/); if (bm) { book = bm[1]; continue; }
      const m = lines[i].match(/^\| (p\d+) \| ([^|]*)\|(.*)$/); if (!m || !book) continue;
      const r = want.get(`${book} ${m[1]}`); if (!r) continue;
      const cell = `${r.place ? '`' + r.place + '`' : '🔴 ?'}${r.inherited ? ' ↑' : ''}`;
      if (m[2].trim() === cell) continue;
      changed.push(`${book} ${m[1]}  ${m[2].trim()} → ${cell}`);
      lines[i] = `| ${m[1]} | ${cell} |${m[3]}`;
    }
    if (apply && changed.length) fs.writeFileSync(f, lines.join('\n'));
    console.log(`${key.padEnd(9)} 자리 갱신 ${changed.length}${apply ? '' : ' (dry-run · --apply)'}`);
    for (const c of changed.slice(0, 12)) console.log(`   ${c}`);
  }
  process.exit(0);
}

// ── 검사 ─────────────────────────────────────────────────────────────────────
let bad = 0;
for (const key of TARGETS) {
  const f = path.join(ART, `${key}-routes.md`);
  if (!fs.existsSync(f)) { console.log(`${key.padEnd(9)} 🔴 경로표 없음`); bad++; continue; }
  const md = fs.readFileSync(f, 'utf8');
  const scenes = loadScenes(path.join(DOCS, key));
  const rows = new Map();                                    // '01 p1' → [자리, SPOT, 축, 이어짐]
  let book = null;
  for (const line of md.split('\n')) {
    const bm = line.match(/^## (\d+) 「/); if (bm) { book = bm[1]; continue; }
    const cells = line.match(/^\| (p\d+) \|(.*)\|\s*$/);
    if (!cells || !book) continue;
    rows.set(`${book} ${cells[1]}`, cells[2].split('|').map((c) => c.trim()));
  }
  const want = [];
  for (const [b, pages] of Object.entries(scenes)) for (const r of routeOf(Object.entries(pages))) want.push([`${b} ${r.pg}`, r.place]);

  const missing = want.filter(([k]) => !rows.has(k)).map(([k]) => k);
  // 🔴 자리 칸이 토큰과 갈라졌는가 — 이 검사가 이 스크립트의 존재 이유다.
  const drift = want.filter(([k, place]) => rows.has(k) && place &&
    rows.get(k)[0].replace(/[`↑]/g, '').trim() !== place)
    .map(([k, place]) => `${k} 표:${rows.get(k)[0]} ≠ 토큰:${place}`);
  const blank = [...rows].filter(([, c]) => c.slice(1, 4).some((x) => !x)).map(([k]) => k);

  console.log(`${key.padEnd(9)} 쪽 ${String(want.length).padStart(4)} · 빠짐 ${missing.length} · 자리 어긋남 ${drift.length} · 빈칸 ${blank.length}` +
    (missing.length ? `  🔴 ${missing.slice(0, 5).join(' / ')}` : '') +
    (blank.length ? `  ⬜ ${blank.slice(0, 5).join(' / ')}${blank.length > 5 ? ' …' : ''}` : ''));
  for (const d of drift.slice(0, 5)) console.log(`   🔴 ${d}`);
  bad += missing.length + drift.length + blank.length;
}
console.log(bad ? `\n🔴 ${bad}건 남았다` : '\n경로표 완비');
process.exit(bad ? 1 : 0);
