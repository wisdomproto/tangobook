#!/usr/bin/env node
/**
 * 234 storybook 의 카테고리 재분류 매핑 제안.
 *
 * 입력: scripts/_data/books-by-category.json
 * 출력: scripts/_data/recategorize-proposal.json
 *   { categoryList, mappings, unmapped, summary }
 *
 * 룰 = 위→아래 순서 평가. 첫 매칭의 category 적용.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DUMP = path.join(__dirname, '_data', 'books-by-category.json');
const OUT = path.join(__dirname, '_data', 'recategorize-proposal.json');

const CATEGORY_LIST = [
  '세계 명작',
  '전래 동화',
  '공룡 친구들',
  '곤충 친구들',
  '육지 동물 친구들',
  '바다 동물 친구들',
  '하늘 동물 친구들',
  '식물 친구들',
  '우주와 자연',
  '우리 몸 이야기',
];

const RULES = [
  {
    category: '공룡 친구들',
    reason: '공룡/익룡/해룡',
    keywords: [
      '공룡', '사우루스', '사우라', '랍토', '케라톱스', '케팔로사우루스', '프테라노돈',
      '모사사우', '람포린쿠스', '바리오닉스', '안킬로', '디플로도쿠스', '브라키오',
      '벨로키랍토르', '벨로키라프토르', '이구아노돈', '스피노', '아파토', '스테고',
      '파라사우롤로푸스', '스티라코사우루스', '파키케팔로', '티라노사우루스',
      '타르보사우루스', '기가노토사우루스', '트리케라톱스', '마이아사우라',
      '케트살코아틀루스',
    ],
  },
  {
    category: '곤충 친구들',
    reason: '곤충/거미/달팽이',
    keywords: [
      '꿀벌', '거미', '사슴벌레', '장수풍뎅이', '호랑나비', '나비', '개미',
      '무당벌레', '잠자리', '달팽이',
    ],
  },
  {
    category: '바다 동물 친구들',
    reason: '바다/수영 동물',
    keywords: [
      '펭귄', '물개', '고래', '상어', '죠스', '문어', '해마', '흰동가리',
      '바다거북', '말미잘', '게',
    ],
  },
  {
    category: '하늘 동물 친구들',
    reason: '새 (못 나는 새 포함)',
    keywords: [
      '오리', '올빼미', '앵무새', '딱따구리', '백로', '독수리', '타조', '참새',
      '제비', '비둘기',
    ],
  },
  {
    category: '식물 친구들',
    reason: '식물/꽃/나무/열매',
    keywords: [
      '해바라기', '민들레', '사과나무', '장미', '튤립', '선인장', '버섯',
      '은행나무', '소나무', '수박', '연꽃', '파리지옥', '강아지풀', '딸기',
      '밤나무', '포도나무', '나팔꽃', '참나무',
    ],
  },
  {
    category: '우주와 자연',
    reason: '우주/자연현상',
    keywords: [
      '태양계', '행성', '달과 별', '은하', '블랙홀', '화산', '지진', '사막',
      '극지방', '동굴', '갯벌',
    ],
  },
  {
    category: '우리 몸 이야기',
    reason: '신체/생체',
    keywords: ['몸속 여행', '뼈와 근육', '뇌와 심장', '유산균', '바이러스'],
  },
  {
    category: '전래 동화',
    reason: '전래/명작 (기타 잘못 분류)',
    keywords: [
      '금도끼 은도끼', '임금님 귀', '북풍과 태양', '빨간 모자', '빨간모자',
      '성냥팔이', '성냥갑 병정', '브레멘 음악대', '피터팬', '피터 팬',
      '개미와 베짱이',
    ],
  },
  {
    category: '육지 동물 친구들',
    reason: '육지 포유류/파충류/양서류',
    keywords: [
      '토끼', '곰', '호랑이', '사자', '코끼리', '기린', '강아지', '고양이',
      '캥거루', '판다', '표범', '치타', '늑대', '다람쥐', '여우', '고슴도치',
      '두더지', '카멜레온', '도마뱀', '뱀', '두꺼비', '개구리', '하마', '코뿔소',
      '원숭이', '악어',
    ],
  },
];

function classify(book) {
  const title = book.title || '';
  for (const r of RULES) {
    const hit = r.keywords.find((k) => title.includes(k));
    if (hit) {
      return { category: r.category, reason: `"${hit}" (${r.reason})` };
    }
  }
  return null;
}

function main() {
  const dump = JSON.parse(fs.readFileSync(DUMP, 'utf-8'));
  const books = dump.books.filter((b) => b.type === 'storybook');

  const mappings = [];
  const unmapped = [];
  const keep = [];

  // 세계 명작/전래 동화에 이미 들어있는 책은 보호 (룰 적용 X — 그대로 유지)
  const PROTECT = new Set(['세계 명작', '전래 동화']);
  // 단, 헨젤과 그레텔처럼 현재 기타인 명작도 끌어올리기 위해 manual override list
  const MANUAL = {
    '1770187105683': '세계 명작', // 헨젤과 그레텔*
    '1769693451448': '육지 동물 친구들', // 자연관찰_개
  };

  for (const b of books) {
    const current = b.category || '기타';
    if (MANUAL[b.id]) {
      const proposed = MANUAL[b.id];
      if (proposed === current) {
        keep.push({ id: b.id, title: b.title, current });
      } else {
        mappings.push({
          id: b.id,
          title: b.title,
          current,
          proposed,
          reason: 'manual override',
        });
      }
      continue;
    }
    if (PROTECT.has(current)) {
      keep.push({ id: b.id, title: b.title, current });
      continue;
    }
    const result = classify(b);
    if (result) {
      if (result.category !== current) {
        mappings.push({
          id: b.id,
          title: b.title,
          current,
          proposed: result.category,
          reason: result.reason,
        });
      } else {
        keep.push({ id: b.id, title: b.title, current });
      }
    } else {
      unmapped.push({ id: b.id, title: b.title, current });
    }
  }

  const proposedCount = {};
  for (const m of mappings) proposedCount[m.proposed] = (proposedCount[m.proposed] ?? 0) + 1;
  for (const k of keep) proposedCount[k.current] = (proposedCount[k.current] ?? 0) + 1;

  const out = {
    generatedAt: new Date().toISOString(),
    categoryList: CATEGORY_LIST,
    summary: {
      totalStorybooks: books.length,
      toMove: mappings.length,
      keep: keep.length,
      unmapped: unmapped.length,
      proposedCount,
    },
    mappings,
    unmapped,
  };

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`저장: ${OUT}`);
  console.log(
    `\n총 ${books.length}권 / 이동 ${mappings.length} / 유지 ${keep.length} / 미매칭 ${unmapped.length}`
  );
  console.log('\n제안 카테고리별 권수:');
  for (const [c, n] of Object.entries(proposedCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c}: ${n}`);
  }
  if (unmapped.length > 0) {
    console.log('\n⚠️ 미매칭 (proposal JSON 에 사람이 직접 추가 필요):');
    unmapped.forEach((b) => console.log(`  ${b.id} | ${b.title} | 현재: ${b.current}`));
  }
}

main();
