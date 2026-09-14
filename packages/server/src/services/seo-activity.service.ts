/**
 * 활동 모음 SSR — `/activity` · `/activity/{hangul,english}/:unitId` · `/activity/{coloring,hidden-object}/:slug`.
 * 스펙: docs/superpowers/specs/2026-09-14-activity-hub-design.md
 * 🔴 목록은 shared `activity-catalog` 로만 파생한다(클라·sitemap·IndexNow 와 같은 함수).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABEL,
  coloringItems,
  findActivity,
  flattenPhonicsUnits,
  hiddenObjectItems,
  worksheetItems,
  type ActivityItem,
  type ActivityKind,
  type ColoringCatalogEntry,
  type HiddenObjectCatalogEntry,
} from '@tangobook/shared';
import { SITE_URL, escapeHtml, summarize, type AboutSeo } from './seo-ssr.service.js';

export interface ActivityCatalog {
  items: Record<ActivityKind, ActivityItem[]>;
  hiddenWords: Map<string, string[]>;
}

export function buildCatalog(
  coloring: ColoringCatalogEntry[],
  hidden: HiddenObjectCatalogEntry[]
): ActivityCatalog {
  return {
    items: {
      hangul: worksheetItems('hangul'),
      english: worksheetItems('english'),
      coloring: coloringItems(coloring),
      'hidden-object': hiddenObjectItems(hidden),
    },
    hiddenWords: new Map(hidden.map((h) => [h.key, h.words])),
  };
}

let cached: ActivityCatalog | null = null;

/** 운영 = `clientDist/activity-data`, 개발(dist 없음) = `packages/client/public/activity-data`. 프로세스 수명 캐시. */
export function loadActivityCatalog(clientDist: string): ActivityCatalog {
  if (cached) return cached;
  const dirs = [
    path.join(clientDist, 'activity-data'),
    path.join(process.cwd(), 'packages/client/public/activity-data'),
  ];
  const dir = dirs.find((d) => fs.existsSync(path.join(d, 'coloring.json'))) ?? dirs[0];
  const read = <T>(f: string): T[] => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as T[];
    } catch {
      return [];
    }
  };
  cached = buildCatalog(
    read<ColoringCatalogEntry>('coloring.json'),
    read<HiddenObjectCatalogEntry>('hidden-object.json')
  );
  return cached;
}

const enc = (p: string) =>
  p
    .split('/')
    .map((s, i) => (i < 3 ? s : encodeURIComponent(s)))
    .join('/');
const abs = (u?: string) =>
  !u ? `${SITE_URL}/og-image.png` : u.startsWith('/') ? `${SITE_URL}${u}` : u;
const li = (xs: string[]) => xs.map((s) => `<li>${escapeHtml(s)}</li>`).join('');

function titleOf(item: ActivityItem): string {
  switch (item.kind) {
    case 'coloring':
      return item.sourceHref.startsWith('/library/') &&
        !item.sourceHref.startsWith('/library/phonics')
        ? `${item.title} 색칠도안 — ${item.section} | 탱고북`
        : `${item.title} 색칠도안 무료 인쇄 · 온라인 색칠공부 | 탱고북`;
    case 'hidden-object':
      return `${item.title} 숨은그림찾기 도안 무료 인쇄 · 온라인 게임 | 탱고북`;
    case 'hangul':
      return `${item.title} 한글 학습지 무료 인쇄 | 탱고북`;
    case 'english':
      return `${item.title} 영어 파닉스 학습지 무료 인쇄 | 탱고북`;
  }
}

function introOf(
  item: ActivityItem,
  catalog: ActivityCatalog
): { intro: string; listHtml: string } {
  if (item.kind === 'coloring') {
    return {
      intro: `「${item.title}」 색칠도안입니다. A4 로 인쇄해 색연필로 칠하거나, 온라인에서 바로 색을 골라 칠할 수 있어요. 가입 없이 무료입니다.`,
      listHtml: '',
    };
  }
  if (item.kind === 'hidden-object') {
    const words = catalog.hiddenWords.get(item.key) ?? [];
    return {
      intro: `「${item.title}」 그림 속에 숨은 ${words.length}가지를 찾는 숨은그림찾기입니다. 인쇄해서 찾거나 온라인에서 눌러 찾을 수 있어요.`,
      listHtml: `<h2>찾을 것</h2><ul>${li(words)}</ul>`,
    };
  }
  const track = item.kind === 'hangul' ? 'korean' : 'english';
  const u = flattenPhonicsUnits(track).find((x) => x.id === item.key);
  const combos = u ? (u.syllables.length ? u.syllables : u.patterns) : [];
  return {
    intro: `${ACTIVITY_KIND_LABEL[item.kind]} 「${item.title}」(${item.group})입니다. 집에서 A4 로 뽑아 연필로 쓰고, 같은 단원을 온라인에서 소리와 함께 해볼 수 있어요.`,
    listHtml:
      (u?.phonemes.length ? `<h2>배우는 소리</h2><ul>${li(u.phonemes)}</ul>` : '') +
      (combos.length ? `<h2>만드는 글자</h2><ul>${li(combos.slice(0, 30))}</ul>` : '') +
      (u?.sampleWords.length ? `<h2>읽는 낱말</h2><ul>${li(u.sampleWords)}</ul>` : ''),
  };
}

export function renderActivitySeo(
  kind: ActivityKind,
  segment: string,
  catalog: ActivityCatalog
): AboutSeo | { redirect: string } | null {
  const found = findActivity(kind, catalog.items[kind], segment);
  if (!found) return null;
  const { item, canonical } = found;
  if (!canonical) return { redirect: enc(item.path) };

  const { intro, listHtml } = introOf(item, catalog);
  const siblings = catalog.items[kind]
    .filter((i) => i.group === item.group && i.key !== item.key)
    .slice(0, 40);
  const url = `${SITE_URL}${enc(item.path)}`;
  const bodyHtml =
    '<article>' +
    `<h1>${escapeHtml(item.title)} — ${escapeHtml(ACTIVITY_KIND_LABEL[kind])}</h1>` +
    `<p>${escapeHtml(intro)}</p>` +
    (item.blurb ? `<p>${escapeHtml(item.blurb)}</p>` : '') +
    listHtml +
    `<p><a href="${escapeHtml(item.sourceHref)}">${escapeHtml(item.sourceLabel)}</a> · <a href="/">탱고북 둘러보기</a> · <a href="/activity">활동 모음</a></p>` +
    (siblings.length
      ? `<h2>${escapeHtml(item.group)} 더 보기</h2><ul>${siblings
          .map((s) => `<li><a href="${enc(s.path)}">${escapeHtml(s.title)}</a></li>`)
          .join('')}</ul>`
      : '') +
    '</article>';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: item.title,
    description: intro,
    url,
    isAccessibleForFree: true,
    inLanguage: 'ko',
    provider: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
  };
  return {
    title: escapeHtml(titleOf(item)),
    description: escapeHtml(summarize(`${intro} ${item.blurb ?? ''}`)),
    canonical: url,
    ogImage: abs(item.image),
    jsonLdHtml: `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
    bodyHtml,
    alternatesHtml: '',
  };
}

export function renderActivityHubSeo(catalog: ActivityCatalog): AboutSeo {
  const intro =
    '인쇄해서 하고, 온라인에서도 바로 하는 무료 활동 모음 — 색칠도안 · 숨은그림찾기 · 한글 학습지 · 영어 파닉스 학습지.';
  const sections = ACTIVITY_KINDS.map((k) => {
    const items = catalog.items[k];
    const first = items[0];
    return (
      `<h2>${escapeHtml(ACTIVITY_KIND_LABEL[k])} (${items.length})</h2>` +
      (first
        ? `<p><a href="${enc(first.path)}">${escapeHtml(ACTIVITY_KIND_LABEL[k])} 시작하기</a></p>`
        : '') +
      `<ul>${items
        .slice(0, 20)
        .map((i) => `<li><a href="${enc(i.path)}">${escapeHtml(i.title)}</a></li>`)
        .join('')}</ul>`
    );
  }).join('');
  const url = `${SITE_URL}/activity`;
  return {
    title: escapeHtml('무료 색칠도안 · 숨은그림찾기 · 한글/영어 학습지 | 탱고북'),
    description: escapeHtml(intro),
    canonical: url,
    ogImage: `${SITE_URL}/og-image.png`,
    jsonLdHtml: `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '탱고북 활동 모음',
      url,
    })}</script>`,
    bodyHtml: `<article><h1>활동 모음</h1><p>${escapeHtml(intro)}</p>${sections}<p><a href="/">탱고북 둘러보기</a></p></article>`,
    alternatesHtml: '',
  };
}
