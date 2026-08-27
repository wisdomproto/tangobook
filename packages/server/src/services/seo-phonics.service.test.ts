import { describe, it, expect } from 'vitest';
import {
  flattenPhonicsUnits,
  findPhonicsUnit,
  isPhonicsTrack,
  renderPhonicsUnitSeo,
  renderPhonicsTrackSeo,
} from './seo-phonics.service.js';
import { injectAboutSeo } from './seo-ssr.service.js';

const INDEX_HTML = `<!doctype html>
<html lang="ko">
  <head>
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="https://www.tangobook.co.kr/" />
    <link rel="alternate" hreflang="ko" href="https://www.tangobook.co.kr/" />
    <title>탱고북</title>
    <meta name="description" content="x" />
  </head>
  <body><div id="root"></div></body>
</html>`;

/** 태그를 벗겨 실제로 읽히는 글자만 센다 — 감사에서 이 페이지가 133자였던 게 문제의 시작이다. */
const visibleLength = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;

describe('flattenPhonicsUnits', () => {
  it('트랙별 단원 수가 홈에서 광고하는 숫자와 같다', () => {
    // 🔴 홈 <title> 이 「한글 파닉스 32단원 · 영어 파닉스 39단원」이다. 여기가 어긋나면
    //    간판과 사이트맵이 서로 다른 말을 하게 된다.
    expect(flattenPhonicsUnits('korean')).toHaveLength(32);
    expect(flattenPhonicsUnits('english')).toHaveLength(39);
  });

  it('position 은 트랙 전체에서 1부터 이어진다 (레벨이 바뀌어도 안 끊긴다)', () => {
    const ko = flattenPhonicsUnits('korean');
    expect(ko.map((u) => u.position)).toEqual([...Array(32)].map((_, i) => i + 1));
    // 레벨 경계를 실제로 넘는지 — 한글1 다음에 한글2 가 온다
    expect(new Set(ko.map((u) => u.levelName)).size).toBeGreaterThan(1);
  });

  it('제목에서 `unit NN:` 앞머리를 뗀다', () => {
    expect(findPhonicsUnit('korean', 'kr-h1-u02')?.name).toBe('ㄱ 배우기');
    expect(findPhonicsUnit('english', 'en-b1-u01')?.name).toBe('Aa Bb Cc');
  });

  it('🔴 받침 단원(blending 4원소)에서 만들어진 음절을 집는다', () => {
    // 이게 index 2 로 하드코딩되면 받침 단원이 통째로 초성만 나온다.
    // 부모 리포트 격자가 정확히 같은 이유로 비어 있던 적이 있다.
    const u = findPhonicsUnit('korean', 'kr-h2-u01');
    expect(u?.syllables).toContain('강');
    expect(u?.syllables).toContain('항');
    expect(u?.syllables).not.toContain('ㄱ');
  });

  it('영어 단원은 blending 이 없어 syllables 가 비고 patterns 를 쓴다', () => {
    const u = findPhonicsUnit('english', 'en-b3-u01');
    expect(u?.syllables).toEqual([]);
    expect(u?.patterns.length).toBeGreaterThan(0);
  });

  it('isPhonicsTrack 은 아는 트랙만 통과시킨다', () => {
    expect(isPhonicsTrack('korean')).toBe(true);
    expect(isPhonicsTrack('english')).toBe(true);
    expect(isPhonicsTrack('chinese')).toBe(false);
    expect(isPhonicsTrack('../etc')).toBe(false);
  });
});

describe('renderPhonicsUnitSeo', () => {
  it('없는 단원은 null — 라우트가 404/SPA 로 흘린다', () => {
    expect(renderPhonicsUnitSeo('korean', 'kr-h9-u99')).toBeNull();
  });

  it('🔴 본문이 실제로 읽을 거리가 된다 (감사 당시 133자였다)', () => {
    const seo = renderPhonicsUnitSeo('korean', 'kr-h1-u02')!;
    expect(visibleLength(seo.bodyHtml)).toBeGreaterThan(300);
    // 그 단원의 고유 내용이 실제로 들어 있어야 한다 — 껍데기면 이게 없다
    expect(seo.bodyHtml).toContain('고기');
    expect(seo.bodyHtml).toContain('가');
  });

  it('canonical 이 자기 주소를 가리킨다', () => {
    const seo = renderPhonicsUnitSeo('english', 'en-b1-u01')!;
    expect(seo.canonical).toBe(
      'https://www.tangobook.co.kr/library/phonics/english/en-b1-u01/about'
    );
  });

  it('이전·다음 링크로 단원끼리 이어진다 (고아 페이지 방지)', () => {
    const mid = renderPhonicsUnitSeo('korean', 'kr-h1-u03')!;
    expect(mid.bodyHtml).toContain('/library/phonics/korean/kr-h1-u02/about');
    expect(mid.bodyHtml).toContain('/library/phonics/korean/kr-h1-u04/about');
  });

  it('첫 단원엔 이전이, 마지막 단원엔 다음이 없다', () => {
    const units = flattenPhonicsUnits('korean');
    const first = renderPhonicsUnitSeo('korean', units[0].id)!;
    const last = renderPhonicsUnitSeo('korean', units[units.length - 1].id)!;
    expect(first.bodyHtml).not.toContain('←');
    expect(last.bodyHtml).not.toContain('→');
    // 둘 다 허브로는 돌아갈 수 있어야 한다
    for (const seo of [first, last]) {
      expect(seo.bodyHtml).toContain('/library/phonics/korean/about');
    }
  });

  it('학습 화면으로 가는 링크가 있다 — 읽고 나서 할 일이 있어야 한다', () => {
    const seo = renderPhonicsUnitSeo('korean', 'kr-h1-u02')!;
    expect(seo.bodyHtml).toContain('href="/library/phonics/korean/kr-h1-u02"');
  });

  it('LearningResource + BreadcrumbList JSON-LD 를 낸다', () => {
    const seo = renderPhonicsUnitSeo('korean', 'kr-h1-u02')!;
    expect(seo.jsonLdHtml).toContain('"LearningResource"');
    expect(seo.jsonLdHtml).toContain('"BreadcrumbList"');
    // JSON 이 실제로 파싱되는지 (문자열 조립이라 깨질 수 있다)
    const blocks = [...seo.jsonLdHtml.matchAll(/<script[^>]*>(.*?)<\/script>/gs)];
    expect(blocks).toHaveLength(2);
    for (const b of blocks) expect(() => JSON.parse(b[1])).not.toThrow();
  });

  it('주입하면 title·canonical 이 홈 것을 덮고 본문이 #root 에 들어간다', () => {
    const html = injectAboutSeo(INDEX_HTML, renderPhonicsUnitSeo('korean', 'kr-h1-u02')!);
    expect(html).toContain('ㄱ 배우기');
    expect(html).toContain('rel="canonical" href="https://www.tangobook.co.kr/library/phonics/');
    expect(html).not.toContain('<div id="root"></div>');
    // 홈 hreflang 이 새어 나오면 안 된다 (about 페이지에서 겪은 그 문제)
    expect(html).not.toContain('rel="alternate" hreflang=');
  });

  it('32 + 39 단원 전부 렌더되고, 제목이 서로 겹치지 않는다', () => {
    const titles = new Set<string>();
    for (const track of ['korean', 'english'] as const) {
      for (const u of flattenPhonicsUnits(track)) {
        const seo = renderPhonicsUnitSeo(track, u.id);
        expect(seo, `${track}/${u.id}`).not.toBeNull();
        expect(visibleLength(seo!.bodyHtml), `${track}/${u.id}`).toBeGreaterThan(150);
        titles.add(seo!.title);
      }
    }
    // 🔴 제목이 겹치면 구글이 중복으로 본다 — 71개가 전부 달라야 한다
    expect(titles.size).toBe(71);
  });
});

describe('renderPhonicsTrackSeo', () => {
  it('허브가 그 트랙 단원 전부를 링크한다', () => {
    const seo = renderPhonicsTrackSeo('korean');
    for (const u of flattenPhonicsUnits('korean')) {
      expect(seo.bodyHtml).toContain(`/library/phonics/korean/${u.id}/about`);
    }
  });

  it('Course JSON-LD 의 hasPart 수가 단원 수와 같다', () => {
    const seo = renderPhonicsTrackSeo('english');
    const block = /<script[^>]*>(.*?)<\/script>/s.exec(seo.jsonLdHtml)![1];
    const course = JSON.parse(block) as { '@type': string; hasPart: unknown[] };
    expect(course['@type']).toBe('Course');
    expect(course.hasPart).toHaveLength(39);
  });

  it('제목에 단원 수가 들어간다', () => {
    expect(renderPhonicsTrackSeo('korean').title).toContain('32단원');
    expect(renderPhonicsTrackSeo('english').title).toContain('39단원');
  });
});
