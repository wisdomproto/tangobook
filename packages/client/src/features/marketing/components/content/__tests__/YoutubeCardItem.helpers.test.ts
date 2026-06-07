import { describe, it, expect } from 'vitest';
import { SECTION_TYPES, getSectionInfo, estimatedSceneSeconds } from '../YoutubeCardItem';
import { estimateReadingTime } from '../YoutubePreviewDialog';
import {
  buildYoutubeCardsFromParsed,
  parseYoutubeScript,
  type ParsedYoutubeScript,
} from '../YoutubePanel';
import type { YoutubeCard, Project } from '../../../types/database';

const card = (narration: string): YoutubeCard =>
  ({
    id: 'x',
    user_id: 'u',
    youtube_content_id: 'yt',
    section_type: 'main',
    narration_text: narration,
    screen_direction: '',
    subtitle_text: null,
    image_url: null,
    image_prompt: null,
    video_prompt: null,
    sort_order: 0,
    created_at: '',
    updated_at: '',
  }) as YoutubeCard;

describe('getSectionInfo', () => {
  it('returns the matching entry for each known type', () => {
    for (const st of SECTION_TYPES) {
      expect(getSectionInfo(st.value).value).toBe(st.value);
    }
  });
  it('falls back to the main entry for null / unknown', () => {
    expect(getSectionInfo(null).value).toBe('main');
    expect(getSectionInfo('nope').value).toBe('main');
  });
});

describe('estimatedSceneSeconds', () => {
  // CF youtube-card-item.tsx:34 → Math.max(1, Math.round(charCount / (250/60)))  (~250자/분)
  it('floors at 1 second for empty / short narration', () => {
    expect(estimatedSceneSeconds(0)).toBe(1);
    expect(estimatedSceneSeconds(2)).toBe(1); // round(2 / 4.166) = round(0.48) = 0 → max(1,0) = 1
  });
  it('computes ~seconds for longer narration (250자/분 ⇒ 4.166자/초)', () => {
    expect(estimatedSceneSeconds(250)).toBe(60); // round(250 / 4.166) = round(60) = 60
    expect(estimatedSceneSeconds(125)).toBe(30); // round(125 / 4.166) = round(30) = 30
  });
});

describe('estimateReadingTime', () => {
  // CF youtube-preview-dialog.tsx:19-25 → totalChars/250 minutes; <1 ⇒ '1분 미만'
  it('returns "1분 미만" under 250 total chars', () => {
    expect(estimateReadingTime([card('a'.repeat(100))])).toBe('1분 미만');
    expect(estimateReadingTime([])).toBe('1분 미만');
  });
  it('returns "약 N분" at/above 250 chars (rounded)', () => {
    expect(estimateReadingTime([card('a'.repeat(500))])).toBe('약 2분'); // 500/250 = 2
    expect(estimateReadingTime([card('a'.repeat(250)), card('a'.repeat(125))])).toBe('약 2분'); // 375/250 = 1.5 → round 2
  });
});

const project = { id: 'p-1', name: 'T', target_languages: ['ko'] } as unknown as Project;

const parsed = {
  video_title: 'V',
  sections: [
    {
      section_type: 'hook',
      narration_text: '안녕',
      screen_direction: 'B-roll',
      subtitle_text: '안녕',
    },
    { section_type: '', narration_text: '본문', screen_direction: '' }, // missing section_type + subtitle
  ],
};

describe('buildYoutubeCardsFromParsed', () => {
  it('maps sections to cards with defaults, user_id, and builder-filled prompts', () => {
    const cards = buildYoutubeCardsFromParsed(parsed as ParsedYoutubeScript, {
      youtubeContentId: 'yt-1',
      userId: 'user-1',
      project,
      imageStyle: '',
      now: '2026-06-07T00:00:00.000Z',
    });
    expect(cards).toHaveLength(2);
    // defaults
    expect(cards[0].section_type).toBe('hook');
    expect(cards[1].section_type).toBe('main'); // '' || 'main'
    expect(cards[1].subtitle_text).toBeNull(); // missing ⇒ ?? null
    expect(cards[0].sort_order).toBe(0);
    expect(cards[1].sort_order).toBe(1);
    // R-A: user_id stamped on every card
    expect(cards.every((c) => c.user_id === 'user-1')).toBe(true);
    expect(cards.every((c) => c.youtube_content_id === 'yt-1')).toBe(true);
    // load-bearing: prompts built from the two youtube builders (non-empty)
    expect(cards[0].image_prompt && cards[0].image_prompt.length).toBeTruthy();
    expect(cards[0].video_prompt && cards[0].video_prompt.length).toBeTruthy();
    expect(cards[0].image_url).toBeNull();
  });
});

describe('parseYoutubeScript', () => {
  it('extracts the JSON object and returns it', () => {
    const out = parseYoutubeScript(
      'blah {"sections":[{"section_type":"hook","narration_text":"x","screen_direction":""}]} trailing'
    );
    expect(out.sections).toHaveLength(1);
  });
  it('throws when no JSON object is present', () => {
    expect(() => parseYoutubeScript('no json here')).toThrow();
  });
  it('throws when sections is empty / missing', () => {
    expect(() => parseYoutubeScript('{"sections":[]}')).toThrow();
  });
});
