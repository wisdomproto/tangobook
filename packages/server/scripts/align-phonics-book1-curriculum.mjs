#!/usr/bin/env node
/**
 * 영어 Book 1 의 `wordFamilies` 를 **커리큘럼에 맞춘다** (멱등).
 *
 * 🔴 왜: R2 storybook 의 단어가 `ENGLISH_PHONICS_CURRICULUM` 과 21개 어긋나 있었다
 *   (`bat→bear`·`desk→doll`·`fork→fox` …). 25유닛 전수 대조에서 **커리큘럼 == 기획서 삽화가
 *   25/25 일치**하고 어긋난 건 R2 한 곳뿐이라, 커리큘럼이 맞고 R2 가 틀린 것으로 판정했다.
 *   그래서 새로 그릴 삽화는 **0장** — 단어만 되돌리면 이미 있는 카드가 그대로 붙는다.
 *
 * 🔴 `wordFamilies` 만 고친다. `targetWords`·`flashcards` 는 기존
 *   `sync-phonics-book1-targetwords.mjs` 가 wordFamilies 에서 파생시키므로 이 스크립트 뒤에 그걸 돌린다
 *   (같은 일을 두 군데서 하지 않는다).
 *
 * 🔴 **바뀐 단어의 `ttsUrl`·`hotspots` 는 버린다.** 그 음원은 옛 단어를 소리 내 읽고("bear"),
 *   핫스팟은 옛 단어가 그려진 레슨 삽화 좌표다 — 단어가 바뀌면 둘 다 거짓이 된다.
 *   유지되는 단어(apple·cat 등)의 자산은 그대로 둔다.
 *
 * 사용:
 *   node packages/server/scripts/align-phonics-book1-curriculum.mjs            # dry-run
 *   node packages/server/scripts/align-phonics-book1-curriculum.mjs --apply
 *   그 다음: node packages/server/scripts/sync-phonics-book1-targetwords.mjs --apply
 */
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';
import { ENGLISH_PHONICS_CURRICULUM } from '@tangobook/shared';

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
loadEnv();

/**
 * 커리큘럼에만 있던 단어의 한국어 뜻. 학습자 화면엔 안 뜨지만(영어 단원은 영어 표기)
 * 저작도구가 이 값을 보여주므로 비워두면 편집이 불편하다.
 */
const GLOSS = {
  bat: '야구 방망이', desk: '책상', elbow: '팔꿈치', fork: '포크',
  game: '게임', hippo: '하마', jacket: '재킷', key: '열쇠',
  lamp: '램프', mouse: '생쥐', panda: '판다', piano: '피아노',
  question: '물음표', quiet: '조용히', rabbit: '토끼', robot: '로봇',
  sand: '모래', ten: '열', under: '아래', vase: '꽃병',
  six: '여섯', window: '창문',
};

const book1 = ENGLISH_PHONICS_CURRICULUM.find((b) => b.level === 'book1');
if (!book1) throw new Error('book1 커리큘럼을 찾지 못했습니다.');

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}\n`);
let changedUnits = 0;
let changedWords = 0;
const dropped = [];

for (const unit of book1.units) {
  const sb = await getStorybook(unit.id);
  const lesson = sb.phonicsLesson;
  if (!lesson?.wordFamilies?.length) {
    console.log(`[${unit.id}] wordFamilies 없음 — skip`);
    continue;
  }

  // 커리큘럼 단어를 글자 순서대로 3개씩 끊어 기존 가족(글자별)에 배분한다.
  // 🔴 커리큘럼 sampleWords 는 글자 순서로 정렬돼 있고 가족 수와 맞아떨어진다 — 어긋나면 건드리지 않는다.
  const words = unit.sampleWords ?? [];
  const families = lesson.wordFamilies;
  const per = words.length / families.length;
  if (!Number.isInteger(per)) {
    console.log(`[${unit.id}] ⚠️ 단어 ${words.length} / 가족 ${families.length} 가 안 나눠떨어짐 — skip`);
    continue;
  }

  /**
   * 🔴 자산은 **자리가 아니라 단어로** 물려받는다. 위치로 대응시키면 `jet` 이 가족 안에서 한 칸
   *    밀렸다는 이유만으로 멀쩡한 음원을 버리게 된다(첫 시도에서 38건이 그렇게 잡혔다).
   * 🔴 단, `hotspots` 는 **같은 가족(글자)에 남을 때만** 물려받는다 — 좌표가 그 글자의 레슨 삽화를
   *    가리키므로, 다른 글자로 옮겨가면 엉뚱한 그림의 좌표가 된다.
   */
  const oldByWord = new Map();
  families.forEach((wf, fi) => {
    for (const w of wf.words ?? []) oldByWord.set(w.word, { ...w, _family: fi });
  });

  let unitChanged = 0;
  families.forEach((wf, fi) => {
    const slice = words.slice(fi * per, (fi + 1) * per);
    wf.words = slice.map((word) => {
      const old = oldByWord.get(word);
      if (old) {
        const { _family, hotspots, ...rest } = old;
        return _family === fi && hotspots ? { ...rest, hotspots } : rest;
      }
      unitChanged++;
      dropped.push(`${unit.id} ${word}`);
      return { word, korean: GLOSS[word] ?? '' };
    });
  });

  if (!unitChanged) {
    console.log(`[${unit.id}] 이미 커리큘럼과 같음`);
    continue;
  }
  changedUnits++;
  changedWords += unitChanged;
  console.log(`[${unit.id}] ${unitChanged}개 교체 → ${words.join(' ')}`);
  if (APPLY) {
    sb.updatedAt = new Date().toISOString();
    await putStorybook(unit.id, sb);
  }
}

console.log(`\n단원 ${changedUnits}개 / 단어 ${changedWords}개 교체`);
if (dropped.length) {
  console.log(`\n새로 들어오는 단어 ${dropped.length}개 (음원·핫스팟 없음 — 생성 필요):`);
  dropped.forEach((d) => console.log('  - ' + d));
}
if (!APPLY) console.log('\n(dry-run — 반영하려면 --apply, 그 다음 sync-phonics-book1-targetwords.mjs --apply)');
