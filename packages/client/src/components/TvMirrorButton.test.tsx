import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TvMirrorButton } from './TvMirrorButton';
import * as pwa from '@/lib/pwa-install';

/**
 * 🔴 이 버튼은 미러링을 켜지 않는다(웹에 API 없음) — 안내만 한다. 그래서 잠글 가치가 있는 건
 *    "언제 뜨고, 어떤 안내를 보여주나" 셋뿐이다: 터치 기기에서만 · iOS 는 제어센터 · 그 외는 크롬 전송.
 */
function setDevice({ touch, ios }: { touch: boolean; ios: boolean }) {
  vi.spyOn(pwa, 'isTouchDevice').mockReturnValue(touch);
  vi.spyOn(pwa, 'isIos').mockReturnValue(ios);
}

describe('TvMirrorButton', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('데스크톱(터치 아님)에선 렌더하지 않는다 — 미러링은 폰에서 켜는 것이라 안내가 뜻이 없다', () => {
    setDevice({ touch: false, ios: false });
    const { container } = render(<TvMirrorButton />);
    expect(container.firstChild).toBeNull();
  });

  it('터치 기기면 버튼이 뜨고, 누르면 안내가 열린다', () => {
    setDevice({ touch: true, ios: false });
    render(<TvMirrorButton />);
    fireEvent.click(screen.getByText('TV로 보기'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('iOS 는 제어센터 안내', () => {
    setDevice({ touch: true, ios: true });
    render(<TvMirrorButton />);
    fireEvent.click(screen.getByText('TV로 보기'));
    expect(screen.getByText(/제어센터/)).toBeInTheDocument();
    expect(screen.queryByText(/크롬/)).toBeNull();
  });

  it('안드로이드는 크롬 전송 안내', () => {
    setDevice({ touch: true, ios: false });
    render(<TvMirrorButton />);
    fireEvent.click(screen.getByText('TV로 보기'));
    expect(screen.getByText(/크롬/)).toBeInTheDocument();
    expect(screen.queryByText(/제어센터/)).toBeNull();
  });

  it('학습 기록이 남는다는 점을 안내에 적는다 — 유튜브로 내보내는 방식과 갈리는 지점이라', () => {
    setDevice({ touch: true, ios: true });
    render(<TvMirrorButton />);
    fireEvent.click(screen.getByText('TV로 보기'));
    expect(screen.getByText(/기록/)).toBeInTheDocument();
  });
});
