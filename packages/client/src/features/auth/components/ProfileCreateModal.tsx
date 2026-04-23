import { useEffect, useState } from 'react';
import type { ChildProfile, AvatarId } from '@tangobook/shared';
import { AvatarPicker } from './AvatarPicker';
import { cn } from '@/lib/cn';

export interface ProfileInput {
  name: string;
  avatarId: AvatarId;
  birthDate: string | null;
}

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: ChildProfile;
  onSubmit: (input: ProfileInput) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export function ProfileCreateModal({ open, mode, initial, onSubmit, onCancel, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [avatarId, setAvatarId] = useState<AvatarId | null>(initial?.avatarId ?? null);
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setName(initial?.name ?? '');
      setAvatarId(initial?.avatarId ?? null);
      setBirthDate(initial?.birthDate ?? '');
      setBusy(false);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onCancel]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && !!avatarId && !busy;

  const handleSubmit = async () => {
    if (!canSubmit || !avatarId) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        avatarId,
        birthDate: birthDate.trim() === '' ? null : birthDate,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !initial) return;
    const ok = window.confirm(`${initial.name} 프로필을 삭제할까요? 학습 기록도 사라져요.`);
    if (!ok) return;
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-black text-ink-900 mb-4">
          {mode === 'create' ? '아이 프로필 만들기' : '아이 프로필 편집'}
        </h2>
        <div className="space-y-4">
          <AvatarPicker value={avatarId} onChange={setAvatarId} />
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 10))}
            maxLength={10}
            className="w-full px-4 py-3 rounded-xl border-2 border-ink-100 text-ink-900 text-lg font-bold focus:border-coral-500 outline-none"
          />
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-ink-100 text-ink-900 text-lg focus:border-coral-500 outline-none"
          />
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-white border-2 border-ink-100 text-ink-900 font-bold"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'flex-1 py-3 rounded-xl font-black text-white',
              canSubmit ? 'bg-coral-500 hover:brightness-110' : 'bg-ink-300 cursor-not-allowed'
            )}
          >
            {mode === 'create' ? '만들기' : '저장'}
          </button>
        </div>
        {mode === 'edit' && onDelete && (
          <button
            onClick={handleDelete}
            disabled={busy}
            className="mt-3 text-danger text-sm font-bold hover:underline w-full text-center"
          >
            🗑️ 이 프로필 삭제
          </button>
        )}
      </div>
    </div>
  );
}
