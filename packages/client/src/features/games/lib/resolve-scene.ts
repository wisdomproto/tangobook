import { pickPhonicsWordScene, pickUnitStoryScene } from './phonics-word-scene';
import type { Lang, Storybook } from '@tangobook/shared';

export interface WordScene {
  /** 단어가 처음 등장하는 페이지의 장면 일러스트 */
  illustrationUrl: string;
  pageNumber: number;
  /** 해당 페이지의 (언어별) 본문 텍스트 */
  pageText?: string;
  /** 해당 페이지의 (언어별) 나레이션 오디오 URL — 없으면 무음 */
  pageTtsUrl?: string;
  /** 자막에서 강조(하이라이트)할 맞춘 단어형 (ko=한글 / en=영어). 본문에 없으면 SceneReveal 이 무시. */
  highlight?: string;
}

/** 블록 게임의 정답 단어(문자열)와 매칭되는 KeyObject 찾기. */
function matchKeyObject(word: string, lang: Lang, storybook: Storybook) {
  const w = word.trim();
  const wl = w.toLowerCase();
  return storybook.key_objects?.find((k) => {
    if (lang === 'ko') return k.korean === w || k.name === w;
    if (lang === 'en')
      return (
        (!!k.nameEn && k.nameEn.toLowerCase() === wl) || (!!k.name && k.name.toLowerCase() === wl)
      );
    // vi/zh/th: 번역 이름으로 매칭 (nameEn/name 폴백도 허용)
    return (
      k.nameTranslations?.[lang]?.trim() === w ||
      (!!k.nameEn && k.nameEn.toLowerCase() === wl) ||
      (!!k.name && k.name.toLowerCase() === wl)
    );
  });
}

/**
 * keyObject.pages[] 를 본문 텍스트로 검증한 페이지 번호.
 * pages[] 는 저작 과정(페이지 추가/삭제, 초기 AI 분류)에서 drift 될 수 있어
 * (키다리 아저씨: 8개 중 7개 불일치, 2026-07-02) 실제 한국어 본문에 단어가
 * 등장하는 페이지만 신뢰하고, 아니면 전체 페이지 스캔으로 대체.
 *
 * @param koreanWord 검증 기준 한국어 단어 (모든 책의 page.text 는 ko) — 없으면 검증 불가로 claimed 신뢰
 * @returns 검증된 페이지 번호. 본문 어디에도 없으면 null (엉뚱한 장면 대신 미표시).
 */
export function findValidatedPageNumber(
  koreanWord: string | undefined,
  storybook: Storybook,
  claimed: number[] | undefined
): number | null {
  const pages = storybook.pages ?? [];
  const first = claimed?.[0] ?? null;
  if (!koreanWord) return first;
  // 텍스트가 아예 없는 책(이미지 전용 등)은 검증 불가 — 기존대로 claimed 신뢰
  if (!pages.some((p) => !!p?.text)) return first;
  for (const num of claimed ?? []) {
    if (pages[num - 1]?.text?.includes(koreanWord)) return num;
  }
  for (let i = 0; i < pages.length; i++) {
    if (pages[i]?.text?.includes(koreanWord)) return pages[i].pageNumber ?? i + 1;
  }
  return null;
}

/**
 * 게임 정답 단어 → 그 단어가 나오는 동화 장면(일러스트 + 페이지 텍스트 + 나레이션).
 * 소스 동화책(book context)이 있어야 매핑됨 — 없거나 매칭 실패 시 null (graceful).
 * WordDetailModal 의 findPageIllustration 패턴을 게임용(문자열 단어)으로 정리.
 */
export function resolveSceneFromWord(
  word: string,
  lang: Lang,
  storybook?: Storybook,
  style?: string
): WordScene | null {
  if (!storybook || !word) return null;
  /**
   * 파닉스 단원에서 맞힌 낱말 → 예문 장면. 순서가 규칙의 전부다(2026-08-12 사용자).
   *
   * 1. **다른 동화책** — 인덱스에서 찾아온다. 배운 낱말을 **새 이야기에서** 만나는 게 이 기능의 목적이다.
   * 2. **그 단원의 호리 한글 나무 동화** — 우선순위 **가장 낮음**. 아이가 이 단원에서 이미 본
   *    이야기라 다시 봐도 새로 만나는 게 아니다. 다른 책에 그 낱말이 없을 때의 폴백이다.
   * 3. 둘 다 없으면 null — 낱말만 읽어 주고 넘어간다.
   *
   * 🔴 **「파닉스는 자기 쪽 금지」(2026-07-29)를 뒤집은 것이다.** 그때 오류처럼 보였던 이유는
   *    호리 동화가 뜬 것 자체가 아니라 **나레이션이 0개라 소리 없이 스쳐 지나갔기** 때문이다
   *    (삽화 245장이 막 들어와 그림만 조건을 채웠다). 256쪽 나레이션을 구운 뒤라 이제 읽어 준다.
   *    막는 자리도 여는 자리도 여기 한 곳 — 호출부가 플레이어 8개라 거기서 하면 하나씩 빠뜨린다.
   */
  if (storybook.type === 'phonics')
    return pickPhonicsWordScene(word, lang) ?? pickUnitStoryScene(word, lang, storybook);
  const ko = matchKeyObject(word, lang, storybook);
  if (!ko) return null;
  const pageNum = findValidatedPageNumber(
    ko.korean ?? (lang === 'ko' ? word : undefined),
    storybook,
    ko.pages
  );
  if (!pageNum) return null;

  const page = storybook.pages?.[pageNum - 1];
  const styleUrl =
    style && storybook.styleAssets?.[style]?.pageIllustrations?.[pageNum]?.illustrationUrl;
  const url = styleUrl ?? page?.illustrationUrl;
  if (!url) return null;

  const pageText = lang === 'ko' ? page?.text : (page?.translations?.[lang]?.text ?? page?.text);
  const pageTtsUrl = lang === 'ko' ? page?.ttsUrl : page?.translations?.[lang]?.ttsUrl;
  // 자막 하이라이트할 단어형 — 본문에 실제 등장할 때만 강조됨(SceneReveal).
  const highlight =
    lang === 'ko'
      ? (ko.korean ?? word)
      : lang === 'en'
        ? (ko.nameEn ?? word)
        : (ko.nameTranslations?.[lang] ?? word);

  return { illustrationUrl: url, pageNumber: pageNum, pageText, pageTtsUrl, highlight };
}
