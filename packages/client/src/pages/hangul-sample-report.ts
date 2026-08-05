import type { LearningEvent, StorybookSummary } from '@tangobook/shared';

/**
 * `/hangul` 랜딩의 **학습 현황 예시 데이터**.
 *
 * 🔴 진짜 부모 리포트 컴포넌트(`PhonicsReportSection`·`StorybookReportSection`)를 랜딩에서
 *    라이브로 보여주되, 계정·아이가 없으니 **예시 이벤트**를 먹인다(활동을 라이브로 얹는 것과 같은 방식).
 * 🔴 화면엔 반드시 「예시」라고 밝힌다 — 실제 아이 기록으로 오인하면 안 된다(호출부 라벨).
 * 🔴 파닉스 격자가 켜지는 조건 = `syllable_correct` + `metadata.{consonant,vowel}`.
 *    `groupBySyllable` 키가 `consonant+vowel(+coda)` 라, 정답 수·최근성만 조절하면 익힘/연습중/봄이 갈린다.
 */

// 자음×모음 스프레드 — 정답 수(n)로 마스터리 단계를 만든다(많을수록 익힘, 최근일수록 높음).
// 한글1 자음(14) × 모음(10) = 140칸.
// 🔴 랜딩은 **활동 중인 아이**를 보여줘야 한다 — 격자가 텅 비면(대부분 안 봄) "안 하는 앱"으로 읽힌다.
//    셀 몇 개만 채우던 걸(안 봄 115/140) 바꿔, 진도처럼 **대부분을 채운다**: 앞 자음·기본 모음일수록
//    익힘, 뒤로 갈수록 옅게. 결정적 얼룩(jitter)으로 자연스럽게.
const CONSONANTS = [
  'ㄱ',
  'ㄴ',
  'ㄷ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅅ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];
const VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'];

/** (자음 index, 모음 index) → 정답 횟수(0=안 봄 … 6=익힘). 진도 그라데이션 + 결정적 얼룩. */
function sampleCount(ci: number, vi: number): number {
  const progress = 1 - (ci / CONSONANTS.length) * 0.62 - (vi / VOWELS.length) * 0.24;
  const jitter = ((ci * 7 + vi * 5) % 10) / 10; // 0..0.9, 결정적
  const score = progress - jitter * 0.3;
  if (score > 0.6) return 6; // 익힘
  if (score > 0.4) return 3; // 연습 중
  if (score > 0.24) return 1; // 봄
  return 0; // 안 봄(뒤쪽 일부)
}

// 동화책에서 만난 낱말 — 여러 책에 겹쳐도 좋다(「외 N권」이 그렇게 뜬다).
const WORDS = ['고기', '사과', '나무', '바다', '오리', '토끼', '구름', '꽃'];

const DAY = 86_400_000;

export function buildSampleReportEvents(storybooks: StorybookSummary[]): LearningEvent[] {
  const now = Date.now();
  const ago = (days: number) => new Date(now - days * DAY).toISOString();
  let id = 0;
  const ev: LearningEvent[] = [];
  const push = (e: Partial<LearningEvent> & Pick<LearningEvent, 'event_type'>) =>
    ev.push({
      id: `sample-${id++}`,
      profile_id: 'sample',
      storybook_id: null,
      game_type: null,
      word: null,
      metadata: null,
      created_at: ago(1),
      ...e,
    });

  // ① 파닉스 음절 — 격자를 진도처럼 채운다(대부분 봄~익힘, 뒤쪽 일부만 안 봄).
  CONSONANTS.forEach((c, ci) =>
    VOWELS.forEach((v, vi) => {
      const n = sampleCount(ci, vi);
      for (let i = 0; i < n; i++) {
        push({
          event_type: 'syllable_correct',
          metadata: { source: 'phonics', lang: 'ko', consonant: c, vowel: v },
          created_at: ago(i % 3), // 최근 3일 안 — 시간 감쇠가 크지 않게
        });
      }
    })
  );
  // ② 파닉스 단원 방문 — 진도(📖 N/M unit) 표시.
  for (const u of ['kr-h1-u02', 'kr-h1-u03', 'kr-h1-u04', 'kr-h1-u05', 'kr-h1-u06']) {
    push({
      event_type: 'page_read',
      storybook_id: u,
      metadata: { source: 'phonics', lang: 'ko', unitId: u },
      created_at: ago(2),
    });
  }

  // ③ 동화책 — 실제 책 5권을 읽고 낱말을 만난다.
  const books = storybooks.filter((s) => s.coverImage && s.type !== 'phonics').slice(0, 5);
  books.forEach((b, bi) => {
    push({
      event_type: 'page_read',
      storybook_id: b.id,
      metadata: {
        source: 'storybook',
        lang: 'ko',
        ...(b.artStyle ? { style: b.artStyle } : {}),
        lastPage: true,
      },
      created_at: ago(bi), // 오늘~4일 전 — 이번 주 안
    });
    for (let wi = 0; wi < 2; wi++) {
      const word = WORDS[(bi + wi) % WORDS.length];
      push({
        event_type: 'word_exposed',
        storybook_id: b.id,
        word,
        metadata: { source: 'storybook', lang: 'ko' },
        created_at: ago(bi),
      });
      // 첫 두 권의 첫 낱말은 틀림 → 「다시 한번 보면 좋을 낱말」 카드가 산다.
      push({
        event_type: bi < 2 && wi === 0 ? 'word_wrong' : 'word_correct',
        storybook_id: b.id,
        word,
        metadata: { source: 'storybook', lang: 'ko' },
        created_at: ago(bi),
      });
    }
  });

  return ev;
}
