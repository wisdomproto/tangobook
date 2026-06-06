import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SaveStatusIndicator } from '../SaveStatusIndicator';
import { useSaveStatusStore } from '../../../store/save-status-store';

beforeEach(() => {
  useSaveStatusStore.setState({
    pending: 0,
    flushing: false,
    lastError: null,
    lastSavedAt: null,
  });
});

describe('SaveStatusIndicator', () => {
  it('renders nothing when idle with no save history', () => {
    const { container } = render(<SaveStatusIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "저장 중…" when pending > 0', () => {
    useSaveStatusStore.setState({ pending: 1 });
    render(<SaveStatusIndicator />);
    expect(screen.getByText('저장 중…')).toBeInTheDocument();
  });

  it('renders "저장 중…" when flushing is true', () => {
    useSaveStatusStore.setState({ flushing: true });
    render(<SaveStatusIndicator />);
    expect(screen.getByText('저장 중…')).toBeInTheDocument();
  });

  it('renders "저장 중…" when both pending > 0 and flushing', () => {
    useSaveStatusStore.setState({ pending: 2, flushing: true });
    render(<SaveStatusIndicator />);
    expect(screen.getByText('저장 중…')).toBeInTheDocument();
  });

  it('renders "저장됨" when lastSavedAt is set and idle', () => {
    useSaveStatusStore.setState({ lastSavedAt: Date.now() });
    render(<SaveStatusIndicator />);
    expect(screen.getByText('저장됨')).toBeInTheDocument();
  });

  it('renders "오류" when lastError is set and idle', () => {
    useSaveStatusStore.setState({ lastError: 'Network error' });
    render(<SaveStatusIndicator />);
    expect(screen.getByText('오류')).toBeInTheDocument();
  });

  it('shows error title attribute with lastError message', () => {
    useSaveStatusStore.setState({ lastError: 'Timeout occurred' });
    render(<SaveStatusIndicator />);
    const el = screen.getByText('오류').closest('[title]');
    expect(el).toHaveAttribute('title', 'Timeout occurred');
  });

  it('active state (flushing) takes priority over error', () => {
    useSaveStatusStore.setState({ lastError: 'prev error', flushing: true });
    render(<SaveStatusIndicator />);
    expect(screen.getByText('저장 중…')).toBeInTheDocument();
    expect(screen.queryByText('오류')).toBeNull();
  });

  it('active state (pending) takes priority over error', () => {
    useSaveStatusStore.setState({ lastError: 'prev error', pending: 1 });
    render(<SaveStatusIndicator />);
    expect(screen.getByText('저장 중…')).toBeInTheDocument();
    expect(screen.queryByText('오류')).toBeNull();
  });

  it('accepts className prop', () => {
    useSaveStatusStore.setState({ lastSavedAt: Date.now() });
    const { container } = render(<SaveStatusIndicator className="my-custom-class" />);
    expect(container.querySelector('.my-custom-class')).not.toBeNull();
  });
});
