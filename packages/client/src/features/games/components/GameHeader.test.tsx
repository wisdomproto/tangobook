import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { GameHeader } from './GameHeader';
import { GameHomeContext } from './GameHomeContext';

vi.mock('../../phonics-learner/components/ActivityShell', () => ({
  usePhonicsEmbedded: () => false,
}));
vi.mock('./BlockInputGate', () => ({ useBlockInputControl: () => null }));
vi.mock('@/features/phonics-learner/components/learning-workspace-context', () => ({
  useLearningWorkspace: () => null,
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
