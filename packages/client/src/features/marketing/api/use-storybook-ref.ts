import { useQuery } from '@tanstack/react-query';

/**
 * 동화책(메인 앱) 캐릭터 레퍼런스 조회 — 카드뉴스 AI 이미지 생성 시
 * 캐릭터 일관성용 레퍼런스 이미지를 패널에 노출하기 위함.
 *
 * 마케팅 콘텐츠는 `memo='storybook:<id>'` 로 동화책과 연결된다. 명작(classic)
 * 동화책만 캐릭터가 있으므로 호출부에서 enabled 로 분기한다.
 * `GET /api/storybooks/:id` (메인 앱 API, 동일 오리진) 를 직접 fetch.
 */
export interface StorybookCharacterRef {
  name: string;
  role?: string;
  description?: string;
  /** 캐릭터 레퍼런스 이미지 (encodeURI 적용). */
  referenceImage?: string;
}

export interface StorybookRef {
  title: string;
  artStyle?: string;
  characters: StorybookCharacterRef[];
}

/** `memo` 가 `storybook:<id>` 형태면 id 를, 아니면 null. */
export function storybookIdFromMemo(memo: string | null | undefined): string | null {
  if (!memo) return null;
  return memo.startsWith('storybook:') ? memo.slice('storybook:'.length) : null;
}

export function useStorybookRef(storybookId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['storybook-ref', storybookId],
    enabled: !!storybookId && enabled,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<StorybookRef> => {
      const res = await fetch(`/api/storybooks/${storybookId}`);
      if (!res.ok) throw new Error(`storybook ${res.status}`);
      const json = await res.json();
      const s = json?.data ?? {};
      const characters: StorybookCharacterRef[] = (s.characters ?? [])
        .filter((c: { name?: string }) => c?.name)
        .map(
          (c: { name: string; role?: string; description?: string; referenceImage?: string }) => ({
            name: c.name,
            role: c.role,
            description: c.description,
            referenceImage: c.referenceImage ? encodeURI(c.referenceImage) : undefined,
          })
        );
      return { title: s.title ?? '', artStyle: s.artStyle, characters };
    },
  });
}
