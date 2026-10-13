import { beforeEach, describe, expect, it } from 'vitest';
import {
  getUnitProgress,
  markActivityCompleted,
  markRecentUnit,
  getRecentUnit,
} from './progress-store';
beforeEach(() => localStorage.clear());
describe('child-scoped phonics progress', () => {
  it('keeps guest, first child and sibling completions separate', () => {
    markActivityCompleted('korean', 'u', 'guest');
    localStorage.setItem('tangobook:activeProfileId', 'first');
    expect(getUnitProgress('korean', 'u').completedActivities).toEqual([]);
    markActivityCompleted('korean', 'u', 'first');
    markRecentUnit('korean', 'u');
    localStorage.setItem('tangobook:activeProfileId', 'sibling');
    expect(getUnitProgress('korean', 'u').completedActivities).toEqual([]);
    expect(getRecentUnit('korean')).toBeNull();
    localStorage.setItem('tangobook:activeProfileId', 'first');
    expect(getUnitProgress('korean', 'u').completedActivities).toEqual(['first']);
    expect(getRecentUnit('korean')).toBe('u');
    localStorage.removeItem('tangobook:activeProfileId');
    expect(getUnitProgress('korean', 'u').completedActivities).toEqual(['guest']);
  });
  it('옛 모음 듣기/쓰기 완료만 해당 모음으로 이어받고 형제 기록을 섞지 않는다', () => {
    markActivityCompleted('korean', 'kr-h1-u01', 'listen-1');
    expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual(['listen-1']);
    expect(getUnitProgress('korean', 'kr-v1-u06').completedActivities).toEqual(['listen-1']);
    expect(getUnitProgress('korean', 'kr-v1-u07').completedActivities).toEqual([]);
    markActivityCompleted('korean', 'kr-h1-u01', 'write-1');
    expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual([
      'listen-1',
      'write-1',
    ]);
    expect(getUnitProgress('korean', 'kr-v1-u10').completedActivities).toEqual(['write-1']);
    markActivityCompleted('korean', 'kr-v1-u10', 'listen-1');
    expect(getUnitProgress('korean', 'kr-v1-u10').completedActivities).toEqual([
      'listen-1',
      'write-1',
    ]);
    expect(getUnitProgress('korean', 'kr-h1-u01').completedActivities).toEqual([
      'listen-1',
      'write-1',
    ]);
    localStorage.setItem('tangobook:activeProfileId', 'sibling');
    expect(getUnitProgress('korean', 'kr-v1-u01').completedActivities).toEqual([]);
  });
  it('개별/구형/새 묶음의 진도를 합치되 놀이 완료를 지어내지 않는다', () => {
    markActivityCompleted('korean', 'kr-v1-u02', 'listen-1');
    markActivityCompleted('korean', 'kr-v1-g01', 'write-2');
    markActivityCompleted('korean', 'kr-h1-u01', 'listen-1');
    expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual(
      expect.arrayContaining(['listen-1', 'listen-2', 'listen-3', 'listen-4', 'write-2'])
    );
    expect(getUnitProgress('korean', 'kr-v1-g02').completedActivities).toEqual([
      'listen-1',
      'listen-2',
    ]);
    expect(getUnitProgress('korean', 'kr-v1-g03').completedActivities).toEqual([]);
    expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).not.toContain('listen-game');
    expect(getUnitProgress('korean', 'kr-v1-u02').completedActivities).toEqual([
      'listen-1',
      'write-1',
    ]);
    localStorage.setItem('tangobook:activeProfileId', 'sibling');
    expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toEqual([]);
  });
  it('maps grouped completion to only the same vowel and never invents chapter quiz evidence', () => {
    markActivityCompleted('korean', 'kr-v1-g01', 'listen-3');
    markActivityCompleted('korean', 'kr-v1-g01', 'write-3');
    markActivityCompleted('korean', 'kr-v1-g01', 'listen-game');
    expect(getUnitProgress('korean', 'kr-v1-u03').completedActivities).toEqual([
      'listen-1',
      'write-1',
    ]);
    expect(getUnitProgress('korean', 'kr-v1-u02').completedActivities).toEqual([]);
    markActivityCompleted('korean', 'kr-v1-u04', 'listen-1');
    expect(getUnitProgress('korean', 'kr-v1-g01').completedActivities).toContain('listen-4');
  });
});
