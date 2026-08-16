// SCENE 에서 **무대와 사물 시트에 그릴 것**을 뽑는다. 프롬프트는 안 쓴다 — 후보만 낸다.
//
// 🔴 왜 시트가 필요한가: 권당 장소가 7.5곳으로 나오는데 실측해 보니 **한 무대 안의 다른 자리**였다
//    (「같은 개울, 왼쪽 물가」 · 「같은 나무 밑, 조금 뒤」). 지금은 그 열 장이 서로를 모른다.
//
//   node packages/client/scripts/extract-series-stages.mjs           # 전 시리즈
//   node packages/client/scripts/extract-series-stages.mjs taro      # 한 시리즈
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'changjak-books');

// 🔴 사물이 아닌 것 — 안 거르면 조사·부사·방향어가 상위를 다 먹는다(실측: 「하나」가 66회로 1등이었다).
const STOP = new RegExp('^(' + [
  '그것', '이것', '저것', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉',
  '같은', '바로', '화면', '가장자리', '자리', '둘레', '모두', '전부', '조금', '다시', '아직', '이제',
  '위에', '아래', '옆에', '앞에', '뒤로', '뒤에', '왼쪽', '오른쪽', '사이', '가운데', '한쪽', '양쪽',
  '남은', '놓인', '젖은', '마른', '있다', '없다', '나란히', '발밑에', '바닥에', '폭의', '너머',
  '하며', '한다', '된다', '보인다', '만큼', '정도', '때문', '동안', '다음', '처음', '마지막',
].join('|') + ')$');

/** 「물방앗간 앞 개울, 맑은 아침.」 → 「물방앗간 앞 개울」
 *  🔴 끝의 마침표를 안 떼면 「마당」과 「마당.」이 **다른 무대로 세어진다**(실측: 그래서 시리즈 무대가
 *     0~4개로 갈렸다). 시간어(아침·오후·밤)도 무대 이름이 아니다. */
const placeHead = (s) => s.replace(/<[^>]+>/g, '').split(/[,·]/)[0]
  .replace(/\s+/g, ' ').replace(/[.·,]+$/, '').trim();

/** 「같은 개울, 왼쪽 물가」의 「같은 …」은 앞 쪽을 가리키는 말이라 무대 이름이 아니다 */
const isBackRef = (p) => /^(같은|그|저|바로)\s/.test(p);

/** 자리 이름 Map(이름→권 Set) → Map(host→{ids,aka,unresolved?}). 규칙은 호출부 주석 참조. */
function mergePlaces(places) {
  const names = [...places.keys()];
  // 🔴 꼬리는 **어절 경계**에서 끝나야 한다 — 글자만 보면 「우물가」가 「물가」에 먹힌다(우물 옆 ≠ 개울 물가).
  const tail = (long, short) => long !== short && long.endsWith(' ' + short);
  const extOf = (n) => names.filter((k) => tail(k, n));
  const merged = new Map();
  const put = (k) => merged.get(k) ?? merged.set(k, { ids: new Set(), aka: new Set() }).get(k);
  for (const [name, ids] of [...places].sort((a, b) => a[0].length - b[0].length)) {
    // 나를 흡수할 짧은 이름 = 내 꼬리이면서 **확장이 나 하나뿐**인 것
    const host = names.find((k) => tail(name, k) && extOf(k).length === 1);
    const t = put(host ?? name);
    ids.forEach((i) => t.ids.add(i));
    if (host) t.aka.add(name);
    else if (extOf(name).length > 1) t.unresolved = extOf(name);
  }
  return merged;
}

function analyse(key) {
  const file = path.join(DOCS, key, '_scenes.json');
  if (!fs.existsSync(file)) return null;
  const scenes = JSON.parse(fs.readFileSync(file, 'utf8'));

  const seriesPlaces = new Map(); // 무대 이름 → 그 무대를 쓰는 권
  const books = [];

  for (const [id, pages] of Object.entries(scenes).sort()) {
    const spots = [];       // 쪽 순서대로의 자리
    const named = [];       // 「같은 …」이 아닌 실제 이름
    const propPages = new Map();

    // 🔴 「같은 나무 밑, 조금 뒤」는 **앞 쪽의 그 자리**를 가리킨다. 안 풀면 방문이 안 세어진다.
    let current = null;
    for (const [p, text] of Object.entries(pages)) {
      const pm = text.match(/<b>장소·시간<\/b>([^<]*)/);
      if (pm) {
        const head = placeHead(pm[1]);
        spots.push({ p, head });
        if (head && !isBackRef(head)) { current = head; named.push(head); }
        else if (current) named.push(current);   // 되짚는 쪽도 그 자리를 한 번 더 방문한 것이다
      }
      const bm = text.match(/<b>배경·소품<\/b>([^<]*)/);
      if (bm) {
        for (const w of new Set(bm[1].match(/[가-힣]{2,6}/g) ?? [])) {
          if (STOP.test(w)) continue;
          // 🔴 사물은 명사다. 「굵은·마른·작은」 같은 관형형이 자주 섞여 들어온다(실측: 타로 06 의
          //    사물 둘 중 하나가 「굵은」이었다). 짧은 낱말의 관형 어미만 거른다.
          if (w.length <= 3 && /[은는한린운던]$/.test(w)) continue;
          // 🔴 용언 — 「칠하지(12회)·떨어지는·뒤집힌」이 사물로 잡혔다. 관형·연결 어미를 통째로 거른다.
          if (/(하지|하는|되는|지는|이는|리는|드는|나는|가는|오는|보는|없는|있는|친|힌|긴|킨|낸|든)$/.test(w)) continue;
          // 🔴 **무대 요소는 사물이 아니다** — 「마당(13회)·논둑(11)·마루」는 자리 시트가 맡는다.
          if (/^(마당|논둑|마루|골목|바닥|하늘|땅바닥|벽면|천장|문턱|담장|둑길)$/.test(w)) continue;
          // 🔴 **앵커 조항이 맡는 것** — 그림자·빗줄기·그늘은 매체 규칙이지 그 권의 물건이 아니다.
          if (/^(그림자|빗줄기|그늘|햇빛|불빛|어둠|안개|김이|연기)$/.test(w)) continue;
          (propPages.get(w) ?? propPages.set(w, new Set()).get(w)).add(p);
        }
      }
    }

    // 🔴 **「사는 곳」이 아니라 「가는 곳」을 센다.** 최빈 장소만 잡으면 여러 권이 들르는 자리가
    //    통째로 빠진다 — 타로 개울가는 6권이 가는데 자기 집으로 삼은 권이 둘뿐이라 목록에 없었다.
    //    자리 시트는 **방문**을 덮어야 한다.
    const tally = new Map();
    for (const n of named) tally.set(n, (tally.get(n) ?? 0) + 1);
    const stage = [...tally].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '(불명)';
    for (const visited of tally.keys())
      (seriesPlaces.get(visited) ?? seriesPlaces.set(visited, new Set()).get(visited)).add(id);

    // 🔴 사물 = **그 권에서 3쪽 이상**(사용자 기준: 「한 권에서 여러 번 나오는 것만」).
    //    시리즈 전체 빈도로 세면 「물레방아 25권에 26회」(권당 한 번 = 배경)가 1등이 된다.
    const props = [...propPages].filter(([, v]) => v.size >= 3)
      .sort((a, b) => b[1].size - a[1].size)
      .map(([w, v]) => ({ name: w, pages: [...v].sort((x, y) => +x.slice(1) - +y.slice(1)) }));

    books.push({ id, stage, spots, props });
  }

  // 🔴 **병합은 확장이 하나일 때만 한다** (2026-08-16). 수식어가 하는 일이 두 가지다.
  //    ①「마당」→「집 마당」 하나뿐 = **그 자리 안 어디**를 가리킨다 → 한 자리, 묶는다.
  //    ②「나무 밑」→「우물 나무 밑」·「개울 나무 밑」·「열매 나무 밑」 = **어느 것인지**를 가리킨다
  //      → 서로 다른 나무다. 묶으면 타로 01권의 사건(「두 나무가 크기도 모양도 꼭 같다」)을
  //      그릴 수가 없다. 그래서 확장이 둘 이상이면 짧은 이름을 흡수시키지 않고, 그 이름에
  //      `unresolved` 를 달아 남긴다 = **시트가 아니라 경로표에서 결정할 빈칸**이다
  //      (타로 「나무 밑」 5권 17쪽이 어느 나무인지 SCENE 에 안 적혀 있다).
  //    ⚠️ **host 는 언제나 짧은 쪽이다.** 긴 쪽으로 흡수시켰더니 1쪽짜리 복합명
  //      「우물 나무 밑과 마을 길」이 7권짜리 「마을 길」을 먹고 그 이름으로 목록에 올랐다.
  const merged = mergePlaces(seriesPlaces);

  // 🔴 자리 시트 = **2권 이상이 가는 자리**. 「3권 이상이 사는 자리」가 아니다 — 6권이 들르는
  //    타로 개울가가 그 문턱에서 통째로 빠져 있었다. 한 권짜리는 그 권 경로표가 맡는다.
  const stages = [...merged].filter(([, v]) => v.ids.size >= 2)
    .sort((a, b) => b[1].ids.size - a[1].ids.size)
    .map(([name, v]) => ({
      name, aka: [...v.aka], books: [...v.ids].sort(),
      ...(v.unresolved && { unresolved: v.unresolved }),
    }));

  return { key, stages, books };
}

const targets = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const keys = targets.length
  ? targets
  : fs.readdirSync(DOCS).filter((d) => fs.existsSync(path.join(DOCS, d, '_scenes.json'))).sort();

let totStage = 0, totProp = 0, totUn = 0;
for (const key of keys) {
  const r = analyse(key);
  if (!r) { console.log(`${key} — SCENE 없음`); continue; }
  fs.writeFileSync(path.join(DOCS, key, '_stages.json'), JSON.stringify(r, null, 2) + '\n');
  const props = r.books.reduce((a, b) => a + b.props.length, 0);
  const un = r.stages.filter((s) => s.unresolved);
  totStage += r.stages.length; totProp += props; totUn += un.length;
  console.log(
    `${key.padEnd(9)} 자리 ${String(r.stages.length).padStart(2)} · 사물 ${String(props).padStart(3)}(권당 ${(props / r.books.length).toFixed(1)})` +
    `  ${r.stages.slice(0, 3).map((s) => `${s.name}(${s.books.length})`).join(' · ')}` +
    (un.length ? `  🔴 미결 ${un.map((s) => `${s.name}→${s.unresolved.length}`).join(' ')}` : '')
  );
}
// 🔴 권별은 시트가 아니라 **경로표**다 — 「그 권이 머무는 자리 하나」가 없다(권당 3.0곳).
console.log(`\n합계 자리 시트 ${totStage}(🔴 미결 ${totUn} = 경로표에서 결정) · 경로표 ${keys.length * 25} · 사물 ${totProp}`);

// 🔴 자기 검사 — `node extract-series-stages.mjs --check`. 병합 방향을 두 번 틀렸다(긴 쪽이 host 가
//    되어 1쪽짜리 복합명이 7권짜리 자리를 먹었다). 이 세 줄이 그걸 잡는다.
if (process.argv.includes('--check')) {
  const mk = (o) => new Map(Object.entries(o).map(([k, v]) => [k, new Set(v)]));
  const a = mergePlaces(mk({ '마당': ['01'], '집 마당': ['02', '03'] }));
  console.assert(a.has('마당') && !a.has('집 마당') && a.get('마당').ids.size === 3, '확장 1개 = 짧은 쪽으로 흡수');
  const b = mergePlaces(mk({ '나무 밑': ['01'], '우물 나무 밑': ['02'], '개울 나무 밑': ['03'] }));
  console.assert(b.size === 3 && b.get('나무 밑').unresolved.length === 2, '확장 2개↑ = 안 묶고 미결 표시');
  const c = mergePlaces(mk({ '마을 길': ['01', '02'], '우물 나무 밑과 마을 길': ['03'] }));
  console.assert(c.has('마을 길') && c.get('마을 길').ids.size === 3, 'host 는 언제나 짧은 쪽');
  const d = mergePlaces(mk({ '물가': ['01'], '우물가': ['02'] }));
  console.assert(d.size === 2, '어절 경계 — 「우물가」는 「물가」가 아니다');
  console.log('selfcheck ok');
}
