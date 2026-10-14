import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EnglishAlphabetTray } from './EnglishAlphabetTray';

describe('EnglishAlphabetTray', () => {
  it('slides alphabet choices without selecting a letter and disables the end arrow', () => {
    const selected = vi.fn();
    render(
      <EnglishAlphabetTray letterCount={26}>
        {'abcdefghijklmnopqrstuvwxyz'.split('').map((letter) => (
          <button key={letter} onClick={selected}>
            {letter}
          </button>
        ))}
      </EnglishAlphabetTray>
    );
    const viewport = screen.getByRole('group', { name: '알파벳 블록 고르기' });
    Object.defineProperties(viewport, { clientWidth: { value: 200 }, scrollWidth: { value: 800 } });
    const scrollBy = vi.fn();
    Object.defineProperty(viewport, 'scrollBy', { value: scrollBy });
    fireEvent.scroll(viewport);
    expect(screen.getByRole('button', { name: '이전 블록 보기' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '다음 블록 보기' }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 150, behavior: 'smooth' });
    expect(selected).not.toHaveBeenCalled();
    Object.defineProperty(viewport, 'scrollLeft', { value: 600 });
    fireEvent.scroll(viewport);
    expect(screen.getByRole('button', { name: '다음 블록 보기' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '이전 블록 보기' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'z' })).toBeInTheDocument();
  });
  it('does not show arrows when the unit’s letter choices fit', () => {
    render(
      <EnglishAlphabetTray letterCount={3}>
        <button>a</button>
        <button>b</button>
        <button>c</button>
      </EnglishAlphabetTray>
    );
    expect(screen.queryByRole('button', { name: '다음 블록 보기' })).not.toBeInTheDocument();
  });
});
