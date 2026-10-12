import { describe, expect, it } from 'vitest';
import type { LearningEvent } from '@tangobook/shared';
import {
  completedPhonicsUnitIds,
  koreanLevelProgress,
  readPhonicsUnitIds,
} from './phonics-progress';

const event = (unitId: string, activityId?: string) =>
  ({
    event_type: 'page_read',
    storybook_id: unitId,
    metadata: {
      source: 'phonics',
      lang: 'ko',
      unitId,
      activityId,
      activityCompleted: !!activityId,
    },
  }) as LearningEvent;

describe('모음 분리 후 학습 기록', () => {
  it('새 모음 단원의 실제 필수 완료만 세고 R2 책 목록 없이도 방문을 인식한다', () => {
    const events = [
      event('kr-v1-u01', 'listen-1'),
      event('kr-v1-u01', 'write-1'),
      event('kr-v1-u02'),
    ];
    const completed = completedPhonicsUnitIds(events, 'ko');
    expect([...completed]).toEqual(['kr-v1-u01']);
    expect(koreanLevelProgress('hangul-vowels', completed)).toMatchObject({
      totalUnits: 10,
      readUnits: 1,
    });
    expect([...readPhonicsUnitIds(events, [])]).toEqual(['kr-v1-u01', 'kr-v1-u02']);
  });
  it('구형 듣기6개와 쓰기 완료는 그 여섯 단원에만 대응한다', () => {
    const events = [event('kr-h1-u01', 'listen-1'), event('kr-h1-u01', 'write-1')];
    const completed = completedPhonicsUnitIds(events, 'ko');
    expect(koreanLevelProgress('hangul-vowels', completed).readUnits).toBe(6);
    expect(completed.has('kr-v1-u07')).toBe(false);
    expect(completedPhonicsUnitIds([event('kr-h1-u01')], 'ko').size).toBe(0);
    expect(completedPhonicsUnitIds(events, 'en').size).toBe(0);
  });
});
