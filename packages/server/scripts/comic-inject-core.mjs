/*
 * comic-inject-core.mjs — 회차 콘티 HTML 의 인라인 <script> 블록을
 *   window.EP_GUESTS / window.COSTUME_ZONES 정의 + learning-comic-core.js include 로 교체.
 * 사용: node comic-inject-core.mjs <docId> <dataJsonPath>
 *   dataJson = { "epGuests": [...], "costumeZones": [...] }
 * 실행 위치 무관(경로는 이 파일 기준으로 해석).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', '..', 'client', 'public');

const [docId, dataPath] = process.argv.slice(2);
if (!docId || !dataPath) {
  console.error('usage: node comic-inject-core.mjs <docId> <dataJsonPath>');
  process.exit(1);
}

const htmlPath = path.join(PUBLIC, `${docId}.html`);
const html = await fs.readFile(htmlPath, 'utf-8');
const data = JSON.parse(await fs.readFile(path.resolve(dataPath), 'utf-8'));

// 이미 이식됨?
if (html.includes('learning-comic-core.js')) {
  console.warn(`⏭  ${docId}: 이미 core.js 이식됨 — 건너뜀`);
  process.exit(0);
}

// 인라인 <script> 블록(탭 네비 주석으로 시작) → </script> 까지 교체.
const re = /<script>\s*\n\s*\/\/ ── 공용 탭 네비[\s\S]*?<\/script>/;
if (!re.test(html)) {
  console.error(`✗ ${docId}: 인라인 스크립트 블록을 찾지 못함(패턴 불일치)`);
  process.exit(1);
}

const replacement =
  '<script>\n' +
  'window.EP_GUESTS = ' + JSON.stringify(data.epGuests, null, 2) + ';\n' +
  'window.COSTUME_ZONES = ' + JSON.stringify(data.costumeZones, null, 2) + ';\n' +
  '</script>\n' +
  '<script src="/learning-comic-core.js"></script>';

const out = html.replace(re, replacement);
await fs.writeFile(htmlPath, out, 'utf-8');
console.log(`✓ ${docId}: core.js 이식 완료 (게스트 ${data.epGuests.length} · 의상구간 ${data.costumeZones.length})`);
