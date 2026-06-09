import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KoreanInput, KoreanTextarea } from '../korean-input';

describe('KoreanInput', () => {
  it('renders an input with defaultValue equal to value prop', () => {
    render(<KoreanInput value="안녕" onCommit={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('안녕');
  });

  it('calls onCommit with new value on blur when value changed', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<KoreanInput value="hello" onCommit={onCommit} />);
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, 'world');
    await user.tab(); // triggers blur

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('world');
  });

  it('does NOT call onCommit on blur when value is unchanged', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<KoreanInput value="hello" onCommit={onCommit} />);
    const input = screen.getByRole('textbox');

    // Focus then blur without changing
    await user.click(input);
    await user.tab();

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits on Enter keydown (triggers blur) when commitOnEnter=true (default)', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<KoreanInput value="hi" onCommit={onCommit} />);
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, 'bye');
    await user.keyboard('{Enter}'); // should blur → commit

    expect(onCommit).toHaveBeenCalledWith('bye');
  });

  it('does NOT commit on Enter when commitOnEnter=false', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<KoreanInput value="hi" onCommit={onCommit} commitOnEnter={false} />);
    const input = screen.getByRole('textbox');

    await user.clear(input);
    await user.type(input, 'bye');
    await user.keyboard('{Enter}');

    // Enter should not have triggered blur/commit
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('remounts (resets) when value prop changes (key={value})', () => {
    const onCommit = vi.fn();
    const { rerender } = render(<KoreanInput value="initial" onCommit={onCommit} />);
    const inputBefore = screen.getByRole('textbox') as HTMLInputElement;
    expect(inputBefore.value).toBe('initial');

    rerender(<KoreanInput value="updated" onCommit={onCommit} />);
    const inputAfter = screen.getByRole('textbox') as HTMLInputElement;
    expect(inputAfter.value).toBe('updated');
  });
});

describe('KoreanTextarea', () => {
  it('renders a textarea with defaultValue equal to value prop', () => {
    render(<KoreanTextarea value="안녕" onCommit={() => {}} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('안녕');
  });

  it('calls onCommit on blur when value changed', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<KoreanTextarea value="hello" onCommit={onCommit} />);
    const textarea = screen.getByRole('textbox');

    await user.clear(textarea);
    await user.type(textarea, 'world');
    await user.tab();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('world');
  });

  it('does NOT call onCommit on blur when value unchanged', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<KoreanTextarea value="hello" onCommit={onCommit} />);
    const textarea = screen.getByRole('textbox');

    await user.click(textarea);
    await user.tab();

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('does NOT commit on Enter for textarea (no Enter handling)', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<KoreanTextarea value="hi" onCommit={onCommit} />);
    const textarea = screen.getByRole('textbox');

    await user.clear(textarea);
    await user.type(textarea, 'bye');
    await user.keyboard('{Enter}');

    // Textarea should NOT commit on Enter (no blur)
    expect(onCommit).not.toHaveBeenCalled();
  });
});
