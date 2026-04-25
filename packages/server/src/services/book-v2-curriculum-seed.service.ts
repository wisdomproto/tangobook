// curriculum-master.html에서 책별 메타(원제/저자/우선순위 등) 파싱 → BookManifest.curriculumMeta seed.
//
// 매칭 전략:
//   1. CLASSIC_RAW에 bid 명시 → 직접 매칭
//   2. NATURE_RAW / FOLKTALE_RAW / LIFE_RAW → title 정확 일치 매칭
//   3. 매칭 안 되는 책은 skip (저작도구에서 수동 입력)

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getManifest, putManifest } from '../repositories/book-v2.repository.js';
import { listR2Objects, downloadFromR2 } from '../providers/r2.provider.js';
import type { CurriculumMeta, ReadingLevel, BookManifest } from '@tangobook/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
// packages/server/src/services/ → monorepo root (4단계 위)
const HTML_PATH = resolve(__dirname, '../../../../docs/books/curriculum-master.html');

interface ParsedEntry {
  bid?: string;
  no?: number;
  t: string;
  o?: string;
  a?: string;
  c?: string;
  y?: string;
  src?: string;
  prio?: 1 | 2 | 3;
  launch?: ReadingLevel;
  category: 'classic' | 'nature' | 'folktale' | 'life';
  subCategory?: string;
}

/** HTML 안의 JavaScript const 선언을 추출해서 실제 값으로 evaluate. 보안: self-owned file만 사용. */
function evalConstDeclaration<T>(html: string, name: string): T | null {
  const declStart = html.indexOf(`const ${name}`);
  if (declStart < 0) return null;
  const eqIdx = html.indexOf('=', declStart);
  if (eqIdx < 0) return null;

  // 매칭 ; 찾기 (괄호/문자열 깊이 추적)
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let semicolonIdx = -1;
  for (let i = eqIdx + 1; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (c === stringChar && html[i - 1] !== '\\') inString = false;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      inString = true;
      stringChar = c;
    } else if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    else if (c === ';' && depth === 0) {
      semicolonIdx = i;
      break;
    }
  }
  if (semicolonIdx < 0) return null;

  const body = html.slice(eqIdx + 1, semicolonIdx).trim();
  try {
    // self-owned file 의 const 값을 그대로 평가. spread/map 등 호출 못하니 array/object literal만 파싱.
    // map/spread가 있는 NATURE_RAW를 위해 일부 시뮬레이션:
    // ['사자','호랑이',...].map(t=>({t, sub:'포유류', lv:[...], ...}))
    // 이건 Function 평가로 동작.

    const fn = new Function(`return ${body};`);
    return fn() as T;
  } catch (e) {
    console.warn(`[curriculum-seed] eval failed for ${name}:`, (e as Error).message);
    return null;
  }
}

interface RawClassicEntry {
  no?: number;
  t: string;
  o?: string;
  a?: string;
  c?: string;
  y?: string;
  src?: string;
  launch?: string;
  prio?: number;
  bid?: string;
}
interface RawSimpleEntry {
  t: string;
  sub?: string;
  launch?: string;
  prio?: number;
}

function parseClassicRaw(html: string): ParsedEntry[] {
  const arr = evalConstDeclaration<RawClassicEntry[]>(html, 'CLASSIC_RAW');
  if (!Array.isArray(arr)) return [];
  return arr
    .map((e) => ({
      no: e.no,
      t: e.t,
      o: e.o,
      a: e.a,
      c: e.c,
      y: e.y,
      src: e.src,
      launch: e.launch as ReadingLevel | undefined,
      prio: e.prio as 1 | 2 | 3 | undefined,
      bid: e.bid,
      category: 'classic' as const,
    }))
    .filter((e) => e.t);
}

function parseNatureRaw(html: string): ParsedEntry[] {
  const obj = evalConstDeclaration<Record<string, RawSimpleEntry[]>>(html, 'NATURE_RAW');
  if (!obj || typeof obj !== 'object') return [];
  const out: ParsedEntry[] = [];
  for (const [, arr] of Object.entries(obj)) {
    if (!Array.isArray(arr)) continue;
    for (const e of arr) {
      if (!e?.t) continue;
      out.push({
        t: e.t,
        subCategory: e.sub,
        launch: e.launch as ReadingLevel | undefined,
        prio: e.prio as 1 | 2 | 3 | undefined,
        category: 'nature',
      });
    }
  }
  return out;
}

function parseSimpleArray(
  html: string,
  name: string,
  category: ParsedEntry['category']
): ParsedEntry[] {
  const arr = evalConstDeclaration<RawSimpleEntry[]>(html, name);
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((e): e is RawSimpleEntry => !!e?.t)
    .map((e) => ({
      t: e.t,
      subCategory: e.sub,
      launch: e.launch as ReadingLevel | undefined,
      prio: e.prio as 1 | 2 | 3 | undefined,
      category,
    }));
}

export async function loadCurriculumEntries(): Promise<ParsedEntry[]> {
  const html = await readFile(HTML_PATH, 'utf-8');
  return [
    ...parseClassicRaw(html),
    ...parseNatureRaw(html),
    ...parseSimpleArray(html, 'FOLKTALE_RAW', 'folktale'),
    ...parseSimpleArray(html, 'LIFE_RAW', 'life'),
  ];
}

function entryToMeta(e: ParsedEntry): CurriculumMeta {
  const meta: CurriculumMeta = {};
  if (e.no != null) meta.no = e.no;
  if (e.o) meta.originalTitle = e.o;
  if (e.a) meta.author = e.a;
  if (e.c) meta.country = e.c;
  if (e.y) meta.year = e.y;
  if (e.src) meta.source = e.src;
  if (e.prio) meta.priority = e.prio;
  if (e.launch) meta.launchLevel = e.launch;
  return meta;
}

interface ManifestSummary {
  bid: string;
  title: string;
}

async function loadAllManifestSummaries(): Promise<ManifestSummary[]> {
  const objects = await listR2Objects('books/');
  const manifestKeys = objects.map((o) => o.Key!).filter((k) => k?.endsWith('/manifest.json'));
  const out: ManifestSummary[] = [];
  const concurrency = 30;
  for (let i = 0; i < manifestKeys.length; i += concurrency) {
    const batch = manifestKeys.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (k) => {
        try {
          const buf = await downloadFromR2(k);
          const m = JSON.parse(buf.toString('utf-8')) as BookManifest;
          out.push({ bid: m.id, title: m.title });
        } catch {
          /* skip */
        }
      })
    );
  }
  return out;
}

export interface SeedResult {
  totalEntries: number;
  matchedByBid: number;
  matchedByTitle: number;
  unmatched: { source: ParsedEntry['category']; title: string }[];
  updated: number;
  failed: number;
}

export async function seedCurriculumMeta(options: { dryRun?: boolean } = {}): Promise<SeedResult> {
  const entries = await loadCurriculumEntries();
  const summaries = await loadAllManifestSummaries();
  const titleToBid = new Map<string, string>();
  for (const s of summaries) titleToBid.set(s.title, s.bid);

  const result: SeedResult = {
    totalEntries: entries.length,
    matchedByBid: 0,
    matchedByTitle: 0,
    unmatched: [],
    updated: 0,
    failed: 0,
  };

  for (const e of entries) {
    let bid = e.bid;
    if (bid) {
      result.matchedByBid++;
    } else {
      const found = titleToBid.get(e.t);
      if (found) {
        bid = found;
        result.matchedByTitle++;
      } else {
        result.unmatched.push({ source: e.category, title: e.t });
        continue;
      }
    }

    if (options.dryRun) continue;

    try {
      const manifest = await getManifest(bid);
      if (!manifest) {
        result.failed++;
        continue;
      }
      const next: BookManifest = { ...manifest, curriculumMeta: entryToMeta(e) };
      await putManifest(bid, next);
      result.updated++;
    } catch {
      result.failed++;
    }
  }

  return result;
}
