import { AVATAR_EMOJI, avatarImageUrl, type AvatarId } from '../lib/avatars';

interface Props {
  id: AvatarId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_MAP = {
  sm: 'w-10 h-10 text-3xl',
  md: 'w-16 h-16 text-5xl',
  lg: 'w-24 h-24 text-6xl',
  xl: 'w-32 h-32 text-7xl',
};

export function AvatarRender({ id, size = 'md' }: Props) {
  const url = avatarImageUrl(id);
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`${SIZE_MAP[size]} object-contain rounded-full bg-peach-100 p-2`}
      />
    );
  }
  return (
    <div className={`${SIZE_MAP[size]} flex items-center justify-center rounded-full bg-peach-100`}>
      <span className="leading-none">{AVATAR_EMOJI[id]}</span>
    </div>
  );
}
