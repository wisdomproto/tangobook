import { useState } from 'react';
import type { Storybook } from '@tangobook/shared';
import { Link } from 'react-router-dom';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { thumbUrl } from '@/design-system/primitives/BookCover';

/**
 * 블로그 글 안에서 **그 단원의 동화 첫 장면들**을 보여주는 상자.
 *
 * 🔴 자랑할 거리가 데이터에 이미 있다 — 파닉스 단원 32개는 각각 「한글 나무」 8쪽 그림책을
 *    품고 있고(삽화 256장), 그게 storybook `pages[]` 그대로다. 그래서 블로그가 따로 이미지를
 *    들고 있지 않는다 — 단원 id 하나로 32편이 전부 동작한다.
 * 🔴 앞 3쪽만 보여준다 — 다 보여주면 앱에 갈 이유가 없다.
 * ⚠️ 뷰어(`/viewer/:id`)는 게스트에게 잠금 화면을 띄운다. 그게 곧 가입 유도라 그대로 보낸다.
 */
const PEEK_PAGES = 3;

/**
 * 🔴 쪽 삽화 원본은 **4.4MB PNG** 인데 여기선 188px 로 그린다 — 세 장이면 13MB 다.
 *    표지와 같은 `thumbs/512` 규칙으로 먼저 받고, 아직 안 구운 삽화만 404 뒤 원본으로 내려간다.
 *    (굽기: `generate-cover-thumbs.mjs --prefix=comic-assets/hangeul-tree- --apply`)
 */
function StoryImage({ src, alt }: { src: string; alt: string }) {
  const [full, setFull] = useState(false);
  const thumb = full ? null : thumbUrl(src);
  return (
    <img
      src={thumb ?? src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => thumb && setFull(true)}
      className="aspect-square w-full rounded-2xl object-cover"
    />
  );
}

export function PhonicsStoryPeek({ unitId }: { unitId: string }) {
  const book = useStorybook(unitId).data as Storybook | undefined;
  const pages = (book?.pages ?? []).filter((p) => p.illustrationUrl).slice(0, PEEK_PAGES);
  if (pages.length < PEEK_PAGES) return null; // 삽화가 덜 붙은 단원은 조용히 접는다

  return (
    <div className="my-7 overflow-hidden rounded-[26px] border border-mint-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3">
        <span className="text-sm font-bold text-ink-800 break-keep">
          이 단원에는 동화도 한 편 있습니다
        </span>
        <span className="shrink-0 rounded-full bg-mint-100 px-3 py-1 text-[11px] font-bold text-mint-600">
          8쪽 그림책
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-3">
        {pages.map((p, i) => (
          <figure key={i} className="min-w-0">
            <StoryImage src={p.illustrationUrl!} alt={`${book?.title ?? ''} ${i + 1}쪽`} />
            <figcaption className="mt-2 text-[13px] leading-relaxed text-ink-600 break-keep line-clamp-3">
              {p.text}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 bg-cream-50 px-5 py-4 text-center">
        <p className="text-xs text-ink-500 break-keep">
          글자만 외우는 단원이 아닙니다. 호리와 두부가 한글 나무에서 오늘의 글자를 찾는 이야기로
          시작합니다.
        </p>
        <Link
          to={`/viewer/${unitId}`}
          className="rounded-full bg-mint-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-mint-600"
        >
          동화 읽어보기 →
        </Link>
      </div>
    </div>
  );
}
