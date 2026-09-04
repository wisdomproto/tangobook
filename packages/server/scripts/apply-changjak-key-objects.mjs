// 창작동화 핵심단어 적용 — 추출본(JSON)을 읽어 R2 storybook.key_objects 에 넣는다.
//
//   node scripts/apply-changjak-key-objects.mjs --in=cj_objects_final.json --dry-run
//   node scripts/apply-changjak-key-objects.mjs --in=... --apply
//   node scripts/apply-changjak-key-objects.mjs --in=... --apply --series=yuki
//
// 🔴 멱등 — 이미 key_objects 가 있는 책은 건드리지 않는다(`--force` 로만 덮어씀).
// 🔴 dry-run 이 기본. 대상 수를 눈으로 확인하고 --apply 를 붙인다.
//    (전에 `--category` 가 조용히 무시돼 20권 대상이 89권으로 잡힌 적이 있다.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => {
  const hit = process.argv.find((a) => a === `--${k}` || a.startsWith(`--${k}=`));
  if (!hit) return d;
  return hit.includes('=') ? hit.slice(k.length + 3) : true;
};
const API = String(arg('api', 'https://www.tangobook.co.kr')).replace(/\/$/, '');
const IN = String(arg('in', 'cj_objects_final.json'));
const APPLY = !!arg('apply', false);
const FORCE = !!arg('force', false);
const ONLY = arg('series', null);

/** 시리즈 폴더명 → 프로덕션 folder/category. 원고 키(`yuki|12`)와 R2 를 잇는 유일한 다리다. */
const SERIES = {
  bami: '밤이네 기차',
  bruno: '브루노 할아버지네 숲',
  bung: '붕이네 물 위 장터',
  coco: '코코네 빵집 골목',
  dari: '달이네 등대',
  dingding: '딩딩네 계단 논',
  dodo: '도도네 물방앗간',
  kota: '코타와 오늘의 손님',
  lulu: '룰루네 올리브 언덕',
  mei: '메이네 산마을',
  mina: '가운데 아이 미나',
  mio: '미오네 유치원',
  moya: '모야네 물웅덩이',
  nono: '노노네 겨울 골목',
  pipo: '피포네 돌담 목장',
  pongi: '퐁이네 운하 마을',
  taro: '타로와 무무',
  twins: '쌍둥이네 바닷가',
  yuki: '유키네 산골',
};

/** 제목 앞 번호(`26. 초록도…`)로 권을 집는다. */
const volOf = (title) => {
  const m = /^\s*(\d+)\./.exec(title || '');
  return m ? Number(m[1]) : null;
};

async function main() {
  const src = JSON.parse(fs.readFileSync(path.resolve(IN), 'utf8'));
  const list = await fetch(`${API}/api/storybooks`).then((r) => r.json());
  const books = list.data ?? list;

  // (folder, 권번호) → 책
  const index = new Map();
  for (const b of books) {
    const folder = b.folder || b.category;
    const v = volOf(b.title);
    if (folder && v != null) index.set(`${folder}|${v}`, b);
  }

  const plan = [];
  const miss = [];
  for (const [key, val] of Object.entries(src)) {
    const [series, no] = key.split('|');
    if (ONLY && series !== ONLY) continue;
    const folder = SERIES[series];
    if (!folder) continue;
    const book = index.get(`${folder}|${Number(no)}`);
    if (!book) {
      miss.push(key);
      continue;
    }
    if (!val.objects?.length) continue;
    plan.push({ key, id: book.id, title: book.title, objects: val.objects });
  }

  console.log(`추출본 ${Object.keys(src).length}권 · 프로덕션 매칭 ${plan.length} · 못 찾음 ${miss.length}`);
  if (miss.length) console.log(`  못 찾음(앞 10): ${miss.slice(0, 10).join(' ')}`);

  let skipped = 0;
  let done = 0;
  for (const p of plan) {
    const full = await fetch(`${API}/api/storybooks/${p.id}`).then((r) => r.json());
    const sb = full.data ?? full;
    if ((sb.key_objects ?? []).length && !FORCE) {
      skipped++;
      continue;
    }
    // 🔴 기존 형식 그대로 — name(영문 파스칼) 은 나중 카드 생성이 쓰므로 비워 두지 않는다.
    const key_objects = p.objects.map((o) => ({
      name: o.w,
      korean: o.w,
      description: '',
      pages: o.pages ?? [],
      koExample: '',
      example: '',
      nameEn: '',
      eng: '',
    }));
    if (!APPLY) {
      if (done < 5) console.log(`  [dry] ${p.title.slice(0, 26)} ← ${key_objects.map((k) => k.korean).join(' · ')}`);
      done++;
      continue;
    }
    // 🔴 저장은 POST /api/storybooks 이고 `{ storybook }` 래퍼가 필수다.
    //    PUT /:id 는 없다(404). raw object 를 보내면 500 "Cannot read ... 'id'".
    const r = await fetch(`${API}/api/storybooks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ storybook: { ...sb, key_objects } }),
    });
    if (!r.ok) {
      console.error(`  ! 실패 ${p.title}: ${r.status}`);
      continue;
    }
    done++;
    if (done % 50 === 0) console.log(`  … ${done}권`);
  }
  console.log(`\n${APPLY ? '적용' : 'dry-run'} ${done}권 · 이미 있어 건너뜀 ${skipped}`);
  if (!APPLY) console.log('실제로 넣으려면 --apply');
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
