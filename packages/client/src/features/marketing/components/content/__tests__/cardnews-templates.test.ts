import { describe, it, expect } from 'vitest';
import { CARD_TEMPLATES } from '../cardnews-templates';

const EXPECTED_IDS = [
  'clean-center',
  'dark-modern',
  'minimal',
  'magazine',
  'bold-dark',
  'photo-cover',
  'step-card',
  'brand-card',
];

describe('CARD_TEMPLATES', () => {
  it('ships exactly the 8 built-ins with the expected ids', () => {
    expect(CARD_TEMPLATES.map((t) => t.id)).toEqual(EXPECTED_IDS);
  });
  it('each template has a preview and non-empty textBlocks', () => {
    for (const t of CARD_TEMPLATES) {
      expect(typeof t.preview.bg).toBe('string');
      expect(typeof t.preview.textColor).toBe('string');
      expect(t.textBlocks.length).toBeGreaterThan(0);
    }
  });
});
