#!/usr/bin/env node
// 세계명작 중 vi 미번역(빈 t) 파일 목록 출력 (읽기전용).
import fs from 'node:fs';
import path from 'node:path';
import { listStorybookKeys, getStorybook, VARIANT_RE, langDir } from './translation-core.mjs';

const keys = await listStorybookKeys();
const classics = [];
let i = 0;
async function w() {
  while (i < keys.length) {
    const k = keys[i++];
    try {
      const sb = await getStorybook(k.replace(/^storybook-|\.json$/g, ''));
      if (!sb.id || VARIANT_RE.test(sb.id)) continue;
      if (sb.type === 'phonics') continue;
      if (sb.category !== '세계 명작') continue;
      classics.push({ id: String(sb.id), title: sb.title, isPublic: !!sb.isPublic });
    } catch {}
  }
}
await Promise.all(Array.from({ length: 12 }, w));

const dir = langDir('vi');
const todo = [];
const done = [];
for (const c of classics) {
  const p = path.join(dir, `${c.id}.json`);
  if (!fs.existsSync(p)) {
    todo.push({ ...c, note: 'no-file' });
    continue;
  }
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const filled = (j.titleT || '').trim() && (j.pages || []).every((pg) => (pg.t || '').trim());
  (filled ? done : todo).push(c);
}
console.log(`세계명작 ${classics.length}권 | vi 완료 ${done.length} | 미번역 ${todo.length}\n`);
console.log('── 미번역 목록 (id | 공개여부 | title) ──');
todo.sort((a, b) => (a.isPublic ? 1 : 0) - (b.isPublic ? 1 : 0) || a.title.localeCompare(b.title, 'ko'));
for (const t of todo) console.log(`${t.id}  ${t.isPublic ? '공개' : '비공개'}  ${t.title}`);
