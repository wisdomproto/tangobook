import { describe, it, expect } from 'vitest';
import { shouldSkip, type PublicationRow } from './naver-publications.store.js';

const row = (status: PublicationRow['status']): PublicationRow => ({
  book_id: 'b',
  post_id: 'p',
  language: 'ko',
  status,
  naver_post_url: null,
});

describe('shouldSkip (mode-aware)', () => {
  it('publish 모드: published 만 skip, draft/failed/null 은 진행', () => {
    expect(shouldSkip(row('published'), 'publish')).toBe(true);
    expect(shouldSkip(row('draft'), 'publish')).toBe(false);
    expect(shouldSkip(row('failed'), 'publish')).toBe(false);
    expect(shouldSkip(null, 'publish')).toBe(false);
  });
  it('draft 모드: draft·published 둘 다 skip(중복 초안 방지), failed/null 은 진행', () => {
    expect(shouldSkip(row('draft'), 'draft')).toBe(true);
    expect(shouldSkip(row('published'), 'draft')).toBe(true);
    expect(shouldSkip(row('failed'), 'draft')).toBe(false);
    expect(shouldSkip(null, 'draft')).toBe(false);
  });
});
