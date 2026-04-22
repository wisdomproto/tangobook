import type { MutableRefObject } from 'react';
import { useCallback, useMemo, useRef } from 'react';

export interface SpeechResult {
  spoken: boolean;
  transcription: string | null;
}

export interface UseSpeechRecognizerOptions {
  lang: 'ko-KR' | 'en-US';
  silenceTimeoutMs?: number; // Whisper 전용
  noSpeechTimeoutMs?: number;
  maxWaitMs?: number; // 공통 하드 cap, 기본 10000
}

type SRConstructor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
  onnomatch: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getSpeechRecognition(): SRConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
}

function hasMediaRecorder(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).MediaRecorder !== 'undefined';
}

export function useSpeechRecognizer(opts: UseSpeechRecognizerOptions): {
  start: () => Promise<SpeechResult>;
  cancel: () => void;
  isSupported: boolean;
} {
  const activeRef = useRef<{ abort: () => void } | null>(null);

  const isSupported = useMemo(() => !!getSpeechRecognition() || hasMediaRecorder(), []);

  const start = useCallback(async (): Promise<SpeechResult> => {
    const SR = getSpeechRecognition();
    if (SR) return runWebSpeech(opts, activeRef);
    if (hasMediaRecorder()) return runWhisperFallback(opts, activeRef);
    return { spoken: false, transcription: null };
  }, [opts.lang, opts.silenceTimeoutMs, opts.noSpeechTimeoutMs, opts.maxWaitMs]);

  const cancel = useCallback(() => {
    activeRef.current?.abort();
    activeRef.current = null;
  }, []);

  return { start, cancel, isSupported };
}

function runWebSpeech(
  opts: UseSpeechRecognizerOptions,
  activeRef: MutableRefObject<{ abort: () => void } | null>
): Promise<SpeechResult> {
  const SR = getSpeechRecognition()!;
  return new Promise<SpeechResult>((resolve) => {
    let resolved = false;
    let transcription: string | null = null;

    // `SR`는 실제 브라우저에서는 생성자지만, 테스트에서 vi.fn(() => fakeSR) 같은 팩토리 형태도 지원.
    // new로 먼저 시도하고 실패하면 함수로 호출.
    let rec: any;
    try {
      rec = new (SR as any)();
    } catch {
      rec = (SR as any)();
    }
    rec.lang = opts.lang;
    rec.continuous = false;
    rec.interimResults = false;

    const resolveOnce = (result: SpeechResult) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(cap);
      activeRef.current = null;
      resolve(result);
    };

    rec.onresult = (e: any) => {
      try {
        transcription = e.results?.[0]?.[0]?.transcript?.trim() || null;
      } catch {
        transcription = null;
      }
    };
    rec.onend = () => {
      resolveOnce({ spoken: !!transcription, transcription: transcription || null });
    };
    rec.onerror = () => {
      resolveOnce({ spoken: false, transcription: null });
    };
    rec.onnomatch = () => {
      resolveOnce({ spoken: false, transcription: null });
    };

    const cap = setTimeout(() => {
      try {
        rec.abort();
      } catch {
        /* noop */
      }
      resolveOnce({ spoken: false, transcription: null });
    }, opts.maxWaitMs ?? 10000);

    activeRef.current = {
      abort: () => {
        try {
          rec.abort();
        } catch {
          /* noop */
        }
        resolveOnce({ spoken: false, transcription: null });
      },
    };

    try {
      rec.start();
    } catch {
      resolveOnce({ spoken: false, transcription: null });
    }
  });
}

async function runWhisperFallback(
  opts: UseSpeechRecognizerOptions,
  activeRef: MutableRefObject<{ abort: () => void } | null>
): Promise<SpeechResult> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    return { spoken: false, transcription: null };
  }

  const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  const supported =
    typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
      ? preferredTypes.find((t) => MediaRecorder.isTypeSupported(t))
      : undefined;
  const recorder = supported
    ? new MediaRecorder(stream, { mimeType: supported })
    : new MediaRecorder(stream);

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // Silence detection via Web Audio analyser (RMS)
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  const buffer = new Uint8Array(analyser.fftSize);

  let lastVoiceAt = performance.now();
  let voiceDetectedOnce = false;

  const cleanup = () => {
    stream.getTracks().forEach((t) => t.stop());
    try {
      audioCtx.close();
    } catch {
      /* noop */
    }
  };

  return new Promise<SpeechResult>((resolve) => {
    let resolved = false;
    const resolveOnce = (r: SpeechResult) => {
      if (resolved) return;
      resolved = true;
      clearInterval(poll);
      clearTimeout(cap);
      cleanup();
      activeRef.current = null;
      resolve(r);
    };

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || supported || 'audio/webm';
      const blob = new Blob(chunks, { type: mimeType });
      try {
        const form = new FormData();
        const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        form.append('audio', blob, `audio.${ext}`);
        form.append('lang', opts.lang.split('-')[0]);
        const res = await fetch('/api/speaking/transcribe', { method: 'POST', body: form });
        if (!res.ok) return resolveOnce({ spoken: false, transcription: null });
        const json = await res.json();
        const transcription = json?.data?.transcription || null;
        resolveOnce({ spoken: !!transcription, transcription });
      } catch {
        resolveOnce({ spoken: false, transcription: null });
      }
    };

    const silenceMs = opts.silenceTimeoutMs ?? 2000;
    const noSpeechMs = opts.noSpeechTimeoutMs ?? 5000;
    const maxMs = opts.maxWaitMs ?? 10000;

    const poll = setInterval(() => {
      analyser.getByteTimeDomainData(buffer);
      // RMS
      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / buffer.length);
      const threshold = 0.05; // 경험값. 환경에 따라 조정 필요 — 수동 QA로 조정
      if (rms > threshold) {
        lastVoiceAt = performance.now();
        voiceDetectedOnce = true;
      } else if (voiceDetectedOnce && performance.now() - lastVoiceAt > silenceMs) {
        try {
          recorder.stop();
        } catch {
          /* noop */
        }
      } else if (!voiceDetectedOnce && performance.now() - lastVoiceAt > noSpeechMs) {
        try {
          recorder.stop();
        } catch {
          /* noop */
        }
      }
    }, 100);

    const cap = setTimeout(() => {
      try {
        recorder.stop();
      } catch {
        /* noop */
      }
    }, maxMs);

    activeRef.current = {
      abort: () => {
        try {
          recorder.stop();
        } catch {
          /* noop */
        }
      },
    };

    recorder.start();
  });
}
