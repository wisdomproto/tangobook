#!/usr/bin/env node
/**
 * 코드 안의 public 자산 png 참조 → webp 로 변경.
 *
 * 매칭: src/css 안 string literal 에서 public 자산 prefix 로 시작하는 .png path.
 *   `/images/.../foo.png`, `/icons/.../foo.png`, `/mascot/.../foo.png`,
 *   `/logo/.../foo.png`, `/strategy-samples/.../foo.png`,
 *   `category/foo.png`, `section/foo.png`, `tab/foo.png`, `game/foo.png`,
 *   `mode/foo.png`, `pitch.html/...` 등.
 *
 * 외부 URL (`https://example.com/foo.png`) 또는 MIME literal (`'image/png'`) 은 매치 X.
 *
 * 사용:
 *   node scripts/replace-png-refs-to-webp.mjs           # dry-run (변경 X)
 *   node scripts/replace-png-refs-to-webp.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const APPLY = process.argv.includes('--apply');

const SCAN_DIRS = [
  path.join(ROOT, 'packages', 'client', 'src'),
  path.join(ROOT, 'packages', 'client', 'public'), // strategy.html / pitch.html 등 정적 페이지
  path.join(ROOT, 'packages', 'server', 'src'),
  path.join(ROOT, 'packages', 'remotion', 'src'),
];

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next']);
const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.md']);

// public 자산으로 보이는 path 매치. 앞에 따옴표/공백/( 가 와야 외부 URL 과 구분.
// /images/, /icons/, /mascot/, /strategy-samples/, /logo/ + 또는 category/section/tab/game/mode 로 시작
// public 자산 path prefix + Phaser sprite sheet 디렉토리 (idle/run/hurt/...) + frame
const PNG_RE =
  /(['"`(\s])(\/?(?:images|icons|mascot|strategy-samples|logo|category|section|tab|game|mode|idle|run|hurt|celebrate|jump|frame|hori|sounds|fonts)\/[^'"`)\s]*?)\.png/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SCAN_EXTS.has(ext)) out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(d));
console.log(`Scan: ${files.length} files in ${SCAN_DIRS.length} dirs`);
console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}\n`);

let changedFiles = 0;
let totalReplacements = 0;

for (const file of files) {
  const orig = fs.readFileSync(file, 'utf-8');
  let count = 0;
  const next = orig.replace(PNG_RE, (m, prefix, body) => {
    count++;
    return `${prefix}${body}.webp`;
  });
  if (count === 0) continue;
  changedFiles++;
  totalReplacements += count;
  const rel = path.relative(ROOT, file);
  console.log(`  ${rel}: ${count}`);
  if (APPLY) fs.writeFileSync(file, next, 'utf-8');
}

console.log(`\n=== ${APPLY ? '적용' : 'DRY-RUN'} 결과 ===`);
console.log(`변경 파일: ${changedFiles}`);
console.log(`치환: ${totalReplacements}`);
if (!APPLY) console.log(`\n👀 실 적용은 \`--apply\` 플래그.`);
