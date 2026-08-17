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

/** `-stages.md` §4/§5 견본 표의 축 칸 이름. 없으면 '상태'. */
function axisLabel(key) {
  const f = path.join(ART, `${key}-stages.md`);
  if (!fs.existsSync(f)) return '상태';
  const m = fs.readFileSync(f, 'utf8').match(/^\| 쪽 \| [^|]+\| [^|]+\| ([^|]+)\|/m);
  return m ? m[1].replace(/🔴/g, '').trim() : '상태';
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
      `> 채우는 칸은 **SPOT** 과 **${axis}** 와 **이어짐** 셋이다. 시트 = \`${key}-stages.md\`.`,
      '',
      '---',
      '',
    ];
    for (const [id, bk] of [...books].sort((a, b) => a[0].localeCompare(b[0]))) {
      const pages = Object.entries(scenes[id] ?? {});
      out.push(`## ${id} 「${bk.title}」`, '');
      out.push(`| 쪽 | 자리 | SPOT | 🔴 ${axis} | 이어짐 |`, '|---|---|---|---|---|');
      for (const r of routeOf(pages)) {
        out.push(`| ${r.pg} | ${r.place ? '`' + r.place + '`' : '🔴 ?'}${r.inherited ? ' ↑' : ''} |  |  |  |`);
      }
      out.push('');
    }
    const f = path.join(ART, `${key}-routes.md`);
    fs.writeFileSync(f, out.join('\n'));
    console.log(`${key.padEnd(9)} ${books.size}권 · ${path.basename(f)}`);
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
