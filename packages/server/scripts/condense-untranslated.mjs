#!/usr/bin/env node
/** untranslated-keyobjects.json 을 번역 작업용 간결 포맷으로 변환 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IN = path.join(__dirname, '_data', 'untranslated-keyobjects.json');
const OUT = path.join(__dirname, '_data', 'untranslated-condensed.json');

const data = JSON.parse(fs.readFileSync(IN, 'utf-8'));
const out = data.books.map((b) => ({
  id: b.id,
  title: b.title,
  category: b.category,
  words: b.missing.map((m) => ({
    ko: m.ko,
    // 가장 짧은 context 1개만 (단어 등장 sentence 추출)
    ctx: (() => {
      for (const t of m.pageTexts) {
        const sentences = t.split(/[.!?。!?\n]/);
        const hit = sentences.find((s) => s.includes(m.ko));
        if (hit) return hit.trim().slice(0, 120);
      }
      return (m.pageTexts[0] || '').slice(0, 120);
    })(),
  })),
}));

fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf-8');
console.log(`→ ${path.relative(process.cwd(), OUT)}  (${out.length} books)`);
