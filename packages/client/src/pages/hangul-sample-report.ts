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
const SYLL: { c: string; v: string; n: number }[] = [
  // 익힘(초록) — 6회 이상
  { c: 'ㄱ', v: 'ㅏ', n: 6 },
  { c: 'ㄴ', v: 'ㅏ', n: 6 },
  { c: 'ㄷ', v: 'ㅏ', n: 6 },
  { c: 'ㄹ', v: 'ㅏ', n: 6 },
  { c: 'ㄱ', v: 'ㅗ', n: 6 },
  { c: 'ㄴ', v: 'ㅗ', n: 5 },
  { c: 'ㄷ', v: 'ㅗ', n: 5 },
  // 연습 중(진한 코랄) — 3회
  { c: 'ㄱ', v: 'ㅑ', n: 3 },
  { c: 'ㄴ', v: 'ㅑ', n: 3 },
  { c: 'ㄷ', v: 'ㅕ', n: 3 },
  { c: 'ㄹ', v: 'ㅓ', n: 3 },
  { c: 'ㄱ', v: 'ㅛ', n: 2 },
  { c: 'ㄴ', v: 'ㅜ', n: 2 },
  // 봄(연한 코랄) — 1회
  { c: 'ㄱ', v: 'ㅓ', n: 1 },
  { c: 'ㄴ', v: 'ㅓ', n: 1 },
  { c: 'ㄱ', v: 'ㅜ', n: 1 },
  { c: 'ㄷ', v: 'ㅜ', n: 1 },
  { c: 'ㄱ', v: 'ㅡ', n: 1 },
];

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

  // ① 파닉스 음절 — 격자를 칠한다.
  for (const s of SYLL) {
    for (let i = 0; i < s.n; i++) {
      push({
        event_type: 'syllable_correct',
        metadata: { source: 'phonics', lang: 'ko', consonant: s.c, vowel: s.v },
        created_at: ago(i % 3), // 최근 3일 안 — 시간 감쇠가 크지 않게
      });
    }
  }
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
