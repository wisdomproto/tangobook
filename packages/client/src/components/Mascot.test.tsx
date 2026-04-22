import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Mascot, MASCOT_EMOJI_FALLBACK } from './Mascot';

describe('Mascot', () => {
  it('renders PNG img for PNG-only state immediately (thinking)', () => {
    // thinking은 Lottie 아니므로 초기 stage='png' → <img> 동기 렌더
    render(<Mascot state="thinking" />);
    const img = document.querySelector('img[aria-hidden="true"]');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toContain('thinking.webp');
  });

  it('renders message bubble when message prop is set', () => {
    render(<Mascot state="waving" message="안녕!" />);
    expect(screen.getByText('안녕!')).toBeInTheDocument();
  });

  it('exports emoji fallback map with all states', () => {
    expect(MASCOT_EMOJI_FALLBACK.idle).toBe('🐯');
    expect(MASCOT_EMOJI_FALLBACK.thinking).toBe('🤔');
    expect(MASCOT_EMOJI_FALLBACK.sleeping).toBe('😴');
    expect(MASCOT_EMOJI_FALLBACK.sad).toBe('😿');
  });
});
