import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { BlockInputGate, useBlockInputControl } from './BlockInputGate';

function Player({ mode }: { mode: string }) {
  const control = useBlockInputControl();
  const [round, setRound] = useState(1);
  return (
    <>
      <div>player:{mode}</div>
      <button onClick={() => setRound(round + 1)}>round:{round}</button>
      {control}
    </>
  );
}
describe.each(['ko', 'en'] as const)('BlockInputGate %s', (language) => {
  it('starts screen blocks immediately and switches in game without resetting the round', () => {
    const selected = vi.fn();
    render(
      <BlockInputGate language={language} total={4} onBack={vi.fn()} onModeSelected={selected}>
        {(mode) => <Player mode={mode} />}
      </BlockInputGate>
    );
    expect(screen.getByText('player:screen')).toBeInTheDocument();
    expect(selected).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'round:1' }));
    fireEvent.click(screen.getByRole('button', { name: '실물 블록' }));
    expect(screen.getByText('player:camera')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'round:2' })).toBeInTheDocument();
    expect(selected).toHaveBeenLastCalledWith('camera');
    fireEvent.click(screen.getByRole('button', { name: '화면 블록' }));
    expect(screen.getByText('player:screen')).toBeInTheDocument();
    expect(selected).toHaveBeenLastCalledWith('screen');
  });
  it.each(['screen', 'camera'] as const)('honors an explicit %s launch mode', (mode) => {
    render(
      <BlockInputGate language={language} total={4} initialInputMode={mode} onBack={vi.fn()}>
        {(mode) => <Player mode={mode} />}
      </BlockInputGate>
    );
    expect(screen.getByText(`player:${mode}`)).toBeInTheDocument();
    expect(screen.queryByText('어떤 블록으로 만들까요?')).not.toBeInTheDocument();
  });
});
