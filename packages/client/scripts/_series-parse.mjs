// 창작동화 시리즈 원고 파서 — 빌더(client)와 링커(server)가 **같은 것**을 쓴다.
// 🔴 사본을 만들지 마라. 이 라인에서 파서를 복사할 때마다 같은 버그가 따라갔다.
import fs from 'node:fs';
import path from 'node:path';

/**
 * 시리즈 원고를 읽는다.
 * 🔴 `m` 플래그 금지 — `$` 가 줄마다 걸려 쪽이 첫 문장에서 잘린다(시리즈 01 에서 실제로 겪었다).
 * @returns Map<'01', {id,title,meta,pages:[{n,ko}]}>
 */
export function parseBooks(srcDir) {
  const books = new Map();
  for (const f of ['01-03.md', '04-14.md', '15-25.md']) {
    const p = path.join(srcDir, f);
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    for (const m of s.matchAll(/^## (\d+)\. (.+)$/gm)) {
      const start = m.index;
      const nx = s.indexOf('\n## ', start + 1);
      const body = s.slice(start, nx < 0 ? s.length : nx);
      const meta = (body.match(/^\*\*(?:원함|주인공)\*\*.*$/m) || [''])[0];
      const pages = [...body.matchAll(/\*\*p(\d+)\*\*\n([\s\S]*?)(?=\n\*\*p\d+\*\*|\n---|$)/g)].map((pm) => ({
        n: +pm[1],
        ko: pm[2].trim().split('\n').map((l) => l.trim()).filter(Boolean).join(' '),
      }));
      books.set(m[1], { id: m[1], title: m[2].trim(), meta, pages });
    }
  }
  return books;
}

/** _scenes.json → {'01': {p1: '…'}} (없으면 빈 객체) */
export function loadScenes(srcDir) {
  const p = path.join(srcDir, '_scenes.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
}

/** SCENE 한 쪽을 평문으로 (HTML 태그 제거) — 앱에 넣을 때 쓴다. */
export function sceneToText(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?b>/gi, '')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}
