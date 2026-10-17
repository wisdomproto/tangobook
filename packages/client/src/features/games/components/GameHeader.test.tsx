import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { GameHeader } from './GameHeader';
import { GameHomeContext } from './GameHomeContext';
import { useLearningWorkspace } from '@/features/phonics-learner/components/learning-workspace-context';

vi.mock('../../phonics-learner/components/ActivityShell', () => ({
  usePhonicsEmbedded: () => false,
}));
vi.mock('./BlockInputGate', () => ({ useBlockInputControl: () => null }));
vi.mock('@/features/phonics-learner/components/learning-workspace-context', () => ({
  useLearningWorkspace: vi.fn(() => null),
}));
function Home() {
  return (
    <output>
      {useLocation().pathname}
      {useLocation().search}
    </output>
  );
}
it.each(['/library', '/library?playLang=en'])('the header home button respects %s', (target) => {
  const header = <GameHeader title="놀이" current={0} total={3} onBack={vi.fn()} />;
  render(
    <MemoryRouter initialEntries={['/game']}>
      <Routes>
        <Route
          path="/game"
          element={
            target === '/library' ? (
              header
            ) : (
              <GameHomeContext.Provider value={target}>{header}</GameHomeContext.Provider>
            )
          }
        />
        <Route path="/library" element={<Home />} />
      </Routes>
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: '홈으로' }));
  expect(screen.getByRole('status')).toHaveTextContent(target);
});

it('workspace back, activity menu and map remain separate actions', () => {
  const back = vi.fn(),
    map = vi.fn(),
    menu = vi.fn();
  vi.mocked(useLearningWorkspace).mockReturnValue({
    active: true,
    navigationOpen: false,
    setNavigationOpen: menu,
    backToMap: map,
  });
  render(
    <MemoryRouter>
      <GameHeader title="블록 놀이" current={1} total={4} onBack={back} />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: '← 돌아가기' }));
  expect(back).toHaveBeenCalledOnce();
  expect(menu).not.toHaveBeenCalled();
  expect(map).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '활동 목록' }));
  expect(menu).toHaveBeenCalledWith(true);
  fireEvent.click(screen.getByRole('button', { name: '학습 지도' }));
  expect(map).toHaveBeenCalledOnce();
  vi.mocked(useLearningWorkspace).mockReturnValue(null);
});
