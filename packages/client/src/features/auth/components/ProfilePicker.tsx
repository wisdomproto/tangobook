import { useEffect } from 'react';
import type { ChildProfile } from '@tangobook/shared';
import { AvatarRender } from './AvatarRender';

interface Props {
  profiles: ChildProfile[];
  onSelect: (p: ChildProfile) => void;
  onAddNew: () => void;
}

function ageFromBirth(birthDate: string | null): string {
  if (!birthDate) return '';
  const b = new Date(birthDate);
  const now = new Date();
  const diff = now.getFullYear() - b.getFullYear();
  return `만 ${diff}세`;
}

export function ProfilePicker({ profiles, onSelect, onAddNew }: Props) {
  const canAddNew = profiles.length < 4;

  useEffect(() => {
    if (profiles.length === 0) onAddNew();
  }, [profiles.length, onAddNew]);

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-cream-50 to-peach-100 overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-ink-900 text-center mb-8">누가 놀고 있어요?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="bg-white rounded-2xl p-4 shadow-soft hover:scale-105 hover:shadow-pop transition-all flex flex-col items-center gap-2"
            >
              <AvatarRender id={p.avatarId} size="lg" />
              <div className="text-xl font-black text-ink-900">{p.name}</div>
              {p.birthDate && (
                <div className="text-sm text-ink-500">{ageFromBirth(p.birthDate)}</div>
              )}
            </button>
          ))}
          {canAddNew && (
            <button
              onClick={onAddNew}
              aria-label="새 아이 추가"
              className="bg-white rounded-2xl p-4 shadow-soft hover:scale-105 hover:shadow-pop transition-all flex flex-col items-center justify-center text-5xl text-coral-500 font-black min-h-[160px]"
            >
              +<span className="text-sm text-ink-700 mt-2">새 아이 추가</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
