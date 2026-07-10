// 공개 블로그 카드 렌더 — mkt_blog_cards(card_type + content JSONB) → HTML.
// 본문은 저작도구에서 만든 신뢰 콘텐츠라 text/quote/list 는 dangerouslySetInnerHTML.
import type { BlogCardData } from './api';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
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
                src={encodeURI(url)}
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
        const html = str(ct.html) || str(ct.text);
        if (!html) return null;
        return <div key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}
