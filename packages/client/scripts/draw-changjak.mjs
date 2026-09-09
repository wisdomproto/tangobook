// 창작동화 삽화 배치 러너 — GPT 로 굽고, 사람이 본 뒤 R2 에 올린다.
//
// 🔴 진행 상태를 따로 안 적는다 — **R2 가 곧 진행 상태**다(`GET /api/comic-assets/series/<key>`).
//    별도 상태 파일은 중단·재시작·다른 기계에서 갈라진다. 이미 있는 쪽은 건너뛰므로 몇 번을 다시
//    돌려도 안전하고, 한도에 걸려 멈춰도 다음 실행이 그 자리에서 이어간다.
// 🔴 레퍼런스는 새 캐릭터 시트가 아니라 **그 시리즈에 이미 그려진 삽화**다 — 2,721쪽이 이미 있고,
//    그것이 그 시리즈의 실제 룩이라 시트보다 정확하다(시트는 pongi 에만 있다).
// 🔴 프롬프트는 손으로 안 쓴다: 앵커의 STYLE ANCHOR 블록 + 그 쪽 SCENE + 인물 수 못박기.
//    인물 수는 SCENE 인물 칸의 캐스트 토큰에서 센다 — 시트를 물리면 시트에 있는 인물이 다 나오는
//    함정을 pongi 26 에서 실측했다(안 나와야 할 동생·엄마가 들어왔다).
//
//   node packages/client/scripts/draw-changjak.mjs --status            # 전 시리즈 현황
//   node packages/client/scripts/draw-changjak.mjs pipo --only=01      # 한 권
//   node packages/client/scripts/draw-changjak.mjs pipo --limit=3      # 안 그려진 권부터 3권
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SERIES } from './_series-config.mjs';
import { parseBooks } from './_series-parse.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const API = 'https://www.tangobook.co.kr';
const OUT = process.env.DRAW_OUT ?? path.join(ROOT, '.draw');
const GEN = path.join(process.env.USERPROFILE ?? process.env.HOME, '.claude', 'skills', 'image-gen', 'scripts', 'gen.mjs');

const args = process.argv.slice(2);
const key = args.find((a) => SERIES[a]);
const only = args.find((a) => a.startsWith('--only='))?.slice(7);
const limit = Number(args.find((a) => a.startsWith('--limit='))?.slice(8) ?? 1);

const volsOf = (k) => (SERIES[k].no <= '15' ? 50 : 25);
const drawn = async (k) => (await fetch(`${API}/api/comic-assets/series/${k}`).then((r) => r.json())).data ?? {};

if (args.includes('--status')) {
  let done = 0, all = 0;
  for (const [k, cfg] of Object.entries(SERIES).sort((a, b) => a[1].no.localeCompare(b[1].no))) {
    const c = await drawn(k); const n = volsOf(k);
    let full = 0, pg = 0;
    for (let i = 1; i <= n; i++) { const v = c[`${k}-${String(i).padStart(2, '0')}`] ?? 0; pg += v; if (v >= 10) full++; }
    done += pg; all += n * 10;
    console.log(`${cfg.no} ${k.padEnd(9)} ${String(full).padStart(2)}/${n}권 · ${pg}쪽`);
  }
  console.log(`\n${done}/${all}쪽 (${Math.round((done / all) * 100)}%) · 남은 ${all - done}쪽`);
  process.exit(0);
}
if (!key) { console.log('시리즈 키가 필요하다. --status 로 현황.'); process.exit(1); }

/** 앵커의 STYLE ANCHOR 블록 — 화가에게 나가는 그 글 그대로. */
const anchor = (() => {
  const t = fs.readFileSync(path.join(ROOT, 'docs', 'art-direction', `${key}-anchor.md`), 'utf8');
  const m = t.match(/```\r?\n(STYLE ANCHOR[\s\S]*?)\r?\n```/);
  if (!m) throw new Error(`${key}: STYLE ANCHOR 블록을 못 찾았다`);
  return m[1];
})();

/** 그 시리즈에 이미 그려진 삽화 하나 — 룩과 인물을 물려받는 레퍼런스. */
async function refFor(k, skipVol) {
  const c = await drawn(k);
  const done = Object.entries(c).filter(([id, n]) => n >= 10 && !id.endsWith(`-${skipVol}`)).map(([id]) => id);
  if (!done.length) return null;
  const pick = done[Math.floor(done.length / 2)];          // 가운데 권 — 첫 권은 초기 실험본일 수 있다
  const url = `https://assets.tangobook.co.kr/comic-assets/${pick}/p10.webp`;   // p10 = 인물이 가장 확실한 쪽
  const f = path.join(OUT, `_ref-${k}.png`);
  const r = await fetch(url);
  if (!r.ok) return null;
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  console.log(`  레퍼런스 ← ${pick} p10`);
  return f;
}

/** SCENE 인물 칸의 캐스트 토큰으로 그 쪽에 있는 인물을 센다. */
const CAST = /\b([A-Z][a-z]+(?: [a-z]+){0,2})\b/g;
function castOf(scene) {
  const m = /<b>인물<\/b>([\s\S]*?)(?:<br\s*\/?>\s*<b>|$)/.exec(scene);
  if (!m) return [];
  return [...new Set((m[1].match(CAST) ?? []).filter((s) => !/^(그|이|저)/.test(s)))];
}

const books = parseBooks(path.join(ROOT, 'docs', 'changjak-books', key));
const scenes = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'changjak-books', key, '_scenes.json'), 'utf8'));
const counts = await drawn(key);

const todo = [];
for (let i = 1; i <= volsOf(key); i++) {
  const v = String(i).padStart(2, '0');
  if (only && v !== only) continue;
  const have = counts[`${key}-${v}`] ?? 0;
  if (have >= 10) continue;
  todo.push({ v, have });
  if (!only && todo.length >= limit) break;
}
if (!todo.length) { console.log(`${key}: 그릴 권이 없다(전부 완료).`); process.exit(0); }

fs.mkdirSync(OUT, { recursive: true });
const ref = await refFor(key, todo[0].v);

for (const { v, have } of todo) {
  const book = books.get(v);
  const dir = path.join(OUT, `${key}-${v}`);
  fs.mkdirSync(dir, { recursive: true });
  console.log(`\n=== ${key} ${v}. ${book.title} (R2 에 ${have}/10) ===`);

  for (const pg of book.pages) {
    const out = path.join(dir, `p${pg.n}.png`);
    if (fs.existsSync(out)) { console.log(`  p${pg.n} 로컬에 있음`); continue; }
    const scene = (scenes[v]?.[`p${pg.n}`] ?? '').replace(/<br\s*\/?>/g, '\n').replace(/<\/?b>/g, '');
    if (!scene) { console.log(`  p${pg.n} 🔴 SCENE 없음 — 건너뜀`); continue; }
    const who = castOf(scenes[v][`p${pg.n}`]);
    const prompt = [
      anchor,
      '',
      `ON THIS PAGE THERE ARE EXACTLY ${who.length} FIGURE(S): ${who.join(', ') || 'none'}.`,
      'Nobody else appears - not characters from the reference image, not anyone the anchor names.',
      'Draw only the props the SCENE below asks for; an empty surface stays empty.',
      // 🔴 무대 이름만 보고 모델이 없는 지형을 붙인다 — pipo 는 아일랜드 목장이라 바다·먼 섬이 두 번 들어왔다.
      //    금지어보다 「그 자리에 무엇이 있는지」를 말하는 편이 먹는다(숨은그림 프롬프트에서 배운 것).
      'Add no landscape the SCENE does not name. The horizon is more of the same place the SCENE is in.',
      // 🔴 줄·행렬은 누가 앞인지가 곧 그 쪽의 뜻이다 — pipo 01 p9 는 앞장선 아이가 줄 맨 뒤로 갔다.
      'If the SCENE says a figure leads a line, that figure is at the FRONT, ahead of everyone following.',
      'The open mouth of whoever speaks on this page is inside the frame.',
      '',
      'SCENE (Korean, follow it exactly):',
      scene,
    ].join('\n');
    const args2 = ['gpt', '--out', out, '--prompt', prompt];
    if (ref) args2.push('--ref', ref);
    try {
      execFileSync('node', [GEN, ...args2], { stdio: 'pipe', timeout: 300000 });
      console.log(fs.existsSync(out) ? `  p${pg.n} ✅ ${who.length}인` : `  p${pg.n} ❌ 파일 없음`);
    } catch (e) {
      const msg = String(e.stdout ?? e.message).slice(-160);
      console.log(`  p${pg.n} ❌ ${msg}`);
      if (/usage limit|한도/i.test(msg)) { console.log('\n🔴 한도 — 여기서 멈춘다. 다시 돌리면 이 자리에서 이어간다.'); process.exit(2); }
    }
  }
}
console.log(`\n로컬 산출물: ${OUT}`);
console.log('🔴 사람이 본 뒤 올린다 — upload-changjak.mjs');
