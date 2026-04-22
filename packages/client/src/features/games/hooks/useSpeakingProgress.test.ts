import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeakingProgress } from './useSpeakingProgress';

describe('useSpeakingProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('record({ spoken: true }) 후 spokenRounds +1, totalRounds +1', () => {
    const { result } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    act(() => result.current.record({ spoken: true, transcription: '사과', targetWord: '사과' }));
    expect(result.current.progress.totalRounds).toBe(1);
    expect(result.current.progress.spokenRounds).toBe(1);
    expect(result.current.progress.wordsSpoken).toContain('사과');
  });

  it('record({ spoken: false }) 시 totalRounds만 +1, wordsSpoken 변화 없음', () => {
    const { result } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    act(() => result.current.record({ spoken: false, transcription: null, targetWord: '사과' }));
    expect(result.current.progress.totalRounds).toBe(1);
    expect(result.current.progress.spokenRounds).toBe(0);
    expect(result.current.progress.wordsSpoken).toEqual([]);
  });

  it('같은 targetWord 반복 record → wordsSpoken 중복 제거', () => {
    const { result } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    act(() => {
      result.current.record({ spoken: true, transcription: '사과', targetWord: '사과' });
      result.current.record({ spoken: true, transcription: '사과', targetWord: '사과' });
    });
    expect(result.current.progress.spokenRounds).toBe(2);
    expect(result.current.progress.wordsSpoken).toEqual(['사과']);
  });

  it('책별·언어별 key 분리', () => {
    const { result: koBook1 } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    const { result: enBook1 } = renderHook(() => useSpeakingProgress('book1', 'en'));
    act(() => koBook1.current.record({ spoken: true, transcription: '사과', targetWord: '사과' }));
    expect(enBook1.current.progress.totalRounds).toBe(0);
    expect(koBook1.current.progress.totalRounds).toBe(1);
  });

  it('parse 실패 시 기본값으로 리셋', () => {
    localStorage.setItem('tangobook:speaking:book1:ko', 'not json');
    const { result } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    expect(result.current.progress.totalRounds).toBe(0);
    expect(result.current.progress.wordsSpoken).toEqual([]);
  });

  it('reset() 호출 시 localStorage 삭제 + state 초기화', () => {
    const { result } = renderHook(() => useSpeakingProgress('book1', 'ko'));
    act(() => result.current.record({ spoken: true, transcription: '사과', targetWord: '사과' }));
    act(() => result.current.reset());
    expect(result.current.progress.totalRounds).toBe(0);
    expect(localStorage.getItem('tangobook:speaking:book1:ko')).toBeNull();
  });
});
