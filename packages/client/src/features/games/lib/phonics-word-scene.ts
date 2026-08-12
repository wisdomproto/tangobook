import type { Lang, Storybook } from '@tangobook/shared';
import { apiGet } from '@/lib/axios';
import WORD_SCENES from '@/features/phonics-learner/data/word-scenes.json';

/**
 * 파닉스 낱말 게임에서 한 낱말을 맞히면, **그 낱말이 나오는 동화책 한 쪽**을 보여 준다.
 * 파닉스에서 배운 낱말을 동화책에서 다시 만나게 하는 게 목적이다.
 *
 * 🔴 파닉스 책 자신의 쪽은 절대 쓰지 않는다 — 그건 `resolveSceneFromWord` 가 막는 별개 문제다
 *    (2026-07-29: 한글 나무 삽화가 들어오자 파닉스 게임 중에 호리 동화가 스쳤다).
 *    여기서 오는 건 언제나 **다른 동화책**이다.
 *
 * 🔴 리빌은 정답 소리 콜백 안에서 동기로 일어난다. 그때 책을 받으러 가면 늦으므로
 *    판이 시작되기 전에 `preloadWordScenes` 로 미리 받아 둔다. 못 받았으면 그냥 안 띄운다
 *    (낱말만 읽어 주고 넘어간다 — 사용자 지시).
 */
const INDEX = WORD_SCENES as unknown as Record<string, Array<[bookId: string, page: number]>>;

const books = new Map<string, Storybook | null>();
const inflight = new Map<string, Promise<unknown>>();
/** 이번 판에서 그 낱말에 쓸 쪽 — 판마다 새로 뽑는다. */
const chosen = new Map<string, [bookId: string, page: number]>();

/**
 * 🔴 이번 판에서 **실제로 화면에 뜬** 책. 결과 화면의 「방금 만난 책」이 이걸 읽는다.
 *
 * 리빌 화면에 「책 보러 가기」를 두면 아이가 4문제 중 2번째에서 판을 통째로 버리고 나간다
 * (4~7세는 돌아와 마저 하지 못한다). 그래서 게임이 끝난 **뒤** 표지를 나란히 세워 고르게 한다.
 */
const met = new Map<string, { id: string; title: string; coverUrl?: string }>();

export interface MetBook {
  id: string;
  title: string;
  coverUrl?: string;
}
/** 이번 판에서 만난 책 (뜬 순서). */
export const getMetBooks = (): MetBook[] => [...met.values()];

function remember(sb: Storybook) {
  if (met.has(sb.id)) return;
  met.set(sb.id, {
    id: sb.id,
    title: sb.title ?? '',
    coverUrl:
      sb.primaryCoverByLang?.ko ??
      sb.coverImage ??
      Object.values(sb.styleAssets ?? {}).find((s) => s?.coverImage)?.coverImage,
  });
}

/**
 * 이번 판에 나올 낱말들의 동화책을 미리 받아 둔다. 실패해도 조용히 넘어간다.
 *
 * 🔴 **낱말당 한 권만 받는다.** 후보를 다 받으면 낱말 4개짜리 판에서 책 20권을 받아
 *    게임 진입이 통째로 느려진다(실측). 무작위는 여기서 한 번만 뽑고, 리빌은 그 결과를 쓴다 —
 *    판마다 새로 뽑으므로 같은 낱말이라도 다음 판엔 다른 장면이 나온다.
 */
export async function preloadWordScenes(words: string[]): Promise<void> {
  met.clear(); // 새 판이 시작된다 — 지난 판에서 만난 책은 지운다
  const need: string[] = [];
  for (const w of new Set(words)) {
    const entries = INDEX[w];
    if (!entries?.length) continue;
    const pick = entries[Math.floor(Math.random() * entries.length)];
    chosen.set(w, pick);
    if (!books.has(pick[0])) need.push(pick[0]);
  }
  await Promise.all(
    need.map((id) => {
      let p = inflight.get(id);
      if (!p) {
        p = apiGet<Storybook>(`/storybooks/${encodeURIComponent(id)}`)
          .then((sb) => books.set(id, sb ?? null))
          .catch(() => books.set(id, null))
          .finally(() => inflight.delete(id));
        inflight.set(id, p);
      }
      return p;
    })
  );
}

export interface PhonicsWordScene {
  illustrationUrl: string;
  pageNumber: number;
  pageText?: string;
  pageTtsUrl?: string;
  highlight?: string;
}

/**
 * 🔴 **마지막 순위 = 그 단원의 호리 한글 나무 동화**(2026-08-12 사용자).
 *
 * 파닉스 단원 자체가 8쪽짜리 그림책이다(`고기` 를 맞히면 호리가 "고~기!" 하고 두부가 침 삼키는 그 쪽).
 * 하지만 아이가 **이 단원에서 이미 본 이야기**라 다시 봐도 새로 만나는 게 아니다 — 이 기능의 목적은
 * 배운 낱말을 **다른 동화책**에서 만나게 하는 것이므로 그쪽이 1순위이고, 여기는 그게 없을 때의 폴백이다.
 *
 * 🔴 본문이 `고~기`·`아~이` 처럼 **물결로 늘여 쓴다**(소리 내어 읽히려고). 그대로 찾으면
 *    128개 중 4개를 놓친다 — 물결·가운뎃점을 지우고 본다.
 */
const stretched = (t: string) => t.replace(/[~〜･·・]/g, '');

export function pickUnitStoryScene(
  word: string,
  lang: Lang,
  unit: Storybook
): PhonicsWordScene | null {
  const pages = unit.pages ?? [];
  const hits: number[] = [];
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    if (!p?.illustrationUrl || !p.text) continue;
    if (stretched(p.text).includes(word)) hits.push(i);
  }
  if (!hits.length) return null;
  const i = hits[Math.floor(Math.random() * hits.length)];
  const p = pages[i];
  return {
    illustrationUrl: p.illustrationUrl!,
    pageNumber: i + 1,
    pageText: lang === 'ko' ? p.text : (p.translations?.[lang]?.text ?? p.text),
    pageTtsUrl: lang === 'ko' ? p.ttsUrl : p.translations?.[lang]?.ttsUrl,
    highlight: word,
  };
}

/** 맞힌 낱말 → 동화책 장면. 미리 받아 둔 것만 쓰므로 동기다(정답 소리 콜백 안에서 호출된다). */
export function pickPhonicsWordScene(word: string, lang: Lang = 'ko'): PhonicsWordScene | null {
  const entry = chosen.get(word);
  if (!entry) return null;
  const [bookId, pageNumber] = entry;
  const sb = books.get(bookId);
  if (!sb) return null;
  const page = sb.pages?.[pageNumber - 1];
  // 🔴 그림체별 삽화도 본다 — 자연관찰처럼 base 만 있는 책과 명작처럼 그림체별로 있는 책이 섞여 있다.
  const url =
    page?.illustrationUrl ??
    Object.values(sb.styleAssets ?? {}).find(
      (s) => s?.pageIllustrations?.[pageNumber]?.illustrationUrl
    )?.pageIllustrations?.[pageNumber]?.illustrationUrl;
  if (!url) return null;
  const pageText = lang === 'ko' ? page?.text : (page?.translations?.[lang]?.text ?? page?.text);
  const pageTtsUrl = lang === 'ko' ? page?.ttsUrl : page?.translations?.[lang]?.ttsUrl;
  remember(sb);
  return { illustrationUrl: url, pageNumber, pageText, pageTtsUrl, highlight: word };
}

/** 그 낱말에 보여 줄 동화책 쪽이 하나라도 있나 (프리로드와 무관한 정적 판정). */
export const hasPhonicsWordScene = (word: string) => !!INDEX[word]?.length;
