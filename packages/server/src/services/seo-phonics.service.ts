/**
 * 파닉스 단원 SEO — `/library/phonics/:track/about` 과 `/library/phonics/:track/:unitId/about`.
 *
 * 🔴 **파닉스에는 색인될 페이지가 없었다**(2026-08-27 감사). 홈 `<title>` 이
 *    「한글 파닉스 32단원 · 영어 파닉스 39단원」인데 sitemap 1,882개 중 파닉스 URL 은 **1개**였고,
 *    그 페이지(`/library/phonics/korean`)에서 뽑히는 본문은 **133자 내비 껍데기**였다.
 *    동화책에는 `/library/:id/about` 서피스가 있는데 **파닉스에는 그게 없었다** —
 *    간판으로 내건 제품이 검색에 존재하지 않았다.
 *
 * 🔴 **학습 화면(`/library/phonics/:track`)은 건드리지 않고 별도 주소를 판다.** 그 라우트는
 *    프리렌더 대상(`STATIC_ROUTES`)이라 정적 파일로 서빙되고, 아이용 UI 라 글이 원래 적다.
 *    글이 필요한 건 **부모와 크롤러**지 아이가 아니다.
 *
 * 🔴 **데이터는 커리큘럼 상수에서만 온다** — R2·DB 를 안 타므로 요청 시점에 실패할 구석이 없고,
 *    커리큘럼이 바뀌면 페이지가 따라 바뀐다(같은 걸 두 번 적지 않는다).
 */
import {
  PHONICS_TRACK_META,
  flattenPhonicsUnits,
  findPhonicsUnit,
  isPhonicsTrack,
  type PhonicsTrack,
  type FlatPhonicsUnit,
} from '@tangobook/shared';
import { SITE_URL, escapeHtml, summarize, type AboutSeo } from './seo-ssr.service.js';

/** shared 의 트랙 메타 그대로 재수출 — 서버 쪽 호출부가 shared 를 직접 안 봐도 되게. */
export { PHONICS_TRACK_META, flattenPhonicsUnits, findPhonicsUnit, isPhonicsTrack };
export type { PhonicsTrack, FlatPhonicsUnit };

const li = (items: string[]) => items.map((s) => `<li>${escapeHtml(s)}</li>`).join('');

const trackAboutUrl = (track: PhonicsTrack) => `${SITE_URL}/library/phonics/${track}/about`;

export function renderPhonicsUnitSeo(track: PhonicsTrack, unitId: string): AboutSeo | null {
  const units = flattenPhonicsUnits(track);
  const i = units.findIndex((u) => u.id === unitId);
  if (i < 0) return null;
  const u = units[i];
  const t = PHONICS_TRACK_META[track];
  const canonical = `${SITE_URL}/library/phonics/${track}/${u.id}/about`;

  const sounds = u.phonemes.join(' · ');
  // 한글은 만들어진 음절이, 영어는 낱말 패턴이 「무엇을 조합하는지」를 보여준다.
  const combos = u.syllables.length ? u.syllables : u.patterns;
  const words = u.sampleWords;

  const intro =
    `${t.label} ${u.position}단원 「${u.name}」입니다. ` +
    `${u.levelName} 과정(${u.levelDescription})에 속합니다. ` +
    (sounds ? `${sounds} 소리를 배우고, ` : '') +
    (combos.length ? `${combos.slice(0, 12).join(' ')} 를 만들어 보고, ` : '') +
    (words.length
      ? `${words.slice(0, 8).join(' · ')} 같은 낱말을 읽습니다.`
      : '읽기 활동으로 익힙니다.');

  const prev = units[i - 1];
  const next = units[i + 1];
  const navHtml =
    '<p>' +
    (prev
      ? `<a href="/library/phonics/${track}/${prev.id}/about">← ${escapeHtml(prev.name)}</a> · `
      : '') +
    `<a href="/library/phonics/${track}/about">${escapeHtml(t.label)} 전체 단원</a>` +
    (next
      ? ` · <a href="/library/phonics/${track}/${next.id}/about">${escapeHtml(next.name)} →</a>`
      : '') +
    '</p>';

  const schemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: `${t.label} ${u.position}단원 — ${u.name}`,
      description: intro,
      url: canonical,
      inLanguage: ['ko'],
      learningResourceType: 'Lesson',
      educationalLevel: u.levelName,
      teaches: [...u.phonemes, ...words].slice(0, 20).join(', '),
      provider: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
      audience: { '@type': 'PeopleAudience', suggestedMinAge: 4, suggestedMaxAge: 7 },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '탱고북', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: t.label, item: trackAboutUrl(track) },
        { '@type': 'ListItem', position: 3, name: u.name, item: canonical },
      ],
    },
  ];

  const bodyHtml =
    '<article>' +
    `<h1>${escapeHtml(t.label)} ${u.position}단원 — ${escapeHtml(u.name)}</h1>` +
    `<p>${escapeHtml(intro)}</p>` +
    (sounds ? `<h2>배우는 소리</h2><ul>${li(u.phonemes)}</ul>` : '') +
    (u.syllables.length
      ? `<h2>만드는 글자 (${u.syllables.length})</h2><ul>${li(u.syllables)}</ul>`
      : u.patterns.length
        ? `<h2>낱말 패턴</h2><ul>${li(u.patterns)}</ul>`
        : '') +
    (words.length ? `<h2>읽는 낱말 (${words.length})</h2><ul>${li(words)}</ul>` : '') +
    '<h2>이 단원에서 하는 것</h2>' +
    '<p>소리를 듣고 고르기, 글자를 손가락으로 따라 쓰기, 낱말과 그림 짝 맞추기를 합니다. ' +
    '맞힌 낱말은 그 낱말이 나오는 동화책 한 쪽으로 이어집니다.</p>' +
    `<p><a href="${t.learnBase}/${u.id}">이 단원 학습하기</a> · ` +
    '<a href="/worksheet/">인쇄용 활동지</a> · <a href="/library">동화책 보기</a></p>' +
    navHtml +
    '</article>';

  return {
    title: escapeHtml(`${u.name} — ${t.label} ${u.position}단원 | 탱고북`),
    description: escapeHtml(summarize(intro)),
    canonical,
    ogImage: `${SITE_URL}/og-image.png`,
    jsonLdHtml: schemas
      .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
      .join('\n    '),
    bodyHtml,
    alternatesHtml: '',
  };
}

export function renderPhonicsTrackSeo(track: PhonicsTrack): AboutSeo {
  const t = PHONICS_TRACK_META[track];
  const units = flattenPhonicsUnits(track);
  const canonical = trackAboutUrl(track);
  const intro =
    `${t.label} ${units.length}단원 전체 목록입니다. ` +
    `${t.soundNoun}부터 시작해 단원마다 새 소리를 하나씩 익히고, 그 소리로 낱말을 읽습니다. ` +
    '배운 낱말은 탱고북 동화책에 그대로 나오기 때문에, 글자 공부가 곧 그날의 읽기가 됩니다.';

  // 레벨별로 묶는다 — 커리큘럼의 단계가 곧 부모가 이해할 순서다.
  const byLevel = new Map<string, FlatPhonicsUnit[]>();
  for (const u of units) {
    if (!byLevel.has(u.levelName)) byLevel.set(u.levelName, []);
    byLevel.get(u.levelName)!.push(u);
  }
  const sections = [...byLevel.entries()]
    .map(
      ([levelName, list]) =>
        `<h2>${escapeHtml(levelName)} (${list.length}단원)</h2><ul>` +
        list
          .map(
            (u) =>
              `<li><a href="/library/phonics/${track}/${u.id}/about">${u.position}단원 — ${escapeHtml(u.name)}</a></li>`
          )
          .join('') +
        '</ul>'
    )
    .join('');

  const schemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: `${t.label} ${units.length}단원`,
      description: intro,
      url: canonical,
      inLanguage: ['ko'],
      provider: { '@type': 'Organization', name: '탱고북', url: SITE_URL },
      audience: { '@type': 'PeopleAudience', suggestedMinAge: 4, suggestedMaxAge: 7 },
      hasPart: units.map((u) => ({
        '@type': 'LearningResource',
        name: u.name,
        url: `${SITE_URL}/library/phonics/${track}/${u.id}/about`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '탱고북', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: t.label, item: canonical },
      ],
    },
  ];

  return {
    title: escapeHtml(`${t.label} ${units.length}단원 — 4~7세 커리큘럼 | 탱고북`),
    description: escapeHtml(summarize(intro)),
    canonical,
    ogImage: `${SITE_URL}/og-image.png`,
    jsonLdHtml: schemas
      .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
      .join('\n    '),
    bodyHtml:
      `<article><h1>${escapeHtml(t.label)} ${units.length}단원</h1><p>${escapeHtml(intro)}</p>` +
      sections +
      `<p><a href="${t.learnBase}">${escapeHtml(t.label)} 시작하기</a> · ` +
      '<a href="/worksheet/">인쇄용 활동지</a> · <a href="/library">동화책 보기</a></p></article>',
    alternatesHtml: '',
  };
}
