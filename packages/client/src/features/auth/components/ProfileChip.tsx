import { useTranslation } from 'react-i18next';
import type { ChildProfile } from '@tangobook/shared';
import { AvatarRender } from './AvatarRender';

interface Props {
  profile: ChildProfile;
  onClick: () => void;
}

/**
 * 현재 아이 프로필 칩 — 아바타 + 이름 + ⌄. 탭하면 프로필 시트(전환/추가·관리).
 * 헤더 우상단(모바일)·라이브러리 배너(데스크탑)에서 공유한다.
 */
export function ProfileChip({ profile, onClick }: Props) {
  const { t } = useTranslation('shell');
  return (
    <button
      onClick={onClick}
      className="flex max-w-full items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-2.5 shadow-soft transition-all hover:shadow-pop"
      aria-label={t('header.profileMenu', { name: profile.name })}
    >
      <AvatarRender id={profile.avatarId} size="sm" />
      <span className="max-w-[84px] truncate text-sm font-black text-ink-800">{profile.name}</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-ink-400"
        aria-hidden
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}
