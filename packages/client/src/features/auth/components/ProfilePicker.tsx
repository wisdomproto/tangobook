import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChildProfile } from '@tangobook/shared';
import { AvatarRender } from './AvatarRender';

interface Props {
  profiles: ChildProfile[];
  onSelect: (p: ChildProfile) => void;
  onAddNew: () => void;
  /** 있으면 우상단 ✕ 노출 — 헤더 칩에서 수동으로 연 경우(필수 진입 게이트에선 미전달). */
  onClose?: () => void;
}

function ageFromBirth(birthDate: string): number {
  const b = new Date(birthDate);
  const now = new Date();
  return now.getFullYear() - b.getFullYear();
}

export function ProfilePicker({ profiles, onSelect, onAddNew, onClose }: Props) {
  const { t } = useTranslation('auth');
  const canAddNew = profiles.length < 4;

  useEffect(() => {
    if (profiles.length === 0) onAddNew();
  }, [profiles.length, onAddNew]);

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-cream-50 to-peach-100 overflow-auto p-5 sm:p-8">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t('profilePicker.close')}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink-500 shadow-soft hover:text-ink-800"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900 text-center mb-8 break-keep">
          {t('profilePicker.title')}
        </h2>
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
                <div className="text-sm text-ink-500">
                  {t('profilePicker.age', { age: ageFromBirth(p.birthDate) })}
                </div>
              )}
            </button>
          ))}
          {canAddNew && (
            <button
              onClick={onAddNew}
              aria-label={t('profilePicker.addNew')}
              className="bg-white rounded-2xl p-4 shadow-soft hover:scale-105 hover:shadow-pop transition-all flex flex-col items-center justify-center text-5xl text-coral-500 font-black min-h-[160px]"
            >
              +<span className="text-sm text-ink-700 mt-2">{t('profilePicker.addNew')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
