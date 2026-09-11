import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { KeyObject, Lang, Storybook } from '@tangobook/shared';
import type { ColoringItem } from '../components/players/ColoringPlayer';

/**
 * 색칠 도안 — 두 파일로 나눠 받는다.
 *
 * 🔴 `manifest.json` 은 **920KB** 라 학습 화면이 카드를 그리자고 받을 수 없다. 그래서
 *    「이 책에 도안이 있나」는 `book-index.json`(책 id → 도안 낱말, 수십 KB)만 보고 답하고,
 *    도안 목록은 **색칠을 실제로 열 때** manifest 에서 걸러 쓴다. 둘 다 굽는 곳은
 *    `packages/server/scripts/build-coloring-manifest.mjs` 한 곳이다.
 *
 * 🔴 **카드 판정과 도안 목록은 같은 규칙을 쓴다**(`coloringLabel`) — 각자 세면 카드는 뜨는데
 *    열어 보니 빈 화면이 된다. 실측: 라벨을 붙일 수 있는 도안이 ko·en 1,705/1,736,
 *    vi 1,227 · zh·th 1,237 이고 **vi·zh·th 는 87권이 0장**이다.
 */
interface ColoringSheet {
  key: string;
  group: string;
  section: string;
  unitId: string;
  word: string;
  language?: 'korean' | 'english' | 'zh';
  lineartUrl: string;
  answerUrl?: string | null;
  originalUrl?: string | null;
  ttsUrl?: string | null;
}

/** 책 id → 그 책 도안의 낱말들(도안을 구울 때 적힌 그대로). */
export type ColoringBookIndex = Record<string, string[]>;

/** 책 색인. 없으면 빈 객체(색칠 카드가 안 뜰 뿐, 화면은 멀쩡). */
export function useColoringBookIndex(): ColoringBookIndex {
  const { data } = useQuery({
    queryKey: ['coloring', 'book-index'],
    queryFn: async (): Promise<ColoringBookIndex> => {
      const res = await fetch('/coloring/book-index.json');
      if (!res.ok) throw new Error(`coloring book-index ${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
  return data ?? {};
}

const norm = (v?: string | null) => (v ?? '').trim().toLowerCase();

/**
 * 도안 낱말 → 그 책의 key_object.
 *
 * 🔴 도안 `word` 는 한국어라는 보장이 없다 — 작업판을 구울 때 `name` 이 한국어인 책(개구리 왕자
 *    `name: 공`)은 `objectName`(`Ball`)과 매칭이 빗나가 **영어가 그대로 박혔다**. 그래서
 *    `korean`·`name`·`nameEn` 셋을 다 본다. 셋 다 안 맞으면(책에서 그 낱말이 빠진 31장) 쓰지 않는다.
 */
export function findSheetKeyObject(
  book: Storybook | undefined,
  word: string
): KeyObject | undefined {
  const kos = book?.key_objects ?? [];
  const w = norm(word);
  return (
    kos.find((k) => norm(k.korean) === w) ??
    kos.find((k) => norm(k.name) === w) ??
    kos.find((k) => norm(k.nameEn) === w)
  );
}

/**
 * 그 언어로 도안에 붙일 낱말. 없으면 `null` — 그 도안은 그 언어에선 **안 쓴다**.
 * 🔴 다른 언어 낱말로 때우지 않는다(학습자 화면은 한 언어만 — 단일 언어 표시 정책).
 */
export function coloringLabel(ko: KeyObject | undefined, lang: Lang): string | null {
  if (!ko) return null;
  if (lang === 'ko') return ko.korean?.trim() || null;
  if (lang === 'en') {
    // 영어는 번역 칸이 비어도 `nameEn`·영어 `name` 이 있다(전래동화는 로마자 — 영어 화면이 원래 그렇게 보인다).
    const name = ko.name?.trim() ?? '';
    const englishName = /[a-z]/i.test(name) && !/[가-힣]/.test(name) ? name : '';
    return (ko.nameTranslations?.en || ko.nameEn || englishName).trim() || null;
  }
  return ko.nameTranslations?.[lang]?.trim() || null;
}

/** 그 책·그 언어에서 쓸 수 있는 도안 수 — 카드 노출 판정. */
export function countColoringSheets(
  words: string[] | undefined,
  book: Storybook | undefined,
  lang: Lang
): number {
  if (!words?.length || !book) return 0;
  return words.filter((w) => coloringLabel(findSheetKeyObject(book, w), lang)).length;
}

const TTS_LANGUAGE: Record<Lang, NonNullable<ColoringItem['language']>> = {
  ko: 'korean',
  en: 'english',
  vi: 'vi',
  zh: 'zh',
  th: 'th',
};

/**
 * 그 책의 도안 목록 — 라벨·음원·칭찬을 **보고 있는 언어**로 붙인다. 도안 그림 자체는 언어와 무관하다.
 *
 * 🔴 **`useMemo` 필수** — `ColoringPlayer` 는 `items[idx]` 가 바뀌면 도안을 새로 불러오는데,
 *    매 렌더 새 배열을 넘기면 부모가 한 번 다시 그려질 때마다 **방금 칠한 그림이 흰 종이로 밀린다**.
 * 🔴 정답본은 안 굽는 게 정책이라 색 출처는 **원본 삽화**다(`ColoringItem.colorSourceUrl` 주석 참조).
 * 🔴 음원 — ko 는 저작 음원·음절 합성, en 은 합성 경로가 있다. **vi·zh·th 는 직행 음원만**
 *    (`key_objects[].ttsUrls[lang]`, 라벨 있는 도안의 96%) — 없으면 소리 없이 칠한다(점잇기와 같다).
 */
export function useColoringItems(
  book: Storybook | undefined,
  lang: Lang,
  enabled: boolean
): { items: ColoringItem[]; loading: boolean } {
  const bookId = book?.id;
  const { data, isLoading } = useQuery({
    queryKey: ['coloring', 'manifest'],
    queryFn: async (): Promise<ColoringSheet[]> => {
      const res = await fetch('/coloring/manifest.json');
      if (!res.ok) throw new Error(`coloring manifest ${res.status}`);
      return res.json();
    },
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: enabled && !!bookId,
    retry: 1,
  });

  const items = useMemo(() => {
    if (!data || !book || !bookId) return [];
    return data
      .filter((s) => String(s.unitId) === bookId)
      .flatMap((s): ColoringItem[] => {
        const ko = findSheetKeyObject(book, s.word);
        const word = coloringLabel(ko, lang);
        const colorSourceUrl = s.answerUrl ?? s.originalUrl ?? '';
        if (!word || !colorSourceUrl) return [];
        const ttsUrl =
          lang === 'ko' ? (ko?.ttsUrl ?? s.ttsUrl ?? null) : (ko?.ttsUrls?.[lang] ?? null);
        return [
          {
            word,
            lineartUrl: s.lineartUrl,
            colorSourceUrl,
            originalUrl: s.originalUrl ?? null,
            ttsUrl,
            storybookId: bookId,
            language: TTS_LANGUAGE[lang],
            lang,
          },
        ];
      });
  }, [data, book, bookId, lang]);

  return { items, loading: isLoading };
}
