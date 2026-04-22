import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognizer } from './useSpeechRecognizer';

// Fake SpeechRecognition
class FakeSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((e: any) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onnomatch: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => {
    this.onend?.();
  });
  abort = vi.fn(() => {
    this.onend?.();
  });
}

describe('useSpeechRecognizer', () => {
  let fakeSR: FakeSpeechRecognition;

  beforeEach(() => {
    fakeSR = new FakeSpeechRecognition();
    (globalThis as any).SpeechRecognition = vi.fn(() => fakeSR);
    (globalThis as any).webkitSpeechRecognition = undefined;
  });

  afterEach(() => {
    delete (globalThis as any).SpeechRecognition;
  });

  it('Web Speech 지원 + 결과 있음 → { spoken: true, transcription }', async () => {
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    const promise = act(() => result.current.start());
    // promise executor가 핸들러를 할당할 때까지 microtask 양보
    await new Promise((r) => setTimeout(r, 0));
    // 실제 브라우저는 SpeechRecognitionResultList를 보내지만 구현이 results[0][0].transcript만 읽으므로 간소화 모킹
    fakeSR.onresult?.({ results: [[{ transcript: '사과' }]] });
    fakeSR.onend?.();
    const res = await promise;
    expect(res).toEqual({ spoken: true, transcription: '사과' });
  });

  it('Web Speech 결과 empty → { spoken: false, null }', async () => {
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    const promise = act(() => result.current.start());
    await new Promise((r) => setTimeout(r, 0));
    fakeSR.onend?.();
    const res = await promise;
    expect(res).toEqual({ spoken: false, transcription: null });
  });

  it('maxWaitMs 초과 시 abort + { spoken: false, null }', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR', maxWaitMs: 1000 }));
    const promise = act(() => result.current.start());
    vi.advanceTimersByTime(1100);
    const res = await promise;
    expect(res).toEqual({ spoken: false, transcription: null });
    expect(fakeSR.abort).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('Web Speech 미지원 + MediaRecorder도 미지원 → 즉시 degraded', async () => {
    delete (globalThis as any).SpeechRecognition;
    (globalThis as any).MediaRecorder = undefined;
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    const res = await act(() => result.current.start());
    expect(res).toEqual({ spoken: false, transcription: null });
  });

  it('권한 거부(onerror: not-allowed) → 조용히 degraded', async () => {
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    const promise = act(() => result.current.start());
    await new Promise((r) => setTimeout(r, 0));
    fakeSR.onerror?.({ error: 'not-allowed' });
    fakeSR.onend?.();
    const res = await promise;
    expect(res).toEqual({ spoken: false, transcription: null });
  });

  it('isSupported === false (둘 다 미지원)', () => {
    delete (globalThis as any).SpeechRecognition;
    (globalThis as any).MediaRecorder = undefined;
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    expect(result.current.isSupported).toBe(false);
  });

  it('cancel() 호출 시 abort 호출', () => {
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    act(() => {
      result.current.start();
    });
    act(() => result.current.cancel());
    expect(fakeSR.abort).toHaveBeenCalled();
  });

  it('isSupported === true (Web Speech 지원 시)', () => {
    const { result } = renderHook(() => useSpeechRecognizer({ lang: 'ko-KR' }));
    expect(result.current.isSupported).toBe(true);
  });
});
