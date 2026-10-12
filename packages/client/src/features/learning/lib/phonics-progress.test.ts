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
      totalUnits: 3,
      readUnits: 0,
    });
    expect([...readPhonicsUnitIds(events, [])]).toEqual(['kr-v1-g01']);
  });
  it('구형 듣기6개와 쓰기 완료는 그 여섯 단원에만 대응한다', () => {
    const events = [event('kr-h1-u01', 'listen-1'), event('kr-h1-u01', 'write-1')];
    const completed = completedPhonicsUnitIds(events, 'ko');
    expect(koreanLevelProgress('hangul-vowels', completed).readUnits).toBe(1);
    expect(completed.has('kr-v1-g01')).toBe(true);
    expect(completed.has('kr-v1-g02')).toBe(false);
    expect(completed.has('kr-v1-u07')).toBe(false);
    expect(completedPhonicsUnitIds([event('kr-h1-u01')], 'ko').size).toBe(0);
    expect(completedPhonicsUnitIds(events, 'en').size).toBe(0);
  });
  it('모음 놀이 완료나 방문만으로 묶음의 필수 학습 완료를 만들지 않는다', () => {
    const events = [event('kr-v1-g01', 'match-game'), event('kr-v1-g01')];
    expect(completedPhonicsUnitIds(events, 'ko').has('kr-v1-g01')).toBe(false);
    const learned = Array.from({ length: 4 }, (_, index) => [
      event('kr-v1-g01', `listen-${index + 1}`),
      event('kr-v1-g01', `write-${index + 1}`),
    ]).flat();
    expect(completedPhonicsUnitIds([...events, ...learned], 'ko').has('kr-v1-g01')).toBe(true);
  });
});
