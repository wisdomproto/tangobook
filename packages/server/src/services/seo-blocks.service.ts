import { SITE_URL, escapeHtml, type AboutSeo } from './seo-ssr.service.js';

const description =
  '화면 블록으로 먼저 해 보고, 한글·영어 실물 블록이 있으면 카메라로 연결해 같은 파닉스 낱말 게임을 해 보세요.';

export type BlockTrack = 'hangul' | 'english';

const TRACKS: Record<
  BlockTrack,
  { title: string; shortTitle: string; description: string; phonicsPath: string }
> = {
  hangul: {
    title: '한글 블록 게임 — 자음·모음 온라인 놀이와 카메라 연결 | 탱고북',
    shortTitle: '한글 블록 놀이',
    description:
      '자음과 모음을 화면 블록으로 조합하거나 실물 한글 블록을 카메라로 연결해 음절과 낱말을 만들어 보세요.',
    phonicsPath: '/library/phonics/korean',
  },
  english: {
    title: '영어 파닉스 블록 게임 — 알파벳 온라인 놀이와 카메라 연결 | 탱고북',
    shortTitle: '영어 파닉스 블록 놀이',
    description:
      '알파벳을 화면 블록으로 이어 보거나 실물 영어 블록을 카메라로 연결해 파닉스 소리와 낱말을 익혀 보세요.',
    phonicsPath: '/library/phonics/english',
  },
};

export function renderBlocksSeo(): AboutSeo {
  const url = `${SITE_URL}/blocks`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '탱고북 한글·영어 파닉스 블록 놀이',
    description,
    url,
    hasPart: [
      { '@type': 'Game', name: '한글 블록 놀이', url: `${SITE_URL}/blocks/hangul` },
      { '@type': 'Game', name: '영어 파닉스 블록 놀이', url: `${SITE_URL}/blocks/english` },
    ],
  };
  return {
    title: '한글·영어 파닉스 블록 게임 — 온라인·실물 블록 카메라 연결 | 탱고북',
    description: escapeHtml(description),
    canonical: url,
    ogImage: `${SITE_URL}/og-image.png`,
    jsonLdHtml: `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`,
    bodyHtml:
      '<article><h1>한글·영어 파닉스 블록 놀이</h1>' +
      `<p>${escapeHtml(description)}</p>` +
      '<h2>화면에서 시작하고, 손으로 이어서</h2>' +
      '<p>화면 블록을 끌어 글자와 소리를 익힌 뒤, 실물 블록은 카메라로 연결할 수 있습니다.</p>' +
      '<ul>' +
      '<li><a href="/blocks/hangul?mode=screen">한글 화면 블록 게임</a> · <a href="/blocks/hangul?mode=camera">한글 실물 블록 카메라 연결</a></li>' +
      '<li><a href="/blocks/english?mode=screen">영어 화면 블록 게임</a> · <a href="/blocks/english?mode=camera">영어 실물 블록 카메라 연결</a></li>' +
      '</ul>' +
      '<p><a href="/library/phonics">한글·영어 파닉스 전체 보기</a> · <a href="/activity">온라인·인쇄 활동지 보기</a></p></article>',
    alternatesHtml: '',
  };
}

export function renderBlockTrackSeo(track: BlockTrack): AboutSeo {
  const info = TRACKS[track];
  const path = `/blocks/${track}`;
  const url = `${SITE_URL}${path}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: info.shortTitle,
    description: info.description,
    url,
    educationalUse: '파닉스 및 초기 문해 학습',
  };

  return {
    title: info.title,
    description: escapeHtml(info.description),
    canonical: url,
    ogImage: `${SITE_URL}/og-image.png`,
    jsonLdHtml: `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`,
    bodyHtml:
      `<article><h1>${escapeHtml(info.shortTitle)}</h1>` +
      `<p>${escapeHtml(info.description)}</p>` +
      '<h2>두 가지 방법으로 놀아요</h2>' +
      `<ul><li><a href="${path}?mode=screen">화면 블록으로 시작</a></li>` +
      `<li><a href="${path}?mode=camera">실물 블록 카메라 연결</a></li></ul>` +
      `<p><a href="${info.phonicsPath}">관련 파닉스 단원 보기</a> · <a href="/blocks">블록 놀이 전체 보기</a></p></article>`,
    alternatesHtml: '',
  };
}
