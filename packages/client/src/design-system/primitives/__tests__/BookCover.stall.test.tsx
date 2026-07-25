import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BookCover } from '../BookCover';

/**
 * 🔴 스톨 복구 회귀 테스트 (2026-07-25).
 * 표지가 **에러도 로드도 없이 그냥 안 오는** 경우(요청 스톨·드롭)에 onError 기반 재시도는
 * 영영 돌지 않아 카드가 플레이스홀더인 채 멈췄다("한번 안 뜨면 계속 안 뜸").
 * 화면에 들어온 뒤 일정 시간이 지나면 강제로 재요청(remount)해야 한다.
 */

// jsdom 에 IntersectionObserver 가 없으면 BookCover 는 즉시 타이머를 건다(폴백).
// 여기서는 그 폴백 경로를 그대로 쓴다 — 화면 진입 판정 없이 바로 감시가 걸린다.
const BOOK = {
  id: 'b1',
  title: '테스트 책',
  coverImage: 'https://assets.tangobook.co.kr/cover.webp',
};

function srcOf() {
  return (screen.getByRole('img') as HTMLImageElement).getAttribute('src') ?? '';
}

describe('BookCover — 스톨 복구', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('로드도 에러도 없이 멈춰 있으면 캐시버스트로 재요청한다', () => {
    render(<BookCover book={BOOK} lang="ko" />);
    // 처음엔 원본 URL — 아직 재시도 전
    expect(srcOf()).not.toContain('cb=');

    // 스톨 시간 경과 → 재요청(캐시버스트 쿼리 부착)
    act(() => vi.advanceTimersByTime(3000));
    expect(srcOf()).toContain('cb=1');
    // 🔴 재요청은 lazy 를 풀고 즉시 받아야 한다 — lazy 인 채면 안 뜨던 조건이 그대로다.
    expect(screen.getByRole('img').getAttribute('loading')).toBe('eager');
  });

  it('로드가 끝나면 감시가 풀려 재요청하지 않는다', () => {
    render(<BookCover book={BOOK} lang="ko" />);
    act(() => {
      screen.getByRole('img').dispatchEvent(new Event('load'));
    });
    act(() => vi.advanceTimersByTime(20_000));
    expect(srcOf()).not.toContain('cb=');
  });

  it('무한 재시도하지 않는다 (상한에서 멈춤)', () => {
    render(<BookCover book={BOOK} lang="ko" />);
    act(() => vi.advanceTimersByTime(60_000));
    const src = srcOf();
    const n = Number(src.match(/cb=(\d+)/)?.[1] ?? 0);
    expect(n).toBeLessThanOrEqual(4);
  });
});
