import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouteErrorScreen } from './RouteErrorScreen';

const routeError = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('react-router-dom', () => ({ useRouteError: () => routeError.current }));

const reloadSpy = vi.fn();

describe('RouteErrorScreen', () => {
  beforeEach(() => {
    sessionStorage.clear();
    reloadSpy.mockClear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });
  });
  afterEach(() => vi.restoreAllMocks());

  /**
   * 🔴 배포되면 콘텐츠 해시가 바뀌어 옛 청크가 사라진다. 그 전에 열어둔 탭은 계속 옛 이름을
   *    요청하므로 PC 에서만 터진다(새로 연 모바일은 멀쩡). 해법은 새로고침 한 번뿐인데 사용자가
   *    그걸 알 방법이 없으니 대신 눌러 준다.
   */
  it('청크가 사라진 에러면 자동으로 새로고침한다', () => {
    routeError.current = new Error(
      'Failed to fetch dynamically imported module: https://x/assets/ViewerPage-C1RNqfvV.js'
    );
    const { container } = render(<RouteErrorScreen />);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toBeNull();
  });

  it('🔴 한 탭에서 두 번은 안 한다 — 청크가 영영 없으면 무한 새로고침이 된다', () => {
    routeError.current = new Error('Failed to fetch dynamically imported module: /assets/x.js');
    render(<RouteErrorScreen />);
    render(<RouteErrorScreen />);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/화면을 여는 데 문제가 생겼어요/)).toBeInTheDocument();
  });

  it('청크와 무관한 에러는 새로고침하지 않고 안내만 — 새로고침해도 안 고쳐지므로', () => {
    routeError.current = new Error('Cannot read properties of undefined');
    render(<RouteErrorScreen />);
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/화면을 여는 데 문제가 생겼어요/)).toBeInTheDocument();
  });
});
