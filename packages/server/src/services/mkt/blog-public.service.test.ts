import { describe, it, expect } from 'vitest';
import { localizeCardLinks } from './blog-public.service.js';

describe('localizeCardLinks', () => {
  it('ko 는 원본 그대로', () => {
    const html = '<a href="/library/123">책</a>';
    expect(localizeCardLinks(html, 'ko')).toBe(html);
  });

  it('책 상세 링크(절대/상대)는 LangEntry(/{lang}?to=) 로', () => {
    expect(localizeCardLinks('<a href="https://tangobook.co.kr/library/123">x</a>', 'en')).toBe(
      '<a href="/en?to=%2Flibrary%2F123">x</a>'
    );
    expect(localizeCardLinks('<a href="/library/123">x</a>', 'vi')).toBe(
      '<a href="/vi?to=%2Flibrary%2F123">x</a>'
    );
  });

  it('about 페이지는 lang 프리픽스', () => {
    expect(localizeCardLinks('<a href="/library/123/about">x</a>', 'zh')).toBe(
      '<a href="/zh/library/123/about">x</a>'
    );
  });

  it('교차 블로그 링크(절대/상대)는 /{lang}/blog', () => {
    expect(localizeCardLinks('<a href="https://www.tangobook.co.kr/blog/foo">x</a>', 'th')).toBe(
      '<a href="/th/blog/foo">x</a>'
    );
    expect(localizeCardLinks('<a href="/blog/foo">x</a>', 'en')).toBe(
      '<a href="/en/blog/foo">x</a>'
    );
  });

  it('외부 도메인 링크·앵커·기타 속성은 손대지 않음', () => {
    const ext = '<a href="https://example.com/library/1">x</a>';
    expect(localizeCardLinks(ext, 'en')).toBe(ext);
    const cta = '<div data-blog-cta="1" style="background:#FFF"><a href="/library/9">go</a></div>';
    expect(localizeCardLinks(cta, 'en')).toBe(
      '<div data-blog-cta="1" style="background:#FFF"><a href="/en?to=%2Flibrary%2F9">go</a></div>'
    );
  });
});
