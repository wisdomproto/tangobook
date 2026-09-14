import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';

const LANG_FLAG: Record<string, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  ja: '🇯🇵',
  zh: '🇨🇳',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
};

interface ConfirmModalShellProps {
  title: string;
  emoji: string;
  accentColor: 'emerald' | 'sky' | 'violet';
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  pending?: boolean;
  children: ReactNode;
}

function ConfirmModalShell({
  title,
  emoji,
  accentColor,
  onConfirm,
  onCancel,
  confirmLabel,
  pending,
  children,
}: ConfirmModalShellProps) {
  const accentClasses = {
    emerald:
      'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-300 disabled:bg-emerald-300',
    sky: 'bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-300 disabled:bg-sky-300',
    violet:
      'bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-300 disabled:bg-violet-300',
  }[accentColor];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            {title}
          </h2>
        </div>
        <div className="px-6 py-4 text-sm text-slate-700 dark:text-slate-200 space-y-3">
          {children}
        </div>
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={pending}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-black focus:outline-none focus:ring-2',
              accentClasses
            )}
          >
            {pending ? '진행 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 언어 추가 — 텍스트·TTS 는 언어별로 새로, 삽화는 공유
// ────────────────────────────────────────────────────────────────────────────

export function AddLanguageConfirmModal({
  langCode,
  pending,
  onConfirm,
  onCancel,
}: {
  langCode: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const meta = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
  const flag = LANG_FLAG[langCode] ?? '🌐';
  return (
    <ConfirmModalShell
      title={`${meta?.label ?? langCode} 언어 추가`}
      emoji={flag}
      accentColor="sky"
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmLabel={`${langCode} 추가`}
      pending={pending}
    >
      <p>
        이 책에 <strong>{meta?.label ?? langCode}</strong> ({langCode}) 번역본을 추가합니다.
      </p>
      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-3 space-y-2">
        <p className="font-bold text-sky-900 dark:text-sky-200">
          🌐 가벼움 — 이미지·게임 데이터 모두 공유
        </p>
        <ul className="text-xs text-sky-800 dark:text-sky-300 space-y-1 list-disc pl-5">
          <li>
            <strong>모든 언어 공유:</strong> 캐릭터·표지·페이지 이미지, 핵심단어 이미지, 게임
            이미지, BGM
          </li>
          <li>
            <strong>{langCode} 전용 (새로 필요):</strong> 페이지 텍스트, 표지 제목, 핵심단어 이름,
            페이지 TTS
          </li>
          <li>
            <strong>도구 지원:</strong> 페이지 탭의 "전체 번역", 표지 탭의 "🤖 자동 번역", 핵심단어
            탭의 "🤖 일괄 번역" 으로 한 번에 채울 수 있음 (Gemini)
          </li>
          <li>오디오북·롱폼·게임은 언어별 별도 프로젝트로 만듭니다 (자동 안 됨).</li>
        </ul>
      </div>
    </ConfirmModalShell>
  );
}
