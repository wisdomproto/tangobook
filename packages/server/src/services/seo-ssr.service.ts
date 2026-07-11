/**
 * SEO SSR-lite — /library/:id/about 요청에 서버가 직접 meta/JSON-LD/본문을 주입한다.
 *
 * 배경: SPA 런타임 주입(BookSeoPage useEffect)은 네이버 Yeti 등 JS 미실행 크롤러에게
 * 보이지 않고, puppeteer prerender 는 배포 파이프라인에 미통합 상태였다(149권 전부
 * 범용 index.html 로 서빙 → canonical 이 홈 고정 = "홈 복사본 149장"). 서버는 이미
 * R2 저장소를 들고 있으므로 요청 시점에 head 치환 + #root 본문 주입이 가장 견고하다.
 * React 는 createRoot().render() 라 주입된 본문은 브라우저에서 자연히 교체된다.
 */
import type { Storybook, ReadingLevel } from '@tangobook/shared';

export const SITE_URL = 'https://www.tangobook.co.kr';

const LEVEL_INFO: Record<ReadingLevel, { label: string; age: string; min: number; max: number }> = {
  L1: { label: '씨앗', age: '3~4세', min: 3, max: 4 },
  L2: { label: '새싹', age: '4~6세', min: 4, max: 6 },
  L3: { label: '나무', age: '6~7세', min: 6, max: 7 },
};

export interface AboutSeo {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  jsonLdHtml: string;
  bodyHtml: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function summarize(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/[,;:\s]\S*$/, '') + '…';
}

/** 한글 파일명 등 non-ASCII URL 을 OG 스크레이퍼가 읽을 수 있게 percent-encode. */
function encodeUrl(url: string): string {
  if (!url) return '';
  try {
    return encodeURI(decodeURI(url)); // 이미 인코딩된 URL 이중 인코딩 방지
  } catch {
    return encodeURI(url);
  }
}

/** 마지막 한글 음절의 받침 유무에 따라 조사 선택 (이/가, 으로/로). */
function josa(word: string, withBatchim: string, noBatchim: string): string {
  const last = word.replace(/[^가-힣]+$/, '').slice(-1);
  if (!last) return noBatchim;
  const jong = (last.charCodeAt(0) - 0xac00) % 28;
  // 로/으로 는 ㄹ 받침(jong=8)이면 '로'
  if (noBatchim === '로' && jong === 8) return noBatchim;
  return jong > 0 ? withBatchim : noBatchim;
}

function pickKoreanWord(k: { korean?: string; name?: string }): string {
  const HANGUL = /[가-힣]/;
  const korean = (k.korean || '').trim();
  if (korean && HANGUL.test(korean)) return korean;
  const name = (k.name || '').trim();
  return HANGUL.test(name) ? name : '';
}

export function renderAboutSeo(storybook: Storybook): AboutSeo {
  const sb = storybook as Storybook & {
    key_objects?: Array<{ korean?: string; name?: string; definition?: string; example?: string }>;
  };
  const title = `${sb.title} 동화책 - 줄거리·교훈·읽어주기 팁 | 탱고북`;
  const overview = sb.parentGuide?.overview || `${sb.title} — 아이와 함께 읽는 동화책`;
  const description = summarize(overview);
  const canonical = `${SITE_URL}/library/${sb.id}/about`;
  const ogImage = encodeUrl(sb.coverImage || sb.coverImages?.[0]?.imageUrl || '');
  const level = sb.readingLevel ? LEVEL_INFO[sb.readingLevel] : null;
  const lessons = sb.parentGuide?.lessons ?? [];
  const tips = sb.parentGuide?.readingTips ?? [];
  const faqs = sb.parentGuide?.faq ?? [];
  const words = (sb.key_objects ?? [])
    .map((k) => ({ ko: pickKoreanWord(k), definition: k.definition, example: k.example }))
    .filter((w) => w.ko);

  // ── JSON-LD ────────────────────────────────────────────────────────────────
  const schemas: object[] = [];
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: sb.title,
    description: overview,
    url: canonical,
    image: ogImage || undefined,
    inLanguage: sb.languages?.length ? sb.languages : ['ko'],
    numberOfPages: sb.pages?.length,
    isAccessibleForFree: sb.isAccessibleForFree ?? true,
    publisher: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
    audience: level
      ? { '@type': 'PeopleAudience', suggestedMinAge: level.min, suggestedMaxAge: level.max }
      : undefined,
  });
  if (faqs.length) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '라이브러리', item: `${SITE_URL}/library` },
      {
        '@type': 'ListItem',
        position: 2,
        name: sb.category || '동화책',
        item: `${SITE_URL}/library?category=${encodeURIComponent(sb.category || '')}`,
      },
      { '@type': 'ListItem', position: 3, name: sb.title, item: canonical },
    ],
  });
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: sb.title,
    description: overview,
    url: canonical,
    educationalLevel: level?.label ?? '유아',
    educationalUse: '어휘 학습, 정서 발달, 함께 읽기',
    inLanguage: sb.languages?.length ? sb.languages : ['ko'],
    teaches: words.slice(0, 20).map((w) => w.ko),
    provider: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
  });
  const jsonLdHtml = schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n    ');

  // ── 본문 (JS 미실행 크롤러용 — 브라우저에선 React 가 교체) ─────────────────
  const t = escapeHtml(sb.title);
  const parts: string[] = [];
  parts.push(`<article><h1>${t} 동화책</h1>`);
  parts.push(`<p>${escapeHtml(overview)}</p>`);
  if (level)
    parts.push(`<p>추천 연령: ${level.age} (${level.label}) · ${sb.pages?.length ?? 0}쪽</p>`);
  if (lessons.length) {
    parts.push(
      `<h2>${t}${josa(sb.title, '이', '가')} 주는 교훈</h2><ul>${lessons.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`
    );
  }
  if (words.length) {
    parts.push(
      `<h2>${t}${josa(sb.title, '으로', '로')} 배우는 유아 단어</h2><ul>${words
        .map(
          (w) =>
            `<li><strong>${escapeHtml(w.ko)}</strong>${w.definition ? ` — ${escapeHtml(w.definition)}` : ''}</li>`
        )
        .join('')}</ul>`
    );
  }
  if (faqs.length) {
    parts.push(
      `<h2>자주 묻는 질문</h2>${faqs
        .map((f) => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`)
        .join('')}`
    );
  }
  if (tips.length) {
    parts.push(
      `<h2>${t} 읽어주기 팁 (4~7세)</h2><ul>${tips.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`
    );
  }
  parts.push(`<p><a href="/library/${sb.id}">${t} 지금 읽으러 가기 — 탱고북</a></p></article>`);

  return {
    title: escapeHtml(title),
    description: escapeHtml(description),
    canonical,
    ogImage,
    jsonLdHtml,
    bodyHtml: parts.join(''),
  };
}

/** 태그 하나를 치환(멀티라인 속성 허용). 못 찾으면 무시(주입 단계에서 append). */
function replaceTag(html: string, pattern: RegExp, replacement: string): string {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

const metaPattern = (attr: 'name' | 'property', key: string) =>
  new RegExp(`<meta\\s+${attr}="${key.replace(/[:]/g, '\\$&')}"\\s+content="[\\s\\S]*?"\\s*/?>`);
const metaPatternMultiline = (attr: 'name' | 'property', key: string) =>
  new RegExp(
    `<meta\\s*\\n?\\s*${attr}="${key.replace(/[:]/g, '\\$&')}"\\s*\\n?\\s*content="[\\s\\S]*?"\\s*\\n?\\s*/?>`
  );

export function injectAboutSeo(indexHtml: string, seo: AboutSeo): string {
  let html = indexHtml;

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${seo.title}</title>`);
  html = replaceTag(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${seo.canonical}" />`
  );

  const metas: Array<['name' | 'property', string, string]> = [
    ['name', 'description', seo.description],
    ['property', 'og:type', 'article'],
    ['property', 'og:url', seo.canonical],
    ['property', 'og:title', seo.title],
    ['property', 'og:description', seo.description],
    ['name', 'twitter:title', seo.title],
    ['name', 'twitter:description', seo.description],
  ];
  if (seo.ogImage) metas.push(['property', 'og:image', seo.ogImage]);

  for (const [attr, key, value] of metas) {
    const tag = `<meta ${attr}="${key}" content="${value}" />`;
    const single = metaPattern(attr, key);
    const multi = metaPatternMultiline(attr, key);
    if (single.test(html)) html = html.replace(single, tag);
    else if (multi.test(html)) html = html.replace(multi, tag);
    else html = html.replace('</head>', `  ${tag}\n  </head>`);
  }

  // 책 JSON-LD 는 사이트 Organization 스키마와 공존 — head 끝에 append
  html = html.replace('</head>', `  ${seo.jsonLdHtml}\n  </head>`);

  // 본문 — #root 안에 주입 (React createRoot 가 마운트 시 교체)
  html = html.replace('<div id="root"></div>', `<div id="root">${seo.bodyHtml}</div>`);

  return html;
}
