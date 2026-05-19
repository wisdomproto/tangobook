#!/usr/bin/env node
/** batch-50-auto + batch-50-manual-translations 머지 후 apply-translations 호출 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTO = path.join(__dirname, '_data', 'batch-50-auto.json');
const MANUAL = path.join(__dirname, '_data', 'batch-50-manual-translations.json');
const OUT = path.join(__dirname, '_data', 'batch-50-merged.json');

const auto = JSON.parse(fs.readFileSync(AUTO, 'utf-8'));
const manual = JSON.parse(fs.readFileSync(MANUAL, 'utf-8'));

const merged = {};
const ids = new Set([...Object.keys(auto), ...Object.keys(manual)]);
for (const id of ids) {
  const a = auto[id];
  const m = manual[id];
  merged[id] = {
    title: a?.title || m?.title || '?',
    tr: { ...(a?.tr || {}), ...(m?.tr || {}) },
  };
}

fs.writeFileSync(OUT, JSON.stringify(merged, null, 2), 'utf-8');
const totalWords = Object.values(merged).reduce((s, b) => s + Object.keys(b.tr).length, 0);
console.log(`머지: ${Object.keys(merged).length} 책 / ${totalWords} 단어 → ${path.relative(process.cwd(), OUT)}`);

console.log('\napply 호출...');
const r = spawnSync('node', [path.join(__dirname, 'apply-translations.mjs'), OUT], {
  stdio: 'inherit',
});
process.exit(r.status || 0);
