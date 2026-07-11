import { useEffect } from 'react';

// 🔴 canonical 은 항상 정식 www 호스트 고정 — localhost origin 을 쓰면 prerender 로
// 구운 HTML 의 canonical 이 localhost 로 오염된다(JS 미실행 크롤러가 그대로 읽음).
const SITE_URL = 'https://www.tangobook.co.kr';

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface SeoOptions {
  title?: string;
  description?: string;
  /** absolute or path */
  image?: string;
  /** path; will be joined with SITE_URL */
  path?: string;
  type?: 'website' | 'article' | 'book' | 'profile';
  /** 추가 JSON-LD schema 들. 각 entry 는 별도 <script> 로 등록. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  noindex?: boolean;
  keywords?: string;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function absUrl(image?: string): string | undefined {
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('/')) return `${SITE_URL}${image}`;
  return image;
}

let mountedJsonLdIds: string[] = [];

function setJsonLd(items: Array<Record<string, unknown>>) {
  if (typeof document === 'undefined') return;
  // 이전 useSeo 가 마운트한 것만 지움 (BookSeoPage 등 별도 id 는 보존)
  mountedJsonLdIds.forEach((id) => {
    const el = document.querySelector(`script[data-seo-jsonld="${id}"]`);
    if (el) el.remove();
  });
  mountedJsonLdIds = [];

  items.forEach((data, i) => {
    const id = `auto-${i}`;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-jsonld', id);
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    mountedJsonLdIds.push(id);
  });
}

/**
 * 페이지 진입 시 title / description / og / twitter / canonical / json-ld 를 동적으로 갱신.
 * SPA 라 검색엔진 일부는 JS 실행 후 메타를 읽음 (Google 은 OK, 일부 social crawler 는 OG 만).
 * index.html 의 fallback 메타 + 이 hook 의 동적 메타가 양쪽 다 동작.
 */
export function useSeo(opts: SeoOptions) {
  const { title, description, image, path, type = 'website', jsonLd, noindex, keywords } = opts;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const fullTitle = title || document.title;
    const url = path ? `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}` : SITE_URL;
    const img = absUrl(image) || DEFAULT_OG_IMAGE;

    if (title) document.title = title;
    if (description) setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    // Open Graph
    setMeta('og:type', type, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:title', fullTitle, 'property');
    if (description) setMeta('og:description', description, 'property');
    setMeta('og:image', img, 'property');

    // Twitter
    setMeta('twitter:card', img ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', fullTitle);
    if (description) setMeta('twitter:description', description);
    setMeta('twitter:image', img);

    // Canonical
    setLink('canonical', url);

    // JSON-LD
    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      setJsonLd(items);
    } else {
      setJsonLd([]);
    }

    return () => {
      // hook 이 unmount 되면 추가한 JSON-LD 정리 (다음 페이지에 잔존 방지)
      setJsonLd([]);
    };
  }, [title, description, image, path, type, JSON.stringify(jsonLd), noindex, keywords]);
}

export const SEO_SITE_URL = SITE_URL;
