import { useState } from 'react';

interface ImageDescriptionInputProps {
  value?: string;
  onChange: (v: string) => void;
  /** 편집 중 draft 변경을 실시간으로 부모에 알림 (재생성 시 참조용) */
  onDraftChange?: (v: string | undefined) => void;
}

export function ImageDescriptionInput({
  value,
  onChange,
  onDraftChange,
}: ImageDescriptionInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  if (editing) {
    return (
      <div className="space-y-1">
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            onDraftChange?.(e.target.value);
          }}
          rows={2}
          className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 resize-none focus:ring-1 focus:ring-violet-400 focus:outline-none"
          placeholder="이미지 설명 (영어)"
        />
        <div className="flex gap-1">
          <button
            onClick={() => {
              onChange(draft);
              onDraftChange?.(undefined);
              setEditing(false);
            }}
            className="px-2 py-0.5 text-[10px] font-medium rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60"
          >
            저장
          </button>
          <button
            onClick={() => {
              setDraft(value ?? '');
              onDraftChange?.(undefined);
              setEditing(false);
            }}
            className="px-2 py-0.5 text-[10px] font-medium rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(value ?? '');
        setEditing(true);
      }}
      className="w-full text-left text-[10px] text-slate-400 dark:text-slate-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors truncate"
      title={value || '이미지 설명 추가'}
    >
      {value ? `📝 ${value}` : '+ 이미지 설명 추가'}
    </button>
  );
}
