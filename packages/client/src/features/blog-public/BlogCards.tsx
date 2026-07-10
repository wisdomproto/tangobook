// 공개 블로그 카드 렌더 — mkt_blog_cards(card_type + content JSONB) → HTML.
// 본문은 저작도구에서 만든 신뢰 콘텐츠라 text/quote/list 는 dangerouslySetInnerHTML.
import type { BlogCardData } from './api';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

// 이미지 URL 안전 인코딩. 저장된 URL 이 이미 퍼센트 인코딩(%EA…)돼 있으면 그대로 쓰고
// (encodeURI 하면 %→%25 이중 인코딩 → 404), 한글 등 raw 문자면 인코딩한다.
function safeSrc(u: string): string {
  try {
    if (decodeURI(u) !== u) return u; // 이미 인코딩됨
  } catch {
    return u; // 깨진 인코딩 — 원본 유지
  }
  return encodeURI(u);
}

export function BlogCards({ cards }: { cards: BlogCardData[] }) {
  return (
    <div className="blog-prose space-y-5">
      {cards.map((c, i) => {
        const ct = c.content ?? {};
        if (c.type === 'divider') return <hr key={i} className="my-8 border-ink/10" />;

        if (c.type === 'image') {
          const url = str(ct.url) || str(ct.image_url);
          if (!url) return null;
          return (
            <figure key={i} className="my-6">
              <img
                src={safeSrc(url)}
                alt={str(ct.alt)}
                loading="lazy"
                className="w-full rounded-2xl"
              />
              {str(ct.caption) && (
                <figcaption className="mt-2 text-center text-sm text-ink/50 break-keep">
                  {str(ct.caption)}
                </figcaption>
              )}
            </figure>
          );
        }

        if (c.type === 'quote') {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-coral pl-4 italic text-ink/80 break-keep"
              dangerouslySetInnerHTML={{ __html: str(ct.html) || str(ct.text) }}
            />
          );
        }

        if (c.type === 'list' && Array.isArray(ct.items)) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-6 break-keep">
              {(ct.items as unknown[]).map((it, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: str(it) }} />
              ))}
            </ul>
          );
        }

        // text (기본) / list(문자열) — 저작 HTML 그대로.
        // 마케팅 블로그 카드는 card_type='text' 이면서 content 에 삽화 url 을 함께 담는다
        // (텍스트+삽화 결합 카드). html 아래에 이미지가 있으면 같이 렌더.
        const html = str(ct.html) || str(ct.text);
        const imgUrl = str(ct.url) || str(ct.image_url);
        if (!html && !imgUrl) return null;
        return (
          <div key={i} className="space-y-4">
            {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
            {imgUrl && (
              <figure className="my-2">
                <img
                  src={safeSrc(imgUrl)}
                  alt={str(ct.alt)}
                  loading="lazy"
                  className="w-full rounded-2xl"
                />
                {str(ct.caption) && (
                  <figcaption className="mt-2 text-center text-sm text-ink/50 break-keep">
                    {str(ct.caption)}
                  </figcaption>
                )}
              </figure>
            )}
          </div>
        );
      })}
    </div>
  );
}
