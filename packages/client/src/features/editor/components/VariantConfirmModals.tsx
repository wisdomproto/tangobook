import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import type { ReadingLevel } from '@tangobook/shared';

const LEVEL_INFO: Record<ReadingLevel, { label: string; age: string; emoji: string }> = {
  L1: { label: '씨앗', age: '3~4세', emoji: '📗' },
  L2: { label: '새싹', age: '4~6세', emoji: '📘' },
  L3: { label: '나무', age: '6~7세', emoji: '📙' },
};

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
// 레벨 추가 — 가장 무거움 (완전 새 콘텐츠)
// ────────────────────────────────────────────────────────────────────────────

export function AddLevelConfirmModal({
  level,
  baseTitle,
  pending,
  onConfirm,
  onCancel,
}: {
  level: ReadingLevel;
  baseTitle: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const info = LEVEL_INFO[level];
  return (
    <ConfirmModalShell
      title={`${level} ${info.label} (${info.age}) 레벨 추가`}
      emoji={info.emoji}
      accentColor="emerald"
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmLabel={`${level} 만들기`}
      pending={pending}
    >
      <p>
        <strong>"{baseTitle}"</strong> 의 <strong>{level}</strong> 레벨을 새로 추가합니다.
      </p>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
        <p className="font-bold text-amber-900 dark:text-amber-200">
          ⚠️ 이건 거의 새 책을 만드는 작업이에요
        </p>
        <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-disc pl-5">
          <li>
            <strong>새로 작성 필요:</strong> 페이지 텍스트, 페이지 일러스트, TTS, 핵심단어 이미지,
            오디오북·롱폼·게임
          </li>
          <li>
            <strong>재사용 됨:</strong> 카테고리/폴더/캐릭터 디자인 컨셉/메타 정보 (base에서 복사)
          </li>
          <li>
            기존 base의 페이지·이미지·TTS는 <strong>비워진 상태</strong>로 만들어집니다 — 레벨에
            맞게 다시 작성/생성하세요.
          </li>
        </ul>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        ID 규칙:{' '}
        <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{`{baseId}__${level}`}</code>{' '}
        sibling storybook 으로 저장됨.
      </p>
    </ConfirmModalShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 언어 추가 — 중간 무게 (텍스트/TTS만)
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

// ────────────────────────────────────────────────────────────────────────────
// 그림체 추가 — availableStyles 에 push (텍스트/TTS 공유, 일러스트만 새로)
// ────────────────────────────────────────────────────────────────────────────

export function AddStyleConfirmModal({
  presetId,
  presetLabel,
  presetPrompt,
  pending,
  onConfirm,
  onCancel,
}: {
  presetId: string;
  presetLabel: string;
  presetPrompt: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmModalShell
      title={`${presetLabel} 그림체 추가`}
      emoji="🎨"
      accentColor="violet"
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmLabel={`${presetLabel} 추가`}
      pending={pending}
    >
      <p>
        이 책에 <strong>{presetLabel}</strong> 그림체를 새 옵션으로 추가합니다.
      </p>
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3 space-y-2">
        <p className="font-bold text-violet-900 dark:text-violet-200">
          🎨 가벼움 — 텍스트·TTS·페이지 구조 그대로 공유
        </p>
        <ul className="text-xs text-violet-800 dark:text-violet-300 space-y-1 list-disc pl-5">
          <li>
            <strong>모든 그림체 공유:</strong> 페이지 텍스트, TTS, 핵심단어 이름, 게임 데이터,
            오디오북 텍스트
          </li>
          <li>
            <strong>{presetLabel} 전용 (새로 필요):</strong> 표지·캐릭터·페이지 일러스트·핵심단어
            이미지
          </li>
          <li>
            추가 후 활성 그림체로 전환됨. 캐릭터/표지/페이지 탭의 <strong>재생성 버튼</strong>으로
            일러스트만 새로 만들 수 있음.
          </li>
          <li>
            ⚠️ <strong>현재 한계:</strong> 한 책당 자산은 한 셋만 저장됨. 그림체별 일러스트 독립
            보존(이전 그림체 일러스트 보관)은 후속.
          </li>
        </ul>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        프롬프트:{' '}
        <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{presetPrompt}</code>
      </p>
      <input type="hidden" data-preset-id={presetId} />
    </ConfirmModalShell>
  );
}
