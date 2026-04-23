import { AVATAR_IDS, type AvatarId } from '@tangobook/shared';

export { AVATAR_IDS };
export type { AvatarId };

export const AVATAR_EMOJI: Record<AvatarId, string> = {
  hori: '🐯',
  dino: '🦖',
  rabbit: '🐰',
  bear: '🐻',
  cat: '🐱',
  dog: '🐶',
  penguin: '🐧',
  fox: '🦊',
};

export function avatarImageUrl(id: AvatarId): string | null {
  if (id === 'hori') return '/mascot/hori/pointing.webp';
  return null;
}
