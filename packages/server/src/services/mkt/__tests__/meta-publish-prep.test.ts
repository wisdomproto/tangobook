import { describe, it, expect } from 'vitest';
import { validatePublish, targetIdForPage, htmlToText } from '../meta-publish-prep.js';
import type { MetaPage } from '../meta-connection.store.js';

const page: MetaPage = {
  id: 'page-1',
  name: 'My Page',
  pageAccessToken: 'tok',
  instagram: { id: 'ig-1', username: 'insta' },
  threadsId: 'th-1',
};

describe('meta-publish-prep', () => {
  it('IG는 이미지 0장이면 발행 불가', () => {
    expect(validatePublish('instagram', []).ok).toBe(false);
    expect(validatePublish('instagram', ['a.jpg']).ok).toBe(true);
  });

  it('FB/Threads는 텍스트 전용 허용', () => {
    expect(validatePublish('facebook', []).ok).toBe(true);
    expect(validatePublish('threads', []).ok).toBe(true);
  });

  it('플랫폼별 타겟 id 선택', () => {
    expect(targetIdForPage(page, 'instagram')).toBe('ig-1');
    expect(targetIdForPage(page, 'facebook')).toBe('page-1');
    expect(targetIdForPage(page, 'threads')).toBe('th-1');
  });

  it('IG 미연결 페이지는 instagram 타겟 null', () => {
    expect(targetIdForPage({ ...page, instagram: null }, 'instagram')).toBeNull();
  });

  it('threadsId 없으면 페이지 id 로 폴백', () => {
    expect(targetIdForPage({ ...page, threadsId: null }, 'threads')).toBe('page-1');
  });

  it('htmlToText 태그 제거 + 공백 정규화', () => {
    expect(htmlToText('<p>안녕  <b>하세요</b></p>')).toBe('안녕 하세요');
  });
});
