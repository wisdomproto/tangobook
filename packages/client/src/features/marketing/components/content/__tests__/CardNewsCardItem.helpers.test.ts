import { describe, it, expect } from 'vitest';
import {
  parseCanvasData,
  snapToGrid,
  clamp,
  isBgLight,
  defaultCanvasData,
} from '../CardNewsCardItem';

describe('snapToGrid', () => {
  it('snaps to the nearest 10 within SNAP_THRESHOLD(4)', () => {
    expect(snapToGrid(12)).toBe(10); // |12-10|=2 < 4
    expect(snapToGrid(48)).toBe(50); // |48-50|=2 < 4
  });
  it('leaves a value outside the threshold unchanged', () => {
    expect(snapToGrid(15)).toBe(15); // |15-10|=5 and |15-20|=5, both >= 4
  });
});

describe('clamp', () => {
  it('clamps within bounds', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(50, 0, 100)).toBe(50);
  });
});

describe('isBgLight', () => {
  it('treats white as light and near-black as dark', () => {
    expect(isBgLight('#ffffff')).toBe(true);
    expect(isBgLight('#18181b')).toBe(false);
  });
  it('treats a short/invalid hex as light (fallback)', () => {
    expect(isBgLight('#fff')).toBe(true);
  });
});

describe('defaultCanvasData', () => {
  it('returns 4 blocks (header/title/body/footer), dark bg, imageY 50', () => {
    const d = defaultCanvasData();
    expect(d.textBlocks.map((b) => b.id)).toEqual(['header', 'title', 'body', 'footer']);
    expect(d.bgColor).toBe('#18181b');
    expect(d.imageY).toBe(50);
    expect(d.imageUrl).toBeNull();
  });
});

describe('parseCanvasData', () => {
  it('returns defaults (+imageUrl) when text_style is null', () => {
    const d = parseCanvasData(null, 'https://img');
    expect(d.textBlocks).toHaveLength(4);
    expect(d.imageUrl).toBe('https://img');
  });
  it('passes through the new array format and overrides imageUrl when provided', () => {
    const existing = {
      bgColor: '#000',
      imageUrl: 'old',
      imageY: 30,
      textBlocks: [
        {
          id: 'title',
          text: 'Hi',
          x: 10,
          y: 20,
          fontSize: 28,
          color: '#fff',
          fontWeight: 'bold',
          textAlign: 'left',
          width: 80,
        },
      ],
    };
    const d = parseCanvasData(existing as unknown as Record<string, unknown>, 'new');
    expect(d.imageUrl).toBe('new');
    expect(d.textBlocks[0].text).toBe('Hi');
  });
  it('migrates the legacy flat shape into 4 blocks', () => {
    const legacy = {
      title: 'Old Title',
      body: 'Old Body',
      bgColor: '#111111',
      textAlign: 'center',
    };
    const d = parseCanvasData(legacy as unknown as Record<string, unknown>, null);
    const title = d.textBlocks.find((b) => b.id === 'title');
    const body = d.textBlocks.find((b) => b.id === 'body');
    expect(d.textBlocks).toHaveLength(4);
    expect(title?.text).toBe('Old Title');
    expect(body?.text).toBe('Old Body');
    expect(title?.textAlign).toBe('center');
    expect(d.bgColor).toBe('#111111');
  });
});
